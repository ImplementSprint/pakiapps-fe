import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router";
import { toast } from "sonner";
import mascotWelcome  from '../../assets/7259599c331fe2220a1e67c176ecdd5a016523b9.png';
import mascotPeace    from '../../assets/1a225237b1a301618213cb958e754ea4a9496674.png';
import mascotParking  from '../../assets/2f36e075afb851770b0825e8580b43ef7b12efb3.png';
import mascotThumbsUp from '../../assets/0084ccce0fa13239c14a85e550a3b1813304f544.png';
import { CustomerSettings } from "./CustomerSettings";
import { MyBookings } from "./MyBookings";
import { CustomerHeader } from "../components/customer/CustomerHeader";
import { VehicleManagement } from "../components/customer/VehicleManagement";
import { QuickActionsMenu } from "../components/customer/QuickActionsMenu";
import { RecentBookings } from "../components/customer/RecentBookings";
import { RateAndReview } from "../components/customer/RateAndReview";
import { LocationModal } from "../components/customer/LocationModal";
import { VehicleModal } from "../components/customer/VehicleModal";
import { CustomerTutorial } from "../components/customer/CustomerTutorial";
import { vehicleService } from "../services/vehicleService";
import { bookingService } from "../services/bookingService";
import { locationService } from "../services/locationService";
import { reviewService } from "../services/reviewService";
import { BackendStatus } from "../components/BackendStatus";

export function CustomerHome() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orInputRef = useRef<HTMLInputElement>(null);
  const crInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"home" | "bookings" | "settings">("home");
  const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

   // --- TUTORIAL STATE ---
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // --- DATA ---
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);

  // Fetch locations from API
  useEffect(() => {
    locationService.getLocations({ status: 'active' }).then((data) => {
      if (data && data.length > 0) {
        setAvailableLocations(data.map((loc: any) => ({
          id: loc._id,
          name: loc.name,
          address: loc.address,
          hourlyRate: loc.hourlyRate,
          availableSpots: loc.availableSpots,
          totalSpots: loc.totalSpots,
          distance: "",
        })));
      }
    }).catch((err: any) => {
      toast.error(err?.message || 'Could not load parking locations. Is the backend running?');
      setApiError(err?.message || 'Could not load parking locations');
    });
  }, []);

  // --- USER DATA SYNC ---
  const [profile, setProfile] = useState({
    name: localStorage.getItem("userName") || "Guest User",
    profilePic:
      localStorage.getItem("customerProfilePicture") ||
      localStorage.getItem("userProfilePic") ||
      null,
  });

  useEffect(() => {
    const handleStorageSync = () => {
      setProfile({
        name: localStorage.getItem("userName") || "Guest User",
        profilePic:
          localStorage.getItem("customerProfilePicture") ||
          localStorage.getItem("userProfilePic") ||
          null,
      });
    };
    window.addEventListener("storage", handleStorageSync);
    handleStorageSync();
    return () => window.removeEventListener("storage", handleStorageSync);
  }, []);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("hasSeenTutorial");
    if (!hasSeenTutorial) setShowTutorial(true);
  }, []);

  const handleProfilePicUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfile((prev) => ({ ...prev, profilePic: base64 }));
        localStorage.setItem("userProfilePic", base64);
        localStorage.setItem("customerProfilePicture", base64);
        window.dispatchEvent(new Event("storage"));
        toast.success("Profile picture updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  // ── VEHICLES STATE ─────────────────────────────────────────────────────
  const [showCarModal,     setShowCarModal]     = useState(false);
  const [editingCarIndex,  setEditingCarIndex]  = useState<number | null>(null);
  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const [cars,             setCars]             = useState<any[]>([]);   // starts empty — filled from API
  const [loadingVehicles,  setLoadingVehicles]  = useState(true);

  // Fetch only the current user's vehicles from the API
  useEffect(() => {
    setLoadingVehicles(true);
    vehicleService.getMyVehicles()
      .then(data => {
        setCars(data ?? []);
        // Reset selection if the previously selected index no longer exists
        setSelectedCarIndex(i => (data?.length ? Math.min(i, data.length - 1) : 0));
      })
      .catch(() => {
        setCars([]);  // show empty state instead of leaking other users' data
      })
      .finally(() => setLoadingVehicles(false));
  }, []);

  const [carFormData, setCarFormData] = useState({
    brand: "",
    model: "",
    color: "",
    plateNumber: "",
    type: "sedan",
    orDoc: null as string | null,
    crDoc: null as string | null,
  });

  const mockRecentBookings: any[] = [];  // no dummy booking data
  const [recentBookings, setRecentBookings] = useState(mockRecentBookings);

  // Fetch recent bookings from API on mount
  useEffect(() => {
    bookingService.getMyBookings({ page: 1 }).then((data) => {
      if (data?.bookings && data.bookings.length > 0) {
        setRecentBookings(data.bookings.slice(0, 3).map((b: any) => ({
          loc: b.locationId?.name || b.spot || "Parking",
          date: new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " • " + (b.timeSlot || ""),
          price: String(b.amount || 0),
        })));
      }
    }).catch(() => { /* keep empty array on error */ });
  }, []);

  const handleDocUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "orDoc" | "crDoc"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit.");
        return;
      }
      setCarFormData({ ...carFormData, [field]: file.name });
      toast.success(`${field === "orDoc" ? "OR" : "CR"} selected.`);
    }
  };

  const handleSaveCar = async () => {
    const cleanPlate = carFormData.plateNumber.trim().toUpperCase();
    const plateRegex = /^[A-Z0-9]{2,4}[ ]?[0-9]{3,4}$|^[A-Z0-9]{1,8}$/;
    if (!cleanPlate || cleanPlate.length < 4 || cleanPlate.length > 8 || !plateRegex.test(cleanPlate)) {
      toast.error("Invalid Plate Number.");
      return;
    }

    const finalData = { ...carFormData, plateNumber: cleanPlate };

    try {
      if (editingCarIndex !== null && cars[editingCarIndex]?._id) {
        // Update existing vehicle via API
        await vehicleService.updateVehicle(cars[editingCarIndex]._id, finalData);
      } else {
        // Add new vehicle via API
        await vehicleService.addVehicle(finalData);
      }
      // Re-fetch the user's vehicles from the API to stay in sync
      const freshVehicles = await vehicleService.getMyVehicles();
      setCars(freshVehicles);
    } catch {
      toast.error("Could not save vehicle. Please try again.");
      return; // don't close the modal on failure
    }

    setShowCarModal(false);
    setEditingCarIndex(null);
    setCarFormData({ brand: "", model: "", color: "", plateNumber: "", type: "sedan", orDoc: null, crDoc: null });
    toast.success("Vehicle saved successfully!");
  };

  const handleDeleteVehicle = async (index: number) => {
    if (cars.length <= 1) {
      toast.error("You must have at least one vehicle.");
      return;
    }

    try {
      if (cars[index]?._id) {
        await vehicleService.deleteVehicle(cars[index]._id);
        const freshVehicles = await vehicleService.getMyVehicles();
        setCars(freshVehicles);
        localStorage.setItem("userCars", JSON.stringify(freshVehicles));
      } else {
        throw new Error("No _id");
      }
    } catch {
      const updatedCars = cars.filter((_: any, i: number) => i !== index);
      setCars(updatedCars);
      localStorage.setItem("userCars", JSON.stringify(updatedCars));
    }
    if (selectedCarIndex >= cars.length - 1) setSelectedCarIndex(0);
    toast.success("Vehicle deleted.");
  };

  const handleSelectLocation = (locationName: string, locationId: string) => {
    setSelectedLocation(locationName);
    setShowLocationModal(false);
    // Navigate directly to unified booking — pass name, id, and hourlyRate so
    // UnifiedBooking can display and charge the correct rate
    const activeCar = cars[selectedCarIndex];
    const locData = availableLocations.find((l: any) => String(l.id) === String(locationId));
    navigate('/customer/booking/reserve', {
      state: {
        vehicle:    activeCar,
        location:   locationName,
        locationId,
        hourlyRate: locData?.hourlyRate ?? 50,
      },
    });
  };

  const handleReviewSubmit = async (data: { rating: number; comment: string }) => {
    try {
      await reviewService.createReview({ rating: data.rating, comment: data.comment });
    } catch {
      console.log("Review saved locally (backend unavailable):", data);
    }
    toast.success("Thank you for your feedback!");
    setShowReviewModal(false);
  };

  // --- TUTORIAL CONTENT ---
  const tutorialSteps = [
    {
      title: "Welcome to PakiPark",
      description:
        "This tutorial will guide you through the main features of PakiPark. Ready to start?",
      mascot: mascotWelcome,
      targetId: null,
    },
    {
      title: "Manage Your Vehicles",
      description:
        "Click 'Add New' to register your vehicles. Select a vehicle from your list to make it the active one.",
      mascot: mascotPeace,
      targetId: "btn-add-vehicle",
    },
    {
      title: "Find a Location",
      description:
        "Ready to park? Click the orange 'Reserve Now' button to search and select your preferred parking location.",
      mascot: mascotParking,
      targetId: "btn-reserve-now",
    },
    {
      title: "Reserve a 1-Hour Slot",
      description:
        "Pick a date and choose a 1-hour time slot. Arrive anytime within your window — stay longer and pay for extra time used.",
      mascot: mascotThumbsUp,
      targetId: null,
    },
  ];

  const getHighlightStyle = (id: string) => {
    if (showTutorial && tutorialSteps[tutorialStep].targetId === id) {
      return "relative z-[301] ring-4 ring-[#ee6b20] ring-offset-4 ring-offset-[#f9fafb] pointer-events-none transition-all duration-300";
    }
    return "";
  };

  const finishTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
    localStorage.setItem("hasSeenTutorial", "true");
  };

  const openTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };

  const [coords, setCoords] = useState({
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  });

  useEffect(() => {
    if (showTutorial) {
      const step = tutorialSteps[tutorialStep];
      if (step.targetId) {
        const element = document.getElementById(step.targetId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const boxWidth = 340;

          let leftPos = rect.left + rect.width / 2;

          if (step.targetId === "btn-reserve-now") {
            leftPos = leftPos - 130;
          }

          leftPos = Math.max(
            boxWidth / 2 + 20,
            Math.min(window.innerWidth - (boxWidth / 2 + 20), leftPos)
          );

          setCoords({
            top: `${rect.bottom + 20}px`,
            left: `${leftPos}px`,
            transform: "translateX(-50%)",
          });
        }
      } else {
        setCoords({
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        });
      }
    }
  }, [showTutorial, tutorialStep]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {apiError && (
        <BackendStatus
          error={apiError}
          onRetry={() => { setApiError(null); window.location.reload(); }}
        />
      )}
      {!apiError && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleProfilePicUpdate}
            accept="image/png, image/jpeg"
            className="hidden"
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {activeTab === "home" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <CustomerHeader
                  userName={profile.name}
                  profilePicture={profile.profilePic}
                  onProfilePicClick={() => fileInputRef.current?.click()}
                  onGuideClick={openTutorial}
                  onReserveClick={() => setShowLocationModal(true)}
                  reserveHighlightClass={getHighlightStyle("btn-reserve-now")}
                />

                <VehicleManagement
                  cars={cars}
                  selectedCarIndex={selectedCarIndex}
                  setSelectedCarIndex={setSelectedCarIndex}
                  onAddVehicle={() => {
                    setEditingCarIndex(null);
                    setCarFormData({
                      brand: "",
                      model: "",
                      color: "",
                      plateNumber: "",
                      type: "sedan",
                      orDoc: null,
                      crDoc: null,
                    });
                    setShowCarModal(true);
                  }}
                  onEditVehicle={(index) => {
                    setEditingCarIndex(index);
                    setCarFormData(cars[index]);
                    setShowCarModal(true);
                  }}
                  onDeleteVehicle={handleDeleteVehicle}
                  highlightClass={getHighlightStyle("btn-add-vehicle")}
                  isLoading={loadingVehicles}
                />

                <QuickActionsMenu 
                  onReserveClick={() => setShowLocationModal(true)} // Opens the location picker you already have
                  onMyBookingsClick={() => setActiveTab("bookings")} // Switches to the Bookings tab internally
                  onRateReviewClick={() => setShowReviewModal(true)} // Opens the full-screen review
                />

                <RecentBookings
                  bookings={recentBookings}
                  onViewAll={() => navigate("/customer/bookings")}
                />
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="animate-in fade-in duration-500">
                <MyBookings />
              </div>
            )}

            {activeTab === "settings" && (
              <div className="animate-in fade-in duration-500">
                <CustomerSettings
                  activeSettingsPage={activeSettingsPage}
                  setActiveSettingsPage={setActiveSettingsPage}
                />
              </div>
            )}
          </main>

          <CustomerTutorial
            isOpen={showTutorial}
            onClose={finishTutorial}
            currentStep={tutorialStep}
            onNext={() => setTutorialStep((prev) => prev + 1)}
            onBack={() => setTutorialStep((prev) => prev - 1)}
            steps={tutorialSteps}
            coords={coords}
          />

          <VehicleModal
            isOpen={showCarModal}
            onClose={() => setShowCarModal(false)}
            onSave={handleSaveCar}
            formData={carFormData}
            setFormData={setCarFormData}
            isEditing={editingCarIndex !== null}
            orInputRef={orInputRef}
            crInputRef={crInputRef}
            onDocUpload={handleDocUpload}
          />

          <LocationModal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            onSelectLocation={handleSelectLocation}
            locations={availableLocations}
          />

          {/* 1. RATE & REVIEW FULL SCREEN */}
          <RateAndReview
            isOpen={showReviewModal} 
            onClose={() => setShowReviewModal(false)} 
            onSubmit={handleReviewSubmit} 
          />

          {/* Backend Status Indicator */}
        </> 
      )}
    </div>
  );
}
