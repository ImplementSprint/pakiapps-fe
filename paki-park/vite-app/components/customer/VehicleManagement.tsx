import { Car, Truck, Bike, Plus, Edit, Trash2, CheckCircle2 } from "lucide-react";

interface Vehicle {
  brand: string;
  model: string;
  color: string;
  plateNumber: string;
  type: string;
  orDoc?: string | null;
  crDoc?: string | null;
}

interface VehicleManagementProps {
  cars: Vehicle[];
  selectedCarIndex: number;
  setSelectedCarIndex: (index: number) => void;
  onAddVehicle: () => void;
  onEditVehicle: (index: number) => void;
  onDeleteVehicle: (index: number) => void;
  highlightClass?: string;
  isLoading?: boolean;
}

const VehicleIcon = ({ type, size }: { type?: string; size: number }) => {
  switch ((type ?? "").toLowerCase()) {
    case "motorcycle":
    case "motor":
      return <Bike size={size} />;
    case "truck":
      return <Truck size={size} />;
    default:
      return <Car size={size} />;
  }
};

export function VehicleManagement({
  cars,
  selectedCarIndex,
  setSelectedCarIndex,
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  highlightClass = "",
  isLoading = false,
}: VehicleManagementProps) {
  const selected = cars[selectedCarIndex] ?? null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#1e3d5a] rounded-lg text-white">
            <VehicleIcon type={selected?.type} size={18} />
          </div>
          <h2 className="text-lg font-bold text-[#1e3d5a]">My Vehicles</h2>
        </div>
        <button
          id="btn-add-vehicle"
          onClick={onAddVehicle}
          className={`text-xs font-bold text-[#ee6b20] flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100 transition-colors ${highlightClass}`}
        >
          <Plus size={14} /> Add New
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-300 animate-pulse">
            <Car size={40} />
            <p className="text-sm font-medium text-gray-400">Loading vehicles…</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cars.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center gap-3">
          <div className="size-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
            <Car size={28} />
          </div>
          <div className="text-center">
            <p className="font-bold text-[#1e3d5a] text-sm">No vehicles yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Add your first vehicle to start booking</p>
          </div>
          <button
            onClick={onAddVehicle}
            className="mt-1 px-4 py-2 bg-[#ee6b20] text-white text-xs font-bold rounded-xl hover:bg-[#d95a10] transition-colors"
          >
            + Add Vehicle
          </button>
        </div>
      )}

      {/* Vehicle card */}
      {!isLoading && selected && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 group relative overflow-hidden bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700 text-[#1e3d5a]">
              <VehicleIcon type={selected.type} size={140} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 bg-orange-100 text-[#ee6b20] text-[9px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={10} /> Active Selection
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditVehicle(selectedCarIndex)}
                      className="p-1.5 bg-gray-50 text-gray-400 hover:text-[#1e3d5a] rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteVehicle(selectedCarIndex)}
                      className="p-1.5 bg-gray-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="text-2xl font-black font-bold text-[#1e3d5a] mt-2 uppercase">
                  {selected.brand}{" "}
                  <span className="text-[#ee6b20]">{selected.model}</span>
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: "Plate", value: selected.plateNumber, mono: true },
                  { label: "Color", value: selected.color, mono: false },
                  { label: "Type",  value: selected.type,  mono: false },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{label}</p>
                    <p className={`text-sm font-black text-[#1e3d5a] capitalize ${mono ? "font-mono tracking-wider" : ""}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-2
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-200
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-gray-300
            transition-colors"
          >
            {cars.map((car: Vehicle, index: number) => (
              <div
                key={index}
                onClick={() => setSelectedCarIndex(index)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${
                  selectedCarIndex === index
                    ? "border-[#1e3d5a] bg-white shadow-sm"
                    : "border-transparent bg-white hover:border-gray-200"
                }`}
              >
                <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${
                  selectedCarIndex === index
                    ? "bg-[#1e3d5a] text-white"
                    : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                }`}>
                  <VehicleIcon type={car.type} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#1e3d5a] text-xs truncate uppercase">
                    {car.brand} {car.model}
                  </h4>
                  <p className="text-[9px] font-mono font-bold text-gray-400">{car.plateNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
