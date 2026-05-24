import { Zap, Users, Package, AlertCircle, TrendingUp, MapPin, ShieldCheck, CheckCircle2, Navigation, ReceiptText, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api-client";
import type { DeliveryLocation } from "@/lib/location-types";
import MapPreview from "./MapPreview";

import { 
  VehicleType, 
  DeliveryMode, 
  ServiceOption, 
} from "../config/businessRules";
import { 
  calculatePricing, 
  PricingBreakdown 
} from "../utils/pricingCalculations";

const FALLBACK_HUBS = [
  { id: "9c9b9999-9999-9999-9999-999999999901", name: "PakiShip Cubao Hub", address: "Aurora Blvd, Cubao, Quezon City, Metro Manila", distance: "Nearby", status: "Open", capacity: "100", latitude: 14.6219, longitude: 121.0511 },
  { id: "9c9b9999-9999-9999-9999-999999999902", name: "PakiShip BGC Hub", address: "26th St, Bonifacio Global City, Taguig, Metro Manila", distance: "Nearby", status: "Open", capacity: "150", latitude: 14.5496, longitude: 121.0437 },
  { id: "9c9b9999-9999-9999-9999-999999999903", name: "PakiShip Makati Hub", address: "Ayala Ave, Makati, Metro Manila", distance: "Nearby", status: "Open", capacity: "120", latitude: 14.5547, longitude: 121.0244 },
  { id: "9c9b9999-9999-9999-9999-999999999904", name: "PakiShip SM North Hub", address: "SM North EDSA, North Ave, Quezon City, Metro Manila", distance: "Nearby", status: "Open", capacity: "120", latitude: 14.6565, longitude: 121.0298 },
];

type HubOption = {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: string;
  capacity: string;
  latitude?: number;
  longitude?: number;
};

interface DeliveryServiceSelectorProps {
  distanceKm: number; 
  onSelect: (serviceId: string, price: number, options?: any) => void;
  onConfirm?: (serviceId: string, finalPrice: number, options?: any) => void;
  selectedService: string;
  packageSize?: "small" | "medium" | "large" | "xl";
  totalParcels: number;
  onSelectDropOffPoint: (hub: any) => void;
  onSelectPickupHub?: (hub: any) => void;
  selectedDropOffPoint: any | null;
  selectedPickupHub?: any | null;
  pickupLocation?: DeliveryLocation | null;
  deliveryLocation?: DeliveryLocation | null;
  estimatedDuration?: string;
  hasApprovedSenderDiscount?: boolean;
  isSurgeActive?: boolean;
  selectedCategory?: string;
  cartItems?: Array<{ itemType: string; [key: string]: any }>; 
}

export default function DeliveryServiceSelector({
  distanceKm = 0,
  onSelect,
  onConfirm,
  selectedService,
  packageSize = "small",
  totalParcels = 1,
  onSelectDropOffPoint,
  onSelectPickupHub,
  selectedDropOffPoint,
  selectedPickupHub,
  pickupLocation,
  deliveryLocation,
  estimatedDuration,
  hasApprovedSenderDiscount = false,
  isSurgeActive = false,
  selectedCategory = "general",
  cartItems = [],
}: DeliveryServiceSelectorProps) {
  const [availableHubs, setAvailableHubs] = useState<HubOption[]>(FALLBACK_HUBS);
  const [isOptimizingRelayHubs, setIsOptimizingRelayHubs] = useState(false);
  const [relayHubError, setRelayHubError] = useState<string | null>(null);
  const [showHubRoute, setShowHubRoute] = useState(false);
  const isXLPackage = packageSize === "xl";

  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const radiusKm = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return radiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 1.35;
  };

  const withDistanceFrom = (hub: HubOption, location: DeliveryLocation) => {
    if (typeof hub.latitude !== "number" || typeof hub.longitude !== "number") {
      return null;
    }

    const distance = calculateHaversine(location.lat!, location.lng!, hub.latitude, hub.longitude);
    return { ...hub, distance: `${distance.toFixed(1)} km`, distanceValue: distance };
  };

  const findNearestHub = (location?: DeliveryLocation | null, excludeIds: string[] = []) => {
    if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
      return null;
    }

    return availableHubs.reduce<HubOption | null>((nearest, hub) => {
      if (excludeIds.includes(hub.id)) {
        return nearest;
      }

      const candidate = withDistanceFrom(hub, location);
      if (!candidate) {
        return nearest;
      }

      const currentDistance = nearest
        ? Number((nearest as HubOption & { distanceValue?: number }).distanceValue ?? Number.POSITIVE_INFINITY)
        : Number.POSITIVE_INFINITY;

      return candidate.distanceValue < currentDistance ? candidate : nearest;
    }, null);
  };

  useEffect(() => {
    let isMounted = true;

    const loadHubs = async () => {
      try {
        const response = await apiFetch("/api/parcel-drafts/hubs");
        const result = await response.json();

        if (!response.ok) {
          return;
        }

        if (isMounted && Array.isArray(result.hubs) && result.hubs.length > 0) {
          setAvailableHubs(result.hubs);
        }
      } catch {
        if (isMounted) {
          setAvailableHubs(FALLBACK_HUBS);
        }
      }
    };

    void loadHubs();

    return () => {
      isMounted = false;
    };
  }, []);

  const isSensitiveItem = useMemo(() => {
    if (cartItems && cartItems.length > 0) {
      return cartItems.some(item => {
        const typeString = item.type || item.itemType || ""; 
        return ["food", "fragile"].includes(typeString.toLowerCase());
      });
    }
    return ["food", "fragile"].includes((selectedCategory || "").toLowerCase());
  }, [cartItems, selectedCategory]);

  const [selectedVehicle] = useState<VehicleType>(
    isXLPackage ? VehicleType.SEDAN : VehicleType.MOTORCYCLE
  );

  const safeDistance = distanceKm || 0;
  const relayHops = 2;

  const getPricingData = (id: string): PricingBreakdown => {
    const params = {
      isSurgeActive,
      packageSize,
      distanceKm: safeDistance,
    };

    if (id === "pakishare") {
      return calculatePricing({
        ...params,
        vehicleType: VehicleType.PUV_RELAY,
        deliveryMode: DeliveryMode.RELAY,
        serviceOption: ServiceOption.CHEAP,
        hops: relayHops,
        applyDiscount: hasApprovedSenderDiscount,
      });
    } else {
      return calculatePricing({
        ...params,
        vehicleType: isXLPackage ? selectedVehicle : VehicleType.MOTORCYCLE,
        deliveryMode: DeliveryMode.DIRECT,
        serviceOption: ServiceOption.FAST,
        applyDiscount: false,
      });
    }
  };

  const currentPricing = useMemo(() => {
    if (!selectedService) return null;
    return getPricingData(selectedService);
  }, [selectedService, totalParcels, packageSize, isSurgeActive, safeDistance, hasApprovedSenderDiscount]);

  // Updated useEffect to include allowCash logic
  useEffect(() => {
    if (selectedService && currentPricing) {
      const finalPrice = (currentPricing.finalTotal || 0) * (totalParcels || 1);
      onSelect(selectedService, finalPrice, {
        hub: selectedDropOffPoint,
        pickupHub: selectedPickupHub,
        vehicleType: selectedVehicle,
        // LOGIC SYNC: Only PakiExpress allows Cash
        allowCash: selectedService === "PakiExpress",
        isValid: selectedService === "pakishare"
          ? (!!selectedPickupHub && !!selectedDropOffPoint && selectedPickupHub.id !== selectedDropOffPoint.id && !isSensitiveItem)
          : true
      });
    }
  }, [selectedService, selectedDropOffPoint, selectedPickupHub, currentPricing, totalParcels, isSensitiveItem]);

  useEffect(() => {
    if (isSensitiveItem && selectedService !== "PakiExpress") {
      const pricing = getPricingData("PakiExpress");
      const price = (pricing.finalTotal || 0) * (totalParcels || 1);
      onSelect("PakiExpress", price, {
        hub: selectedDropOffPoint,
        vehicleType: selectedVehicle,
        allowCash: true,
        isValid: true
      });
    }
  }, [isSensitiveItem, selectedService, totalParcels]);

  useEffect(() => {
    if (selectedService !== "pakishare") return;

    const pickupHub = findNearestHub(pickupLocation);
    const deliveryHub = findNearestHub(
      deliveryLocation,
      pickupHub ? [pickupHub.id] : [],
    );

    if (pickupHub) {
      onSelectPickupHub?.(pickupHub);
    }
    if (deliveryHub) {
      onSelectDropOffPoint(deliveryHub);
    }
  }, [
    availableHubs,
    deliveryLocation?.lat,
    deliveryLocation?.lng,
    pickupLocation?.lat,
    pickupLocation?.lng,
    selectedService,
  ]);

  useEffect(() => {
    if (selectedService !== "pakishare" || !pickupLocation || !deliveryLocation) {
      setIsOptimizingRelayHubs(false);
      setRelayHubError(null);
      return;
    }

    let cancelled = false;
    const previewRelayHubs = async () => {
      setIsOptimizingRelayHubs(true);
      setRelayHubError(null);

      try {
        const response = await apiFetch("/api/parcel-drafts/pakishare/preview", {
          method: "POST",
          body: JSON.stringify({ pickupLocation, deliveryLocation }),
        });
        const result = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setRelayHubError(result.message || "Unable to optimize the PakiShare hubs.");
          return;
        }

        onSelectPickupHub?.(result.pickupHub ?? null);
        onSelectDropOffPoint(result.dropOffPoint ?? null);
      } catch {
        if (!cancelled) {
          setRelayHubError("Unable to optimize the PakiShare hubs.");
        }
      } finally {
        if (!cancelled) {
          setIsOptimizingRelayHubs(false);
        }
      }
    };

    void previewRelayHubs();

    return () => {
      cancelled = true;
    };
  }, [
    deliveryLocation?.address,
    deliveryLocation?.lat,
    deliveryLocation?.lng,
    pickupLocation?.address,
    pickupLocation?.lat,
    pickupLocation?.lng,
    selectedService,
  ]);

  const services = [
    { 
      id: "pakishare", 
      name: "PakiShare", 
      icon: <Users className="w-5 h-5" />, 
      desc: "2-Hub Relay", 
      time: "ETA after hub optimization", 
      available: !isSensitiveItem,
      note: isSensitiveItem 
        ? "Strictly no Food/Fragile items allowed" 
        : totalParcels > 1 ? "Available for multiple parcels" : null,
      rules: ["2 closest hubs", "Digital Payment Only", "Receiver hub pickup"]
    },
    { 
      id: "PakiExpress", 
      name: "PakiExpress", 
      icon: <Zap className="w-5 h-5" />, 
      desc: "Direct Delivery", 
      time: estimatedDuration || "Google route ETA", 
      available: true,
      note: totalParcels > 3 && !isSensitiveItem ? "Available for 10+ parcels" : null,
      rules: ["₱50 Base + ₱10/km", "Cash on Delivery OK", "Safe for Food & Fragile"]
    },
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-2xl shadow-gray-200/50 space-y-6 relative overflow-visible font-sans">
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#041614] tracking-tight">Select delivery service</h2>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 border border-gray-100">
              <Navigation className="w-3 h-3" /> {safeDistance.toFixed(1)} km
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-400 border border-gray-100">
              <Package className="w-3 h-3" /> {totalParcels} {totalParcels === 1 ? 'unit' : 'units'}
            </span>
            {isSensitiveItem && (
               <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 rounded-lg text-[10px] font-bold text-orange-600 border border-orange-100">
                <AlertCircle className="w-3 h-3" /> PakiExpress Required
              </span>
            )}
          </div>
        </div>
        {isSurgeActive && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-xl border border-red-100">
            <TrendingUp className="w-4 h-4 animate-bounce" />
            <span className="text-[10px] font-bold">Peak Surge (+₱20)</span>
          </div>
        )}
      </div>

      {/* SERVICE CARDS */}
      <div className="grid gap-3">
        {services.map((service) => {
          const pricing = getPricingData(service.id);
          const price = (pricing.finalTotal || 0) * (totalParcels || 1);
          const isSelected = selectedService === service.id;

          return (
            <div key={service.id} className="relative">
              <button
                type="button"
                disabled={!service.available}
                onClick={() => onSelect(service.id, price, { allowCash: service.id === "PakiExpress" })}
                className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  isSelected 
                  ? "border-[#39B5A8] bg-[#F0F9F8] shadow-md ring-4 ring-[#39B5A8]/5" 
                  : "border-gray-50 bg-gray-50/40 hover:border-gray-200 hover:bg-white"
                } ${!service.available ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isSelected ? "bg-[#39B5A8] text-white scale-105 shadow-lg shadow-[#39B5A8]/20" : "bg-white text-gray-400 border border-gray-100"
                  }`}>
                    {service.icon}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold text-base ${isSelected ? "text-[#041614]" : "text-gray-500"}`}>
                        {service.name}
                      </p>
                      {service.id === "pakibusiness" && totalParcels >= 10 && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-600 text-[9px] font-bold rounded-md uppercase">
                          35% OFF
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium text-gray-400">{service.desc}</span>
                      <span className="w-1 h-1 bg-gray-200 rounded-full" />
                      <span className="text-[11px] font-bold text-[#39B5A8]">{service.time}</span>
                    </div>
                    {service.note && (
                      <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${service.available ? "text-[#39B5A8]" : "text-red-500"}`}>
                        <AlertCircle className="w-3 h-3" /> {service.note}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-xl font-bold text-[#041614]">₱{Math.round(price)}</p>
                  <span className="text-[9px] text-gray-400 font-bold tracking-tight">Per {totalParcels > 1 ? 'Batch' : 'Delivery'}</span>
                </div>
              </button>

              {isSelected && (
                <div className="mt-3 px-4 py-3 bg-white border border-gray-100 rounded-xl flex flex-wrap gap-x-4 gap-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  {service.rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[#39B5A8]" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{rule}</span>
                    </div>
                  ))}
                </div>
              )}

              {service.id === "pakishare" && isSelected && (
                <div className="mt-3 px-2 animate-in zoom-in-95 duration-200">
                  <div
                    className={`w-full rounded-xl border-2 border-dashed p-4 transition-all ${
                      selectedPickupHub && selectedDropOffPoint
                      ? "border-[#39B5A8] bg-white text-[#041614]"
                      : "border-orange-200 bg-orange-50/30"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2 text-[#39B5A8]">
                      <MapPin className="h-3.5 w-3.5" />
                      <p className="text-[10px] font-black uppercase">
                        Automatic Hub Route
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 text-left">
                        <p className="text-sm font-black text-[#041614]">
                          {selectedPickupHub?.name || "Nearest Hub"} ➔ {selectedDropOffPoint?.name || "Nearest Hub"}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-gray-400">
                          {isOptimizingRelayHubs
                            ? "Finding the closest sender and receiver hubs..."
                            : "Automatically routed via nearest PakiHubs"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!selectedPickupHub || !selectedDropOffPoint}
                        onClick={() => setShowHubRoute(true)}
                        className="h-10 shrink-0 rounded-xl border border-[#39B5A8]/20 bg-[#F0F9F8] px-4 text-xs font-black text-[#1A5D56] transition hover:border-[#39B5A8]/50 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        View Hub Route
                      </button>
                    </div>
                    {relayHubError && (
                      <p className="mt-3 text-left text-[10px] font-bold text-red-500">{relayHubError}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PRICING BREAKDOWN SECTION */}
      {selectedService && currentPricing && (
        <div className="bg-[#F8FAFC] rounded-[1.5rem] p-5 border border-gray-100 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200/50">
             <ReceiptText className="w-4 h-4 text-gray-400" />
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Bill Summary</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 font-medium">Subtotal (Net)</span>
              <span className="text-[#041614] font-bold">
                ₱{Math.round((currentPricing.subtotal || 0) * (totalParcels || 1))}
              </span>
            </div>

            {isSurgeActive && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-400 font-medium">Peak Surge Fee</span>
                <span className="text-red-500 font-bold">+₱{20 * (totalParcels || 1)}</span>
              </div>
            )}

            {(currentPricing.discount || 0) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#39B5A8] font-medium">Discount applied</span>
                <span className="text-[#39B5A8] font-bold">
                  -₱{Math.round((currentPricing.discount || 0) * (totalParcels || 1))}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 font-medium">VAT (12%)</span>
              <span className="text-[#041614] font-bold">
                ₱{Math.round((currentPricing.vat || 0) * (totalParcels || 1))}
              </span>
            </div>

            <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-base font-bold text-[#041614]">Total Amount</span>
              <div className="text-right">
                <span className="text-2xl font-black text-[#39B5A8]">
                  ₱{Math.round((currentPricing.finalTotal || 0) * (totalParcels || 1))}
                </span>
                <p className="text-[10px] text-gray-400 font-bold -mt-1 uppercase tracking-tighter">Philippine Peso</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-4 border border-gray-100">
        <div className="p-2 bg-white rounded-lg shadow-sm">
           <ShieldCheck className="w-4 h-4 text-[#39B5A8]" />
        </div>
        <div>
           <p className="text-[11px] font-bold text-[#041614] mb-0.5">PakiShip Transparency</p>
           <p className="text-[11px] font-medium text-gray-400 leading-tight">
             Base rates adjusted for <b>{packageSize}</b> size. {isXLPackage ? "XL items restricted to Sedan/SUV only." : "Real-time tracking included."}
          </p>
        </div>
      </div>

      {showHubRoute && selectedPickupHub && selectedDropOffPoint && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#041614]/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-white p-4 shadow-2xl md:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-[#39B5A8]">
                  Automatic Hub Route
                </p>
                <h3 className="text-xl font-black text-[#041614]">
                  PakiShare Hub Route
                </h3>
                <p className="mt-1 text-sm font-bold text-gray-500">
                  {selectedPickupHub.name} ➔ {selectedDropOffPoint.name}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close hub route"
                onClick={() => setShowHubRoute(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition hover:bg-[#F0F9F8] hover:text-[#1A5D56]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[72vh] overflow-hidden rounded-[1.5rem] border-4 border-[#F0F9F8]">
              <MapPreview
                pickupAddress={selectedPickupHub.address}
                deliveryAddress={selectedDropOffPoint.address}
                pickupLocation={{
                  address: selectedPickupHub.address,
                  lat: selectedPickupHub.latitude,
                  lng: selectedPickupHub.longitude,
                }}
                deliveryLocation={{
                  address: selectedDropOffPoint.address,
                  lat: selectedDropOffPoint.latitude,
                  lng: selectedDropOffPoint.longitude,
                }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
