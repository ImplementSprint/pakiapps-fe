import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  Map,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import type { DeliveryLocation } from "@/lib/location-types";
import { apiFetch } from "@/lib/api-client";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: DeliveryLocation) => void;
  type: "pickup" | "delivery";
}

const popularLocations: DeliveryLocation[] = [
  { address: "BGC, Taguig City", details: "Bonifacio Global City" },
  { address: "Makati Central Business District", details: "Ayala Avenue" },
  { address: "Ortigas Center, Pasig City", details: "Business District" },
  { address: "SM Mall of Asia, Pasay", details: "Entertainment Complex" },
  { address: "Quezon City Memorial Circle", details: "Quezon City" },
  { address: "Intramuros, Manila", details: "Historic District" },
  { address: "Alabang Town Center, Muntinlupa", details: "Shopping District" },
  { address: "UP Diliman, Quezon City", details: "University Area" },
];

type MapsPrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export default function LocationPickerModal({
  isOpen,
  onClose,
  onSelect,
  type,
}: LocationPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<MapsPrediction[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!isOpen) return null;

  const filteredLocations = popularLocations.filter(
    (location) =>
      location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.details?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    if (!isOpen) return;

    const query = searchQuery.trim();
    if (query.length < 2) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await apiFetch(
          `/api/parcel-drafts/maps/autocomplete?query=${encodeURIComponent(query)}`,
        );
        const result = await response.json();
        if (!cancelled && response.ok) {
          setPredictions(Array.isArray(result.predictions) ? result.predictions : []);
        }
      } catch {
        if (!cancelled) setPredictions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOpen, searchQuery]);

  const showError = (message: string) => {
    setErrorMsg(message);
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => setErrorMsg(null), 4000);
  };

  const resetState = () => {
    setSearchQuery("");
    setCustomAddress("");
    setShowCustomInput(false);
    setIsSearching(false);
    setPredictions([]);
    setErrorMsg(null);
  };

  const handleSelectLocation = (location: DeliveryLocation) => {
    onSelect(location);
    onClose();
    window.setTimeout(resetState, 200);
  };

  const handleCustomSubmit = () => {
    const address = customAddress.trim();
    if (!address) {
      showError("Please enter an address first.");
      return;
    }

    handleSelectLocation({
      address,
      details: "Entered manually",
    });
  };

  const handleSelectPrediction = async (prediction: MapsPrediction) => {
    setIsSearching(true);
    try {
      const response = await apiFetch(
        `/api/parcel-drafts/maps/details?placeId=${encodeURIComponent(prediction.placeId)}`,
      );
      const result = await response.json();

      if (!response.ok) {
        showError(result.message || "Unable to resolve that Google Maps place.");
        return;
      }

      handleSelectLocation({
        address: result.address || prediction.description,
        details: result.details || prediction.secondaryText || "Google Maps",
        lat: result.lat,
        lng: result.lng,
        placeId: prediction.placeId,
      });
    } catch {
      showError("Unable to resolve that Google Maps place.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#041614]/40 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
        {errorMsg && (
          <div className="absolute left-0 right-0 top-3 z-[110] flex justify-center px-4">
            <div className="flex max-w-[90%] items-center gap-3 rounded-full border border-red-100 bg-red-50 px-5 py-3 shadow-lg">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <p className="truncate text-sm font-semibold text-red-800">{errorMsg}</p>
              <button
                onClick={() => setErrorMsg(null)}
                className="shrink-0 rounded-full p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                type === "pickup"
                  ? "bg-[#39B5A8]/10 text-[#39B5A8]"
                  : "bg-[#FDB833]/10 text-[#FDB833]"
              }`}
            >
              {type === "pickup" ? (
                <MapPin className="h-5 w-5" />
              ) : (
                <Navigation className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#041614]">
                {type === "pickup" ? "Pickup Location" : "Delivery Location"}
              </h2>
              <p className="text-sm font-medium text-gray-500">Where are we headed?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {!showCustomInput ? (
            <>
              <div className="p-5 pb-2">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#39B5A8]" />
                  <input
                    type="text"
                    placeholder="Search Google Maps..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-xl border border-transparent bg-gray-50 py-3.5 pl-11 pr-10 font-medium text-[#041614] outline-none transition-all placeholder:text-gray-400 focus:border-[#39B5A8]/30 focus:bg-white focus:ring-4 focus:ring-[#39B5A8]/10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                    >
                      <X className="h-4 w-4 -translate-y-1/2" />
                    </button>
                  )}
                </div>
              </div>

              <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-5 pt-2">
                {isSearching && (
                  <div className="mb-2 flex items-center gap-3 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8] p-3 text-sm font-bold text-[#39B5A8]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching Google Maps...
                  </div>
                )}

                {predictions.length > 0 ? (
                  predictions.map((prediction) => (
                    <button
                      key={prediction.placeId}
                      onClick={() => handleSelectPrediction(prediction)}
                      className="group flex w-full items-center gap-4 rounded-xl border border-transparent p-3 text-left transition-all hover:border-gray-200 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#39B5A8]/20"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm transition-transform group-hover:scale-105">
                        <MapPin className="h-4 w-4 text-[#39B5A8]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#041614]">
                          {prediction.mainText || prediction.description}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {prediction.secondaryText || prediction.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 -translate-x-2 text-gray-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-[#39B5A8] group-hover:opacity-100" />
                    </button>
                  ))
                ) : filteredLocations.length > 0 ? (
                  filteredLocations.map((location, index) => (
                    <button
                      key={`${location.address}-${index}`}
                      onClick={() => handleSelectLocation(location)}
                      className="group flex w-full items-center gap-4 rounded-xl border border-transparent p-3 text-left transition-all hover:border-gray-200 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#39B5A8]/20"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm transition-transform group-hover:scale-105">
                        <MapPin className="h-4 w-4 text-gray-400 transition-colors group-hover:text-[#39B5A8]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#041614]">{location.address}</p>
                        {location.details && (
                          <p className="truncate text-sm text-gray-500">{location.details}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 -translate-x-2 text-gray-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-[#39B5A8] group-hover:opacity-100" />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                      <Map className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-500">
                      No locations found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>

              <div className="shrink-0 rounded-b-[1.5rem] border-t border-gray-100 bg-gray-50/50 p-5">
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full rounded-[1.25rem] border-2 border-dashed border-[#39B5A8]/40 px-5 py-4 text-center font-bold text-[#39B5A8] transition-all hover:border-[#39B5A8]/70 hover:bg-[#39B5A8]/5"
                >
                  Cannot find it? Enter custom address
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-5 flex items-center gap-3">
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <div>
                  <h3 className="font-bold text-[#041614]">Enter custom address</h3>
                  <p className="text-sm text-gray-500">Add the exact location manually</p>
                </div>
              </div>

              <div className="space-y-4">
                <textarea
                  value={customAddress}
                  onChange={(event) => setCustomAddress(event.target.value)}
                  placeholder="Enter the full address, including landmarks if needed"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#39B5A8]/20 bg-white px-4 py-3 font-medium text-[#041614] outline-none transition-colors focus:border-[#39B5A8]"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setShowCustomInput(false)}
                    className="rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCustomSubmit}
                    className="rounded-xl bg-[#39B5A8] px-4 py-3 font-bold text-white transition-colors hover:bg-[#2D8F85]"
                  >
                    Save address
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
