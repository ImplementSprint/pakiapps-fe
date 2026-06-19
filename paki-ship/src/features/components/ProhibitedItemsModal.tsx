import { X, ShieldAlert, Flame, Ban, Gem, PawPrint } from "lucide-react";
import { Button } from "./ui/button";

interface ProhibitedItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const prohibitedCategories = [
  {
    icon: <Ban className="w-5 h-5 text-red-500" />,
    title: "Illegal & Restricted Items",
    items: ["Illegal drugs and narcotics", "Unregistered firearms and ammunition", "Counterfeit goods"],
  },
  {
    icon: <Flame className="w-5 h-5 text-orange-500" />,
    title: "Hazardous Materials",
    items: ["Explosives and fireworks", "Flammable liquids or gases", "Toxic chemicals and radioactive materials"],
  },
  {
    icon: <Gem className="w-5 h-5 text-yellow-500" />,
    title: "High-Value & Cash",
    items: ["Cash, currency, or money orders", "Precious metals and loose stones", "Lottery tickets or gambling devices"],
  },
  {
    icon: <PawPrint className="w-5 h-5 text-green-500" />,
    title: "Live Animals & Perishables",
    items: ["Live pets or animals", "Human remains", "Raw, unpacked perishables"],
  },
];

export default function ProhibitedItemsModal({ isOpen, onClose }: ProhibitedItemsModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#041614]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-[1.5rem] max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#39B5A8]/20 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#39B5A8]/10 shrink-0 bg-[#F0F9F8]/50 rounded-t-[1.5rem]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-red-500 border border-red-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1A5D56]">Prohibited Items</h2>
              <p className="text-sm text-[#39B5A8] font-bold">We cannot deliver these</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#1A5D56]/50 hover:text-[#1A5D56] hover:bg-[#F0F9F8] p-2 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            For the safety of our riders and compliance with local laws, please ensure your parcel does not contain any of the following items:
          </p>

          <div className="space-y-6">
            {prohibitedCategories.map((category, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#F0F9F8] flex items-center justify-center shrink-0 border border-[#39B5A8]/20">
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[#1A5D56] mb-2">{category.title}</h3>
                  <ul className="space-y-1.5">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-[#39B5A8] mt-0.5 font-bold">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#39B5A8]/10 bg-[#F0F9F8]/50 shrink-0 rounded-b-[1.5rem]">
          <Button 
            onClick={onClose}
            className="w-full h-14 rounded-2xl bg-[#39B5A8] hover:bg-[#2D8F85] text-white font-bold text-lg shadow-lg transition-all active:scale-95"
          >
            I Understand
          </Button>
        </div>

      </div>
    </div>
  );
}