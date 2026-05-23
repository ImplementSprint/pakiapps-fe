import mascotParking from '../../assets/2f36e075afb851770b0825e8580b43ef7b12efb3.png';
import mascotBookings from '../../assets/6ba55cecd5b7106e37c71ca0e89f4f80eb706edd.png';
import mascotRating from '../../assets/49e0d16aae0cfb13df1b2acdc4fbd4b2ab68795e.png';
import { LayoutGrid } from "lucide-react";

interface QuickActionsMenuProps {
  onReserveClick: () => void;
  onMyBookingsClick: () => void;
  onRateReviewClick: () => void;
}

interface QuickAction {
  mascot: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  color: string;
}

export function QuickActionsMenu({
  onReserveClick,
  onMyBookingsClick,
  onRateReviewClick,
}: QuickActionsMenuProps) {
  const actions: QuickAction[] = [
    {
      mascot: mascotParking,
      title: "Reserve Parking",
      subtitle: "Book a parking spot",
      onClick: onReserveClick,
      color: "bg-[#ee6b20]",
    },
    {
      mascot: mascotBookings,
      title: "My Bookings",
      subtitle: "View active bookings",
      onClick: onMyBookingsClick,
      color: "bg-[#1e3d5a]",
    },
    {
      mascot: mascotRating,
      title: "Rate & Review",
      subtitle: "Give feedback",
      onClick: onRateReviewClick,
      color: "bg-[#1e3d5a]",
    },
  ];

  return (
    <section className="space-y-3 pt-3">
      {/* Header with Navigation Icon */}
      <div className="flex items-center gap-2 mb-20">
        <div className="bg-[#1e3d5a] p-2 rounded-lg shadow-sm">
          <LayoutGrid size={16} className="text-white" strokeWidth={2.2} />
        </div>
        <h2 className="text-lg font-bold text-[#1e3d5a]">
          Navigation Menu
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {actions.map((action, index) => {
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="group relative bg-white rounded-3xl p-5 pt-16 shadow-sm border border-gray-100 hover:border-[#ee6b20] hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center"
            >
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 z-10 drop-shadow-lg group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <img
                  src={action.mascot}
                  alt={action.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col items-center gap-2 mt-6">
                <div>
                  <h3 className="font-bold text-[#1e3d5a] text-md mb-0.5">
                    {action.title}
                  </h3>
                  <p className="text-[13px] text-gray-500 font-medium">
                    {action.subtitle}
                  </p>
                </div>
              </div>

              <div
                className={`absolute inset-0 ${action.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 rounded-3xl`}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
