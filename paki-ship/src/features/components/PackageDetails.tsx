import { useState, useEffect } from "react";
import { Camera, Info, Plus, Minus, AlertCircle, ArrowRight, X } from "lucide-react";
import { Button } from "./ui/button";
import ProhibitedItemsModal from "./ProhibitedItemsModal";

// Assets
const deliveryGuySmall = "/assets/a00095d6fb6fa0cd64f1255238cdd98f6f2e1b0a.png";
const deliveryGuyMedium = "/assets/34640e4de34afbba061a66420940a0714bbabba1.png";
const deliveryGuyLarge = "/assets/b49363a46dd62f10370b8308bac970976a792f00.png";
const deliveryGuyXL = "/assets/33ca00af470333a46af91a19d6efccad5b62a31a.png";

interface PackageDetailsProps {
  onContinue: (details: PackageDetails) => void;
  onBack: () => void;
}

export interface PackageDetails {
  size: "S" | "M" | "L" | "XL";
  weight: string;
  itemType: string;
  deliveryGuarantee: "basic" | "standard" | "premium";
  quantity: number;
  photo?: File;
}

export default function PackageDetails({ onContinue, onBack }: PackageDetailsProps) {
  const [selectedSize, setSelectedSize] = useState<"S" | "M" | "L" | "XL">("M");
  const [weight, setWeight] = useState("");
  const [selectedItemType, setSelectedItemType] = useState("");
  const [selectedGuarantee, setSelectedGuarantee] = useState<"basic" | "standard" | "premium">("basic");
  const [quantity, setQuantity] = useState(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [showProhibitedModal, setShowProhibitedModal] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const sizes = [
    { value: "S" as const, label: "S", dimensions: "30cm × 25cm × 35cm", maxWeight: 3, image: deliveryGuySmall },
    { value: "M" as const, label: "M", dimensions: "40cm × 40cm × 40cm", maxWeight: 5, image: deliveryGuyMedium },
    { value: "L" as const, label: "L", dimensions: "60cm × 60cm × 60cm", maxWeight: 10, image: deliveryGuyLarge },
    { value: "XL" as const, label: "XL", dimensions: "1.2m × 2.1m × 1.2m", maxWeight: 50, image: deliveryGuyXL },
  ];

  const itemTypes = [
    { value: "document", label: "Document", icon: "📄" },
    { value: "food", label: "Food", icon: "🍴" },
    { value: "clothing", label: "Clothing", icon: "👔" },
    { value: "electronics", label: "Electronics", icon: "📱" },
    { value: "fragile", label: "Fragile", icon: "⚠️" },
    { value: "other", label: "Other", icon: "📦" },
  ];

  const guarantees = [
    { value: "basic" as const, label: "Basic", price: "Included", description: "Covers up to ₱3,000" },
    { value: "standard" as const, label: "Standard", price: "₱7.00", description: "Covers up to ₱5,000" },
    { value: "premium" as const, label: "Premium", price: "₱9.00", description: "Covers up to ₱10,000" },
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const currentSize = sizes.find(s => s.value === selectedSize);
  const requiresDirectDelivery = selectedItemType === "food" || selectedItemType === "fragile";
  const cardClasses = "bg-white rounded-2xl shadow-sm border border-[#39B5A8]/10 p-6 md:p-8";

  const handleContinue = () => {
    if (selectedSize === "XL") {
      if (!weight) return setError("Please enter the weight for XL size parcels");
      if (parseFloat(weight) > (currentSize?.maxWeight || 50)) 
        return setError(`Weight cannot exceed ${currentSize?.maxWeight}kg for XL size`);
    }
    if (!selectedItemType) return setError("Please select an item type to proceed");
    if (quantity < 1) return setError("Quantity must be at least 1");

    onContinue({
      size: selectedSize,
      weight: selectedSize === "XL" ? weight : `Up to ${currentSize?.maxWeight}kg`,
      itemType: selectedItemType,
      deliveryGuarantee: selectedGuarantee,
      quantity: quantity,
      photo: photo || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative px-4 pb-12">
      
      {/* ERROR POPUP */}
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-top-8 duration-300">
          <div className="bg-[#1A5D56] text-white p-4 rounded-xl shadow-xl border border-white/10 flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="flex-1 font-semibold text-sm">{error}</p>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Size Visual & Selection */}
      <div className={cardClasses}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="bg-[#F8FDFD] rounded-xl p-4 flex flex-col items-center justify-center min-h-[280px] border border-[#39B5A8]/5">
            <img 
              src={currentSize?.image} 
              alt={`Size ${selectedSize}`}
              className="h-48 object-contain transition-transform duration-500 hover:scale-105"
            />
            <div className="mt-4 text-center">
              <span className="text-[#39B5A8] font-bold text-lg px-4 py-1">
                Size {currentSize?.label}
              </span>
              <p className="text-[#1A5D56]/60 text-xs font-medium uppercase tracking-wider">
                {currentSize?.dimensions}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] uppercase tracking-widest font-bold text-[#1A5D56]/50 mb-3">
                Select Package Size
              </label>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => { setSelectedSize(size.value); setWeight(""); }}
                    className={`flex-1 min-w-[60px] h-12 rounded-xl font-bold transition-all active:scale-95 border-2 ${
                      selectedSize === size.value
                        ? "bg-[#39B5A8] border-[#39B5A8] text-white shadow-md shadow-[#39B5A8]/20"
                        : "bg-white border-[#39B5A8]/10 text-[#1A5D56] hover:border-[#39B5A8]/30"
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Visual & Selection Row */}
          {selectedSize === "XL" ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <label className="block text-[11px] uppercase tracking-widest font-black text-[#1A5D56]/50 mb-3">
                Specify Parcel Weight
              </label>
              <div className="flex items-center gap-3 bg-[#F0F9F8] p-2 rounded-2xl border-2 border-[#39B5A8]/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setWeight(prev => Math.max(0, (parseFloat(prev) || 0) - 0.5).toFixed(1))}
                  className="w-12 h-12 rounded-xl bg-white text-[#39B5A8] flex items-center justify-center shadow-sm hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>
                
                <div className="flex-1 text-center">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-transparent font-black text-center text-[#1A5D56] text-2xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="block text-[9px] font-black text-[#39B5A8] uppercase tracking-widest -mt-1">Kilograms</span>
                </div>
          
                <button
                  type="button"
                  onClick={() => {
                    const newWeight = (parseFloat(weight) || 0) + 0.5;
                    if (newWeight <= (currentSize?.maxWeight || 50)) setWeight(newWeight.toFixed(1));
                  }}
                  className="w-12 h-12 rounded-xl bg-[#39B5A8] text-white flex items-center justify-center shadow-lg shadow-[#39B5A8]/20 hover:bg-[#2D8F85] transition-all active:scale-90"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
              <p className="mt-3 text-center text-[10px] text-[#1A5D56]/40 font-bold uppercase tracking-tight">
                Max capacity for XL: {currentSize?.maxWeight}kg
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#F0F9F8] border border-[#39B5A8]/10 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#39B5A8] shrink-0 mt-0.5" />
              <p className="text-xs text-[#1A5D56]/80 leading-relaxed">
                <span className="font-bold text-[#39B5A8]">Included:</span> Up to {currentSize?.maxWeight}kg is covered for this size.
              </p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* 📸 Photo Upload */}
      <div className={cardClasses}>
        <label className="flex items-center justify-center gap-3 py-4 border-2 border-dashed border-[#39B5A8]/20 rounded-xl cursor-pointer hover:bg-[#F0F9F8] hover:border-[#39B5A8]/40 transition-all">
          <Camera className="w-5 h-5 text-[#39B5A8]" />
          <span className="text-[#1A5D56] font-bold text-sm">
            {photo ? photo.name : "Attach a photo (optional)"}
          </span>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>
      </div>

      {/* 📦 Item Type */}
      <div className={cardClasses}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#1A5D56]">Item type</h3>
          <button 
            type="button"
            className="text-[#39B5A8] hover:underline text-xs font-bold" 
            onClick={() => setShowProhibitedModal(true)}
          >
            What's prohibited?
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {itemTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedItemType(type.value)}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 active:scale-95 ${
                selectedItemType === type.value
                  ? "border-[#39B5A8] bg-[#F0F9F8] text-[#39B5A8]"
                  : "border-transparent bg-gray-50 hover:bg-white hover:border-[#39B5A8]/20 text-[#1A5D56]/60"
              }`}
            >
              <div className="text-2xl">{type.icon}</div>
              <div className="text-[10px] uppercase font-bold tracking-tight">
                {type.label}
              </div>
            </button>
          ))}
        </div>

        {requiresDirectDelivery && (
          <div className="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-100 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[13px] text-amber-900 font-medium">
              Note: <span className="font-bold">{selectedItemType}</span> items require Direct Delivery.
            </p>
          </div>
        )}
      </div>

      {/* 🛡️ Guarantee & Quantity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardClasses}>
          <h3 className="text-lg font-bold text-[#1A5D56] mb-4">Delivery Guarantee</h3>
          <div className="space-y-2">
            {guarantees.map((guarantee) => (
              <button
                key={guarantee.value}
                onClick={() => setSelectedGuarantee(guarantee.value)}
                className={`w-full p-3.5 rounded-xl border-2 transition-all flex justify-between items-center active:scale-[0.99] ${
                  selectedGuarantee === guarantee.value
                    ? "bg-[#1A5D56] border-[#1A5D56] text-white shadow-lg"
                    : "bg-white border-[#39B5A8]/10 text-[#1A5D56] hover:bg-[#F0F9F8]"
                }`}
              >
                <span className="font-bold text-sm">{guarantee.label}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${selectedGuarantee === guarantee.value ? "bg-white/20" : "text-[#39B5A8] bg-[#F0F9F8]"}`}>
                  {guarantee.price}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={`${cardClasses} flex flex-col justify-between`}>
          <h3 className="text-lg font-bold text-[#1A5D56] mb-4">Quantity</h3>
          <div className="flex items-center justify-between bg-[#F0F9F8] rounded-xl p-4 border border-[#39B5A8]/10">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg bg-white text-[#39B5A8] flex items-center justify-center shadow-sm disabled:opacity-30 transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-3xl font-bold text-[#1A5D56]">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-lg bg-[#39B5A8] text-white flex items-center justify-center shadow-sm hover:bg-[#2D8F85] transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-center text-[#1A5D56]/40 font-bold mt-4 uppercase tracking-widest">
            Total for this size
          </p>
        </div>
      </div>

      {/* 🚀 Actions */}
      <div className="flex gap-4 pt-4">
        <button
          onClick={onBack}
          className="flex-1 h-14 rounded-xl border-2 border-[#1A5D56]/10 text-[#1A5D56] font-bold hover:bg-gray-50 transition-all active:scale-95"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-[2] h-14 rounded-xl bg-gradient-to-r from-[#39B5A8] to-[#2D8F85] text-white font-bold shadow-lg shadow-[#39B5A8]/20 hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <ProhibitedItemsModal isOpen={showProhibitedModal} onClose={() => setShowProhibitedModal(false)} />
    </div>
  );
}
