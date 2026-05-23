import { X, Upload, FileText } from "lucide-react";
import { Button } from "../ui/button";

interface VehicleFormData {
  brand: string;
  model: string;
  color: string;
  plateNumber: string;
  type: string;
  orDoc: string | null;
  crDoc: string | null;
}

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: VehicleFormData;
  setFormData: (data: VehicleFormData) => void;
  isEditing: boolean;
  orInputRef: React.RefObject<HTMLInputElement>;
  crInputRef: React.RefObject<HTMLInputElement>;
  onDocUpload: (e: React.ChangeEvent<HTMLInputElement>, field: "orDoc" | "crDoc") => void;
}

export function VehicleModal({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isEditing,
  orInputRef,
  crInputRef,
  onDocUpload,
}: VehicleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1e3d5a]/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 sm:p-6 transition-all">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border border-white/20">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-2xl font-black text-[#1e3d5a] tracking-tight">
              {isEditing ? "Edit" : "Add New"} Vehicle
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              Enter your vehicle details below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 -mr-2 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 transition-colors">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">
                Vehicle Type *
              </label>
              <select
                className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-[#1e3d5a] transition-all focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none appearance-none"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="truck">Truck</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">
                Brand *
              </label>
              <input
                className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-[#1e3d5a] transition-all focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none placeholder:text-gray-400 placeholder:font-normal"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                placeholder="e.g., Toyota"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">
              Model *
            </label>
            <input
              className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-[#1e3d5a] transition-all focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none placeholder:text-gray-400 placeholder:font-normal"
              value={formData.model}
              onChange={(e) =>
                setFormData({ ...formData, model: e.target.value })
              }
              placeholder="e.g., Vios, Fortuner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">
                Plate Number *
              </label>
              <input
                className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-mono font-bold text-[#1e3d5a] uppercase transition-all focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none placeholder:text-gray-300 placeholder:font-normal"
                maxLength={8}
                value={formData.plateNumber}
                onChange={(e) =>
                  setFormData({ ...formData, plateNumber: e.target.value })
                }
                placeholder="ABC 1234"
              />
              <p className="text-[9px] text-gray-400 pl-1">
                Format: ABC 1234 (4-8 chars)
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">
                Color *
              </label>
              <input
                className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-[#1e3d5a] transition-all focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none placeholder:text-gray-400 placeholder:font-normal"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="e.g., Pearl White"
              />
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px bg-gray-100 flex-1"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">
                Optional Documents
              </span>
              <div className="h-px bg-gray-100 flex-1"></div>
            </div>

            <div className="space-y-3">
              <div
                onClick={() => orInputRef.current?.click()}
                className="group border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:bg-orange-50/50 hover:border-[#ee6b20]/40 transition-all cursor-pointer"
              >
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all group-hover:text-[#ee6b20]">
                  <FileText
                    size={20}
                    className="text-gray-400 group-hover:text-[#ee6b20] transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1e3d5a]">
                    Official Receipt (OR)
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {formData.orDoc || "Click to upload PDF, JPG, or PNG (Max 5MB)"}
                  </p>
                </div>
                <Upload
                  size={18}
                  className="text-gray-300 group-hover:text-[#ee6b20] mr-2 transition-colors"
                />
                <input
                  type="file"
                  ref={orInputRef}
                  hidden
                  onChange={(e) => onDocUpload(e, "orDoc")}
                />
              </div>

              <div
                onClick={() => crInputRef.current?.click()}
                className="group border-2 border-dashed border-gray-200 rounded-2xl p-4 flex items-center gap-4 hover:bg-orange-50/50 hover:border-[#ee6b20]/40 transition-all cursor-pointer"
              >
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all group-hover:text-[#ee6b20]">
                  <FileText
                    size={20}
                    className="text-gray-400 group-hover:text-[#ee6b20] transition-colors"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#1e3d5a]">
                    Certificate of Registration (CR)
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {formData.crDoc || "Click to upload PDF, JPG, or PNG (Max 5MB)"}
                  </p>
                </div>
                <Upload
                  size={18}
                  className="text-gray-300 group-hover:text-[#ee6b20] mr-2 transition-colors"
                />
                <input
                  type="file"
                  ref={crInputRef}
                  hidden
                  onChange={(e) => onDocUpload(e, "crDoc")}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 shrink-0">
          <Button
            variant="outline"
            className="flex-1 rounded-2xl py-6 font-bold border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#1e3d5a]"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#ee6b20] hover:bg-[#d55f1c] text-white rounded-2xl py-6 font-bold shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/40 hover:-translate-y-0.5"
            onClick={onSave}
          >
            Save Vehicle
          </Button>
        </div>
      </div>
    </div>
  );
}
