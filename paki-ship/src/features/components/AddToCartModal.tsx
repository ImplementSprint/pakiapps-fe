import { ShoppingCart, X, Plus, Minus, Package, Check } from "lucide-react";
const mascotBoxImg = "/assets/92d0061c99ce90a9cdd1289e4cd0cfe12de87aae.png";

interface CartItem {
  id: string;
  size: "S" | "M" | "L" | "XL";
  weight: string;
  itemType: string;
  deliveryGuarantee: "basic" | "standard" | "premium";
  quantity: number;
}

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedToService: () => void;
}

export default function AddToCartModal({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToService,
}: AddToCartModalProps) {
  if (!isOpen) return null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const getItemTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      document: "📄 Document",
      food: "🍴 Food",
      clothing: "👔 Clothing",
      electronics: "📱 Electronics",
      fragile: "⚠️ Fragile",
      other: "📦 Other",
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-[#041614]/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-[#F0F9F8]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border-2 border-[#39B5A8]/20 flex items-center justify-center shadow-sm">
              <ShoppingCart className="w-7 h-7 text-[#39B5A8]" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-[#041614]">Your Cart</h2>
              <p className="text-[#39B5A8] font-bold text-sm">
                {totalItems} {totalItems === 1 ? "item" : "items"} in cart
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#041614] p-2 hover:bg-white rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-32 h-32 mx-auto mb-6 rounded-[2rem] bg-[#F0F9F8] flex items-center justify-center border-2 border-white shadow-md overflow-hidden">
                <img src={mascotBoxImg} alt="Empty Cart" className="w-full h-full object-cover scale-110" />
              </div>
              <h3 className="text-xl font-black text-[#041614] mb-2">Your cart is empty</h3>
              <p className="text-gray-500 font-medium mb-6">
                Add packages to your cart to continue
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-[#39B5A8] text-white rounded-xl font-bold hover:bg-[#2D8F85] transition-all shadow-md"
              >
                Add Packages
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#F0F9F8] border border-[#39B5A8]/10 rounded-2xl p-5 hover:border-[#39B5A8]/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Item Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-[#39B5A8] text-white font-black text-xl flex items-center justify-center shadow-md">
                          {item.size}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-[#041614]">
                            {getItemTypeLabel(item.itemType)}
                          </h4>
                          <p className="text-sm text-gray-500 font-medium">
                            Weight: {item.weight}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#39B5A8] bg-white px-3 py-1 rounded-lg border border-[#39B5A8]/20">
                          {item.deliveryGuarantee.charAt(0).toUpperCase() + item.deliveryGuarantee.slice(1)} Guarantee
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-white rounded-xl p-2 border border-[#39B5A8]/10 shadow-sm">
                        <button
                          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 rounded-lg bg-[#F0F9F8] border border-[#39B5A8]/20 text-[#39B5A8] hover:bg-[#39B5A8]/10 transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <div className="text-xl font-black text-[#041614] min-w-[30px] text-center">
                          {item.quantity}
                        </div>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-[#39B5A8] text-white hover:bg-[#2D8F85] transition-all flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 md:p-8 border-t border-gray-100 bg-white">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-[#39B5A8]" />
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Packages</p>
                  <p className="text-2xl font-black text-[#041614]">{totalItems}</p>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 md:flex-none px-6 py-4 bg-white border-2 border-[#39B5A8]/20 text-[#1A5D56] rounded-xl font-bold hover:bg-[#F0F9F8] hover:border-[#39B5A8]/40 transition-all"
                >
                  Add More
                </button>
                <button
                  onClick={onProceedToService}
                  className="flex-1 md:flex-none px-8 py-4 bg-[#39B5A8] text-white rounded-xl font-bold hover:bg-[#2D8F85] transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check className="w-5 h-5" />
                  Proceed to Service Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
