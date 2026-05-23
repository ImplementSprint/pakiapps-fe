import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, TrendingUp, Clock } from 'lucide-react';
import { Button } from './ui/button';

export interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'system' | 'analytics';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Load notifications from localStorage
    const loadNotifications = () => {
      const saved = localStorage.getItem('adminNotifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    };

    loadNotifications();

    // Listen for new notifications
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'adminNotifications') {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for updates
    const interval = setInterval(loadNotifications, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const markAsRead = (id: string) => {
    const updated = notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    );
    setNotifications(updated);
    localStorage.setItem('adminNotifications', JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(notif => ({ ...notif, read: true }));
    setNotifications(updated);
    localStorage.setItem('adminNotifications', JSON.stringify(updated));
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(notif => notif.id !== id);
    setNotifications(updated);
    localStorage.setItem('adminNotifications', JSON.stringify(updated));
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.setItem('adminNotifications', JSON.stringify([]));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <CheckCircle className="size-5 text-green-600" />;
      case 'payment':
        return <TrendingUp className="size-5 text-blue-600" />;
      case 'system':
        return <AlertCircle className="size-5 text-orange-600" />;
      case 'analytics':
        return <Info className="size-5 text-purple-600" />;
      default:
        return <Bell className="size-5 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-[100] flex items-start justify-end p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col mt-20">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-[#1e3d5a]" />
            <h3 className="text-lg font-bold text-[#1e3d5a]">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-[#ee6b20] text-white text-xs font-semibold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-600" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={markAllAsRead}
              className="text-sm text-[#ee6b20] hover:text-[#d55f1c] font-medium"
            >
              Mark all as read
            </button>
            <button
              onClick={clearAll}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <Bell className="size-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">No notifications</p>
              <p className="text-sm text-gray-500 mt-1">
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-semibold ${
                          !notification.read ? 'text-[#1e3d5a]' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <X className="size-3 text-gray-500" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-[#ee6b20] hover:text-[#d55f1c] font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility function to add a notification
export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  const saved = localStorage.getItem('adminNotifications');
  const existing: Notification[] = saved ? JSON.parse(saved) : [];
  
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };

  const updated = [newNotification, ...existing].slice(0, 50); // Keep only latest 50
  localStorage.setItem('adminNotifications', JSON.stringify(updated));
  
  // Trigger storage event for same-window updates
  window.dispatchEvent(new Event('storage'));
};

// Function to get unread count
export const getUnreadCount = (): number => {
  const saved = localStorage.getItem('adminNotifications');
  if (!saved) return 0;
  const notifications: Notification[] = JSON.parse(saved);
  return notifications.filter(n => !n.read).length;
};
