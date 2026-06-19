import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  Navigation,
  Loader2,
  Target,
  Search,
  Clock,
  User,
  Phone,
  DollarSign,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ShieldCheck,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router";

// Components
import { CustomerPageHeader } from "../components/CustomerPageHeader";
import OnboardingModal from "../components/OnboardingModal";
import PackageDetails, {
  PackageDetails as PackageDetailsType,
} from "../components/PackageDetails";
import ParcelCart from "../components/ParcelCart";
import AddToCartModal from "../components/AddToCartModal";
import DeliveryServiceSelector from "../components/DeliveryServiceSelector";
import MapPreview from "../components/MapPreview";
import DropOffPointSelector from "../components/DropOffPointSelector";
import DropOffQRModal from "../components/DropOffQRModal";
import BookingConfirmationModal from "../components/BookingConfirmationModal";
import PaymentMethodSelector from "../components/PaymentMethodSelector";
import LocationPickerModal from "../components/LocationPickerModal";
import { apiFetch } from "@/lib/api-client";
import { fetchCustomerProfile } from "@/lib/customer-profile";
import type { DeliveryLocation } from "@/lib/location-types";

// Assets
const logo = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";
const bgPattern = "/assets/c0b51290435a7f3be0323503d9a2ad52d73b4b97.png";

interface CartItem extends PackageDetailsType {
  id: string;
}

export function SendParcelPage() {
  const navigate = useNavigate();

  // UI State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showLocationPicker, setShowLocationPicker] =
    useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingStep1, setIsSavingStep1] = useState(false);
  const [isSavingStep2, setIsSavingStep2] = useState(false);
  const [isSavingStep4, setIsSavingStep4] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [busyCartItemId, setBusyCartItemId] = useState<string | null>(null);
  const [selectingFor, setSelectingFor] = useState<
    "pickup" | "delivery" | null
  >(null);

  // Toast Notification State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Booking Data State
  const [pickupLocation, setPickupLocation] = useState<DeliveryLocation | null>(
    null,
  );
  const [deliveryLocation, setDeliveryLocation] =
    useState<DeliveryLocation | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedService, setSelectedService] =
    useState<string>("");
  const [servicePrice, setServicePrice] = useState<number>(175);
  const [distance, setDistance] = useState<string>("Route pending");
  const [duration, setDuration] = useState<string>("ETA pending");

  // Drop-off & Confirmation State
  const [selectedDropOffPoint, setSelectedDropOffPoint] =
    useState<any>(null);
  const [selectedPickupHub, setSelectedPickupHub] = useState<any>(null);
  const [showDropOffSelector, setShowDropOffSelector] =
    useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [showBookingReview, setShowBookingReview] = useState(false);
  const [showBookingConfirmation, setShowBookingConfirmation] =
    useState(false);
  const [bookingConfirmationData, setBookingConfirmationData] =
    useState<any>(null);

  // Contact Form State
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [hasApprovedSenderDiscount, setHasApprovedSenderDiscount] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [codPayer, setCodPayer] = useState<"sender" | "receiver" | null>(null);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(
      "pakiship_onboarding_completed",
    );
    if (!hasSeenOnboarding) setShowOnboarding(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSenderDefaults = async () => {
      try {
        const result = await fetchCustomerProfile();
        if (!isMounted) return;

        setSenderName((prev) => prev || result.profile.fullName || "");
        setSenderPhone((prev) => prev || result.profile.phone || "");
        setHasApprovedSenderDiscount(result.profile.discountIdStatus === "verified");
      } catch {
        // Keep sender fields manual if the profile request fails.
      }
    };

    void loadSenderDefaults();

    return () => {
      isMounted = false;
    };
  }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    if (errorTimeoutRef.current)
      clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMsg(null);
    }, 4000);
  };

  const handleOpenLocationPicker = (
    type: "pickup" | "delivery",
  ) => {
    setSelectingFor(type);
    setShowLocationPicker(true);
  };

  const handleRouteMetricsUpdate = (eta: string, distanceText: string) => {
    if (distanceText) {
      setDistance(distanceText);
    }

    if (eta) {
      setDuration(eta);
    }
  };

  const handleContinueFromPackageDetails = async (
    details: PackageDetailsType,
  ) => {
    if (!draftId) {
      showError("Please complete route details first.");
      return;
    }

    setIsSavingStep2(true);

    try {
      const response = await apiFetch(`/api/parcel-drafts/${draftId}/items`, {
        method: "POST",
        body: JSON.stringify({
          ...details,
          photoName: details.photo?.name ?? null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        showError(result.message || "Unable to save parcel details.");
        return;
      }

      const savedItemId = String(result.itemId ?? Date.now());

      const nextItem = { ...details, id: savedItemId };

      const existingIndex = cartItems.findIndex(
        (item) =>
          item.size === details.size &&
          item.itemType === details.itemType &&
          item.deliveryGuarantee === details.deliveryGuarantee,
      );
      if (existingIndex !== -1) {
        const newCart = [...cartItems];
        newCart[existingIndex].quantity += details.quantity;
        setCartItems(newCart);
      } else {
        setCartItems([...cartItems, nextItem]);
      }
      setCurrentStep(3);
    } catch {
      showError("Unable to save parcel details.");
    } finally {
      setIsSavingStep2(false);
    }
  };

  const handleContinueFromStep1 = async () => {
    if (!pickupLocation || !deliveryLocation) {
      showError(
        "Please select both pickup and delivery locations to continue.",
      );
      return;
    }

    setIsSavingStep1(true);

    try {
      let resolvedDistance = distance;
      let resolvedDuration = duration;

      if (
        !resolvedDistance ||
        resolvedDistance === "Route pending" ||
        !resolvedDuration ||
        resolvedDuration === "ETA pending"
      ) {
        const estimateResponse = await apiFetch("/api/parcel-drafts/estimate-route", {
          method: "POST",
          body: JSON.stringify({
            pickupLocation,
            deliveryLocation,
          }),
        });
        const estimateResult = await estimateResponse.json();

        if (!estimateResponse.ok) {
          showError(estimateResult.message || "Unable to estimate route details.");
          return;
        }

        resolvedDistance = estimateResult.distanceText;
        resolvedDuration = estimateResult.durationText;
      }

      const response = await apiFetch("/api/parcel-drafts/step-1", {
        method: "POST",
        body: JSON.stringify({
          draftId,
          pickupLocation,
          deliveryLocation,
          distance: resolvedDistance,
          duration: resolvedDuration,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        showError(result.message || "Unable to save route details.");
        return;
      }

      setDraftId(result.draftId);
      setDistance(result.distance || resolvedDistance);
      setDuration(result.duration || resolvedDuration);
      setCurrentStep(2);
    } catch {
      showError("Unable to save route details.");
    } finally {
      setIsSavingStep1(false);
    }
  };

  useEffect(() => {
    if (!draftId) return;

    const loadDraft = async () => {
      setIsLoadingDraft(true);
      try {
        const response = await apiFetch(`/api/parcel-drafts/${draftId}`);
        const result = await response.json();

        if (!response.ok) {
          return;
        }

        if (result.draft?.pickupLocation) {
          setPickupLocation(result.draft.pickupLocation);
        }
        if (result.draft?.deliveryLocation) {
          setDeliveryLocation(result.draft.deliveryLocation);
        }
        if (Array.isArray(result.draft?.items)) {
          setCartItems(result.draft.items);
        }
        if (result.draft?.distance) {
          setDistance(result.draft.distance);
        }
        if (result.draft?.duration) {
          setDuration(result.draft.duration);
        }
      } finally {
        setIsLoadingDraft(false);
      }
    };

    void loadDraft();
  }, [draftId]);

  const handleUpdateCartQuantity = async (itemId: string, quantity: number) => {
    if (!draftId) return;

    setBusyCartItemId(itemId);
    try {
      const response = await apiFetch(
        `/api/parcel-drafts/${draftId}/items/${itemId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ quantity }),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        showError(result.message || "Unable to update parcel quantity.");
        return;
      }

      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: result.quantity } : item,
        ),
      );
    } catch {
      showError("Unable to update parcel quantity.");
    } finally {
      setBusyCartItemId(null);
    }
  };

  const handleRemoveCartItem = async (itemId: string) => {
    if (!draftId) return;

    setBusyCartItemId(itemId);
    try {
      const response = await apiFetch(
        `/api/parcel-drafts/${draftId}/items/${itemId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();
      if (!response.ok) {
        showError(result.message || "Unable to remove parcel item.");
        return;
      }

      setCartItems((prev) => prev.filter((item) => item.id !== result.itemId));
    } catch {
      showError("Unable to remove parcel item.");
    } finally {
      setBusyCartItemId(null);
    }
  };

  const handleContinueFromStep4 = async () => {
    if (!draftId) {
      showError("Please complete the earlier steps first.");
      return;
    }

    if (!selectedService) {
      showError("Please select a delivery service to continue.");
      return;
    }

    setIsSavingStep4(true);

    try {
      const response = await apiFetch(`/api/parcel-drafts/${draftId}/service`, {
        method: "POST",
        body: JSON.stringify({
          serviceId: selectedService,
          servicePrice,
          pickupLocation,
          deliveryLocation,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        showError(result.message || "Unable to save delivery service.");
        return;
      }

      if (selectedService === "pakishare") {
        setSelectedPickupHub(result.service?.pickupHub ?? null);
        setSelectedDropOffPoint(result.service?.dropOffPoint ?? null);
        if (result.service?.routeEstimate?.distanceText) {
          setDistance(result.service.routeEstimate.distanceText);
        }
        if (result.service?.routeEstimate?.durationText) {
          setDuration(result.service.routeEstimate.durationText);
        }
      }

      setCurrentStep(5);
    } catch {
      showError("Unable to save delivery service.");
    } finally {
      setIsSavingStep4(false);
    }
  };

  const validateFinalBookingDetails = () => {
    if (!draftId) {
      showError("Please complete the earlier steps first.");
      return false;
    }

    if (!selectedPaymentMethod) {
      showError("Please select a payment method before continuing.");
      return false;
    }

    if (selectedPaymentMethod === "cash" && !codPayer) {
      showError("Please choose whether the sender or receiver will pay for COD.");
      return false;
    }

    if (cartItems.length === 0) {
      showError("Please add at least one parcel before continuing.");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFinalBookingDetails()) return;
    setShowBookingReview(true);
  };

  const handleConfirmBooking = async () => {
    if (!validateFinalBookingDetails() || !draftId) return;

    setIsSubmittingBooking(true);

    try {
      const totalParcels = cartItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      const response = await apiFetch(`/api/parcel-drafts/${draftId}/booking`, {
        method: "POST",
        body: JSON.stringify({
          senderName,
          senderPhone,
          receiverName,
          receiverPhone,
          paymentMethod: selectedPaymentMethod,
          paymentResponsibility:
            selectedPaymentMethod === "cash" ? codPayer : null,
          selectedService,
          servicePrice,
          totalParcels,
          distance,
          duration,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        showError(result.message || "Unable to complete booking.");
        return;
      }

      setBookingConfirmationData({
        trackingNumber: result.trackingNumber,
        senderName,
        receiverName,
        totalParcels,
        distance,
        duration,
        servicePrice,
        selectedService: result.booking?.selectedService ?? selectedService,
        dropOffPoint: result.booking?.dropOffPoint ?? null,
        dropOffInstructions: result.booking?.dropOffInstructions ?? [],
        dropOffDeadlineAt: result.booking?.dropOffDeadlineAt ?? null,
        dropOffDeadlineLabel: result.booking?.dropOffDeadlineLabel ?? null,
      });
      setShowBookingReview(false);
      setShowBookingConfirmation(true);

      const checkoutUrl = result.payment?.checkoutUrl;
      if (typeof checkoutUrl === "string" && checkoutUrl.length > 0) {
        window.location.href = checkoutUrl;
      }
    } catch {
      showError("Unable to complete booking.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const stepTitles = [
    "Where to?",
    "Add Parcels",
    "Your Cart",
    "Select Service",
    "Contact Info",
  ];
  const orderPreviewId = useMemo(() => {
    if (!draftId) return "0000";

    const numeric = draftId.replace(/\D/g, "");
    if (!numeric) return "0000";

    return numeric.slice(-4).padStart(4, "0");
  }, [draftId]);

  // Reusable Tailwind classes
  const inputClasses =
    "w-full px-4 py-3 border border-[#39B5A8]/20 rounded-xl focus:outline-none focus:border-[#39B5A8] bg-white transition-colors font-medium";
  const labelClasses =
    "block text-sm font-bold text-[#1A5D56] mb-2 ml-1";
  const primaryBtnClasses =
    "w-full h-16 rounded-2xl bg-[#39B5A8] hover:bg-[#2D8F85] text-white font-bold text-lg shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2";
  const secondaryBtnClasses =
    "w-full h-16 rounded-2xl border-2 border-[#39B5A8]/20 text-[#1A5D56] font-bold text-lg hover:bg-[#F0F9F8] hover:border-[#39B5A8]/40 transition-all flex items-center justify-center gap-2";

  return (
    <div
      className="min-h-screen w-full bg-[#F0F9F8] text-[#1A5D56] font-sans overflow-x-hidden relative"
      style={{
        backgroundImage: `url(${bgPattern})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Custom Toast Notification */}
      {errorMsg && (
        <div className="fixed top-24 left-0 right-0 flex justify-center z-[100] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-none px-4">
          <div className="bg-white border-l-4 border-red-500 shadow-xl rounded-2xl px-5 py-4 flex items-center gap-3 max-w-md w-full pointer-events-auto">
            <div className="bg-red-50 rounded-full p-2 shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm font-bold text-gray-800 flex-1">
              {errorMsg}
            </p>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

<CustomerPageHeader
  logo={logo}
  // This ensures the header uses the icon box on the right
  icon={Send} 
  // Matches the Step titles from your array
  stepTitles={stepTitles}
  currentStep={currentStep}
  // Optional: Add a specific subtitle or let the component 
  // handle the "Step X of Y" logic we built
  subtitle={`Step ${currentStep} of ${stepTitles.length}`}
  onBack={() =>
    currentStep === 1
      ? navigate("/customer/home")
      : setCurrentStep(currentStep - 1)
  }
/>

      {/* Main Container */}
      <main className="w-full max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2.5 rounded-full transition-all duration-500 ${step === currentStep ? "w-12 bg-[#39B5A8]" : step < currentStep ? "w-3 bg-[#1A5D56]" : "w-3 bg-[#39B5A8]/20"}`}
            />
          ))}
        </div>

        {/* Step 1: Location Selection */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-4 md:gap-6 mb-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#FDB833]/10 flex items-center justify-center shrink-0">
                <MapPin className="w-7 h-7 md:w-8 md:h-8 text-[#39B5A8]" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#041614]">
                  Route Details
                </h2>
                <p className="text-[#39B5A8] font-bold">
                  Where should we pick up and deliver?
                </p>
              </div>
            </div>

            <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
              <button
                onClick={() =>
                  handleOpenLocationPicker("pickup")
                }
                className="w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 border-[#F0F9F8] hover:border-[#39B5A8]/30 bg-[#F0F9F8]/50 transition-all text-left group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6 text-[#39B5A8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Pickup From
                  </p>
                  <p
                    className={`font-bold truncate ${pickupLocation ? "text-[#041614]" : "text-gray-400"}`}
                  >
                    {pickupLocation?.address ||
                      "Select pickup location"}
                  </p>
                </div>
              </button>

              <button
                onClick={() =>
                  handleOpenLocationPicker("delivery")
                }
                className="w-full flex items-center gap-4 p-4 md:p-5 rounded-2xl border-2 border-[#F0F9F8] hover:border-[#FDB833]/30 bg-[#F0F9F8]/50 transition-all text-left group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Target className="w-5 h-5 md:w-6 md:h-6 text-[#FDB833]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Deliver To
                  </p>
                  <p
                    className={`font-bold truncate ${deliveryLocation ? "text-[#041614]" : "text-gray-400"}`}
                  >
                    {deliveryLocation?.address ||
                      "Select delivery location"}
                  </p>
                </div>
              </button>
            </div>

            {pickupLocation && deliveryLocation && (
              <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                <MapPreview
                  pickupAddress={pickupLocation.address}
                  deliveryAddress={deliveryLocation.address}
                  pickupLocation={pickupLocation}
                  deliveryLocation={deliveryLocation}
                  estimatedTime={duration}
                  onETAUpdate={handleRouteMetricsUpdate}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/customer/home")}
                className={secondaryBtnClasses}
              >
                Cancel
              </button>
              <button
                onClick={handleContinueFromStep1}
                disabled={isSavingStep1}
                className={primaryBtnClasses}
              >
                {isSavingStep1 ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Package Details */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in w-full">
            <PackageDetails
              onContinue={handleContinueFromPackageDetails}
              onBack={() => setCurrentStep(1)}
              key={draftId ?? "new-draft"}
            />
            {isSavingStep2 && (
              <div className="flex items-center justify-center gap-3 text-sm font-bold text-[#39B5A8]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving parcel details...
              </div>
            )}
          </div>
        )}

        {/* Step 3: Your Cart */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in w-full">
            {isLoadingDraft && (
              <div className="flex items-center justify-center gap-3 text-sm font-bold text-[#39B5A8]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading cart...
              </div>
            )}
            <ParcelCart
              items={cartItems}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveCartItem}
              onContinue={() =>
                cartItems.length > 0
                  ? setCurrentStep(4)
                  : showError(
                      "Please add at least one parcel to continue.",
                    )
              }
              busyItemId={busyCartItemId}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentStep(2)}
                className={secondaryBtnClasses}
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={() =>
                  cartItems.length > 0
                    ? setCurrentStep(4)
                    : showError(
                        "Please add at least one parcel to continue.",
                      )
                }
                className={primaryBtnClasses}
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Service Selection */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in w-full">
            <DeliveryServiceSelector
              distanceKm={
                parseFloat(distance.replace(/[^\d.]/g, "")) ||
                12.5
              }
              onSelect={(id, price, options) => {
                setSelectedService(id);
                setServicePrice(price);
                if (options?.pickupHub) {
                  setSelectedPickupHub(options.pickupHub);
                }
                if (options?.hub) {
                  setSelectedDropOffPoint(options.hub);
                }
              }}
              selectedService={selectedService}
              totalParcels={cartItems.reduce(
                (sum, item) => sum + item.quantity,
                0,
              )}
              packageSize={
                cartItems.some((item) => item.size === "XL")
                  ? "xl"
                  : cartItems.some((item) => item.size === "L")
                    ? "large"
                    : cartItems.some((item) => item.size === "M")
                      ? "medium"
                  : "small"
              }
              onSelectDropOffPoint={(hub) =>
                setSelectedDropOffPoint(hub)
              }
              onSelectPickupHub={(hub) => setSelectedPickupHub(hub)}
              selectedDropOffPoint={selectedDropOffPoint}
              selectedPickupHub={selectedPickupHub}
              pickupLocation={pickupLocation}
              deliveryLocation={deliveryLocation}
              estimatedDuration={duration === "ETA pending" ? undefined : duration}
              hasApprovedSenderDiscount={hasApprovedSenderDiscount}
              isSurgeActive={false}
              cartItems={cartItems}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setCurrentStep(3)}
                className={secondaryBtnClasses}
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={handleContinueFromStep4}
                disabled={isSavingStep4}
                className={primaryBtnClasses}
              >
                {isSavingStep4 ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Contact Info */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-in fade-in w-full">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-12 shadow-sm space-y-10">
                <div>
                  <h2 className="text-xl font-bold text-[#041614] mb-6 flex items-center gap-3">
                    <User className="w-6 h-6 text-[#39B5A8]" />{" "}
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className={labelClasses}>
                        Sender Name
                      </label>
                      <input
                        value={senderName}
                        onChange={(e) =>
                          setSenderName(e.target.value)
                        }
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>
                        Sender Phone
                      </label>
                      <input
                        value={senderPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(
                            /\D/g,
                            "",
                          ); // Remove non-digits
                          if (val.length <= 11)
                            setSenderPhone(val); // Strict limit
                        }}
                        placeholder="09*********"
                        className={inputClasses}
                        type="tel"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>
                        Receiver Name
                      </label>
                      <input
                        value={receiverName}
                        onChange={(e) =>
                          setReceiverName(e.target.value)
                        }
                        className={inputClasses}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={labelClasses}>
                        Receiver Phone
                      </label>
                      <input
                        value={receiverPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(
                            /\D/g,
                            "",
                          ); // Remove non-digits
                          if (val.length <= 11)
                            setReceiverPhone(val); // Strict limit
                        }}
                        placeholder="09*********"
                        className={inputClasses}
                        type="tel"
                        required
                      />
                    </div>
                  </div>
                </div>

                <PaymentMethodSelector
                  selectedMethod={selectedPaymentMethod}
                  onSelect={setSelectedPaymentMethod}
                  codPayer={codPayer}
                  onSelectCodPayer={setCodPayer}
                  selectedServiceId={selectedService}
                  receiverName={receiverName}
                  receiverPhone={receiverPhone}
                  onReceiverChange={(data) => {
                    setReceiverName(data.name);
                    setReceiverPhone(data.phone);
                  }}
                />

                <div className="space-y-8 max-w-185 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* PROFESSIONAL RECEIPT CARD */}
                  <div className="relative bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/40">
                    {/* Top Brand & Status Section */}
                    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                          Order Summary
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400">
                          ID: #PAK-{orderPreviewId}
                        </span>
                      </div>

                      {/* Simplified Line Items */}
                        <div className="space-y-3 mb-6">
                          {[
                            {
                              label: "Service",
                              value: selectedService 
                                ? selectedService.charAt(0).toUpperCase() + selectedService.slice(1).replace(/_/g, ' ') 
                                : "Direct Delivery",
                            },
                            {
                              label: "Items",
                              value: `${cartItems.reduce((sum, item) => sum + item.quantity, 0).toString().padStart(2, '0')} Parcels`,
                            },
                            {
                              label: "Payment",
                              value:
                                selectedPaymentMethod === "cash"
                                  ? `COD - ${codPayer === "sender" ? "Sender" : codPayer === "receiver" ? "Receiver" : "Select payer"}`
                                  : selectedPaymentMethod
                                    ? selectedPaymentMethod.toUpperCase()
                                    : "Not selected",
                            },
                            { label: "Route", value: distance || "0.0 km" },
                          ].map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between text-xs font-medium"
                            >
                              <span className="text-slate-400">
                                {item.label}
                              </span>
                              <span className="text-slate-800 font-bold">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>

                      {/* Total Only */}
                      <div className="pt-5 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-900 uppercase">
                          Total Due
                        </span>
                        <div className="text-[#39B5A8] font-black text-2xl tracking-tighter">
                          ₱{servicePrice}.00
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="flex-1 h-14 rounded-2xl text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-300"
                    >
                      Cancel & Review
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingBooking}
                      className="flex-[1.5] h-14 rounded-2xl bg-slate-900 text-white text-sm font-black shadow-2xl shadow-slate-900/20 hover:bg-[#39B5A8] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                      {isSubmittingBooking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          Review Details
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Modals */}
      <DropOffPointSelector
        isOpen={showDropOffSelector}
        onClose={() => setShowDropOffSelector(false)}
        onSelect={setSelectedDropOffPoint}
      />
      {showQRModal && (
        <DropOffQRModal
          isOpen={showQRModal}
          onClose={() => navigate("/customer/dashboard")}
          bookingData={bookingData}
        />
      )}
      {showBookingReview && (
        <BookingReviewModal
          senderName={senderName}
          senderPhone={senderPhone}
          receiverName={receiverName}
          receiverPhone={receiverPhone}
          pickupAddress={pickupLocation?.address ?? "Pickup address not set"}
          deliveryAddress={deliveryLocation?.address ?? "Delivery address not set"}
          cartItems={cartItems}
          selectedService={selectedService}
          selectedPaymentMethod={selectedPaymentMethod}
          codPayer={codPayer}
          servicePrice={servicePrice}
          distance={distance}
          duration={duration}
          pickupHub={selectedPickupHub}
          dropOffPoint={selectedDropOffPoint}
          isSubmitting={isSubmittingBooking}
          onClose={() => setShowBookingReview(false)}
          onConfirm={handleConfirmBooking}
        />
      )}
      {showBookingConfirmation && (
        <BookingConfirmationModal
          isOpen={showBookingConfirmation}
          onClose={() => navigate("/customer/home")}
          bookingDetails={{
            ...bookingConfirmationData,
            totalCost: servicePrice,
          }}
        />
      )}
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => setShowOnboarding(false)}
        />
      )}
      {showLocationPicker && selectingFor && (
        <LocationPickerModal
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onSelect={
            selectingFor === "pickup"
              ? setPickupLocation
              : setDeliveryLocation
          }
          type={selectingFor}
        />
      )}
    </div>
  );
}

function formatServiceLabel(serviceId: string) {
  if (!serviceId) return "Direct Delivery";
  if (serviceId === "pakishare") return "PakiShare Relay";
  if (serviceId === "pakibusiness") return "PakiBusiness";
  return serviceId.charAt(0).toUpperCase() + serviceId.slice(1).replace(/_/g, " ");
}

function formatPaymentLabel(method: string, codPayer: "sender" | "receiver" | null) {
  if (method === "cash") {
    return `Cash on Delivery - ${codPayer === "sender" ? "Sender pays" : "Receiver pays"}`;
  }

  return method ? method.toUpperCase() : "Not selected";
}

function BookingReviewModal({
  senderName,
  senderPhone,
  receiverName,
  receiverPhone,
  pickupAddress,
  deliveryAddress,
  cartItems,
  selectedService,
  selectedPaymentMethod,
  codPayer,
  servicePrice,
  distance,
  duration,
  pickupHub,
  dropOffPoint,
  isSubmitting,
  onClose,
  onConfirm,
}: {
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  cartItems: CartItem[];
  selectedService: string;
  selectedPaymentMethod: string;
  codPayer: "sender" | "receiver" | null;
  servicePrice: number;
  distance: string;
  duration: string;
  pickupHub: any;
  dropOffPoint: any;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const totalParcels = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isRelay = selectedService === "pakishare";

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden bg-slate-900/60 p-3 backdrop-blur-md"
      style={{ zIndex: 9999 }}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl"
        style={{ height: "420px", maxHeight: "70dvh" }}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">
              Review before booking
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Confirm parcel details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="min-h-0 flex-1 space-y-3 overscroll-contain px-4 py-3 sm:px-5"
          style={{ overflowY: "auto" }}
        >
          <div className="grid gap-3">
            <ReviewPanel title="Sender Contact">
              <ReviewLine label="Name" value={senderName} />
              <ReviewLine label="Phone" value={senderPhone} />
              <ReviewLine label="Pickup" value={pickupAddress} />
            </ReviewPanel>
            <ReviewPanel title="Receiver Contact">
              <ReviewLine label="Name" value={receiverName} />
              <ReviewLine label="Phone" value={receiverPhone} />
              <ReviewLine label="Delivery" value={deliveryAddress} />
            </ReviewPanel>
          </div>

          <ReviewPanel title="Parcel Breakdown">
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black capitalize text-slate-900">{item.itemType}</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-[#39B5A8]">
                      Qty {item.quantity}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1 text-xs font-bold text-slate-500">
                    <span>Size: {item.size}</span>
                    <span>Weight: {String(item.weight)}</span>
                    <span className="capitalize">Cover: {item.deliveryGuarantee}</span>
                  </div>
                </div>
              ))}
            </div>
          </ReviewPanel>

          <div className="grid gap-3">
            <ReviewPanel title="Service & Payment">
              <ReviewLine label="Service" value={formatServiceLabel(selectedService)} />
              <ReviewLine label="Payment" value={formatPaymentLabel(selectedPaymentMethod, codPayer)} />
              <ReviewLine label="Distance" value={distance} />
              <ReviewLine label="ETA" value={duration} />
            </ReviewPanel>
            <ReviewPanel title="PakiShare Route">
              {isRelay && dropOffPoint ? (
                <>
                  <ReviewLine label="Sender hub" value={pickupHub?.name ?? "Nearest sender hub"} />
                  <ReviewLine label="Final hub" value={dropOffPoint.name} />
                  <ReviewLine label="Pickup address" value={dropOffPoint.address} />
                </>
              ) : (
                <p className="text-sm font-bold text-slate-500">
                  Direct delivery. No customer drop-off hub required.
                </p>
              )}
            </ReviewPanel>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-[#F0F9F8] px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">
                Total
              </p>
              <p className="text-sm font-bold text-slate-500">{totalParcels} parcel(s)</p>
            </div>
            <p className="text-2xl font-black text-[#39B5A8]">₱{servicePrice}.00</p>
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border-2 border-slate-200 py-3 text-sm font-black text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            Edit Details
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-[1.2] rounded-xl bg-slate-900 px-4 py-2.5 text-center font-black leading-tight text-white shadow-xl shadow-slate-200 hover:bg-[#39B5A8] disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="block text-[11px] uppercase tracking-[0.08em]">
                Creating...
              </span>
            ) : (
              <span className="block text-xs uppercase tracking-[0.08em]">
                Confirm
                <br />
                Booking
              </span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ReviewPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </p>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value || "Not provided"}</p>
    </div>
  );
}
