import { useState, useRef, useEffect } from "react";
import { Bell, Package, Truck, AlertCircle, Gift, Check, X } from "lucide-react";

export type Notification = {
  id: string;
  type: "delivery" | "system" | "promo";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  createdAt?: string;
};

interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "delivery":
        return <Truck className="w-4 h-4 text-[#39B5A8]" />;
      case "system":
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case "promo":
        return <Gift className="w-4 h-4 text-purple-500" />;
      default:
        return <Package className="w-4 h-4 text-[#39B5A8]" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case "delivery":
        return "bg-[#E6F4F2]";
      case "system":
        return "bg-amber-50";
      case "promo":
        return "bg-purple-50";
      default:
        return "bg-[#E6F4F2]";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 hover:bg-[#39B5A8]/5 rounded-full transition-colors border border-[#39B5A8]/20 group"
      >
        <Bell className="w-5 h-5 text-[#39B5A8] group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-[#39B5A8]/10 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200 max-h-[500px] flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-[#F0F9F8]/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-[#041614]">Notifications</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                }}
                className="text-gray-400 hover:text-[#041614] p-1 rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs font-bold text-[#39B5A8] hover:underline"
                >
                  Mark all as read
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={() => {
                    onClearAll();
                    setIsOpen(false);
                  }}
                  className="text-xs font-bold text-red-500 hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6">
                <div className="w-16 h-16 bg-[#F0F9F8] rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-[#39B5A8]/30" />
                </div>
                <p className="text-sm font-bold text-gray-400 text-center">
                  No notifications yet
                </p>
                <p className="text-xs text-gray-300 text-center mt-1">
                  We'll notify you when something arrives
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-5 py-4 border-b border-gray-50 hover:bg-[#F0F9F8]/30 transition-colors cursor-pointer group ${
                    !notification.isRead ? "bg-[#F0F9F8]/20" : ""
                  }`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full ${getNotificationBgColor(notification.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-[#041614] leading-snug">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-[#39B5A8] rounded-full shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        {notification.message}
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium mt-2 inline-block">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
