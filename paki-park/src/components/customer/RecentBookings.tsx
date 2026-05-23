import { History, MapPin, ChevronRight } from "lucide-react";

interface Booking {
  loc: string;
  date: string;
  price: string;
}

interface RecentBookingsProps {
  bookings: Booking[];
  onViewAll: () => void;
}

export function RecentBookings({ bookings, onViewAll }: RecentBookingsProps) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="size-4 text-[#1e3d5a]" />
          <h2 className="text-md font-bold text-[#1e3d5a]">Recent Bookings</h2>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-[#ee6b20] flex items-center hover:text-[#d55f1c] transition-colors"
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      <div className="divide-y divide-gray-50">
        {bookings.map((b, i) => (
          <div
            key={i}
            className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center text-[#1e3d5a]">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{b.loc}</p>
                <p className="text-[10px] text-gray-400 font-medium">{b.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-black font-bold text-[#ee6b20]">
                ₱{b.price}.00
              </p>
              <span className="text-[9px] uppercase font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                Completed
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
