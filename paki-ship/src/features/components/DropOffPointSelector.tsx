import { X, MapPin, Star, Clock } from "lucide-react";

interface DropOffPoint {
  id: string;
  name: string;
  address: string;
  rating: number;
  distance: string;
  hours: string;
}

interface DropOffPointSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (point: DropOffPoint) => void;
}

const mockDropOffPoints: DropOffPoint[] = [
  {
    id: "1",
    name: "BGC Central Hub",
    address: "26th St. corner 5th Ave, BGC, Taguig",
    rating: 4.9,
    distance: "2.3 km",
    hours: "7:00 AM - 10:00 PM",
  },
  {
    id: "2",
    name: "Makati Express Point",
    address: "Ayala Avenue, Makati City",
    rating: 4.7,
    distance: "3.1 km",
    hours: "8:00 AM - 9:00 PM",
  },
  {
    id: "3",
    name: "Ortigas Hub",
    address: "EDSA corner Julia Vargas, Ortigas",
    rating: 4.8,
    distance: "5.2 km",
    hours: "7:00 AM - 10:00 PM",
  },
];

export default function DropOffPointSelector({ isOpen, onClose, onSelect }: DropOffPointSelectorProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-[#041614]">Select Drop-off Point</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#041614] transition-colors p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {mockDropOffPoints.map((point) => (
            <button
              key={point.id}
              onClick={() => {
                onSelect(point);
                onClose();
              }}
              className="w-full p-6 rounded-2xl border-2 border-gray-200 hover:border-[#39B5A8] transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#F0F9F8] group-hover:bg-[#39B5A8] transition-colors flex items-center justify-center shrink-0">
                  <MapPin className="w-7 h-7 text-[#39B5A8] group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-black text-[#041614] text-lg">{point.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-black text-[#041614]">{point.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm font-medium mb-3">{point.address}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-bold">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {point.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {point.hours}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
