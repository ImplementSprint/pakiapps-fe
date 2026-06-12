'use client';
/**
 * NotificationBell — premium bell icon with real-time badge, dropdown panel,
 * mark-as-read, and clear-all.
 *
 * Props:
 *   pollIntervalMs  — how often to auto-refresh (default 30 000 ms)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell, X, CheckCheck, Trash2, CheckCircle2, AlertTriangle,
  Clock, Gift, ShieldAlert, Info,
} from 'lucide-react';
import {
  notificationService,
  type AppNotification,
} from '@/services/notificationService';

// ─── Icon + colour per notification type ────────────────────────────────────
function NotifIcon({ type }: { type: AppNotification['type'] }) {
  switch (type) {
    case 'booking_confirmed':
      return <CheckCircle2 className="size-5 text-green-500 shrink-0" />;
    case 'booking_cancelled':
      return <X className="size-5 text-red-400 shrink-0" />;
    case 'booking_reminder':
      return <Clock className="size-5 text-blue-500 shrink-0" />;
    case 'no_show':
      return <AlertTriangle className="size-5 text-amber-500 shrink-0" />;
    case 'discount_approved':
      return <Gift className="size-5 text-purple-500 shrink-0" />;
    case 'discount_rejected':
    case 'registration_rejected':
      return <ShieldAlert className="size-5 text-red-400 shrink-0" />;
    default:
      return <Info className="size-5 text-gray-400 shrink-0" />;
  }
}

function tyepBg(type: AppNotification['type']) {
  switch (type) {
    case 'booking_confirmed':  return 'bg-green-50';
    case 'booking_cancelled':  return 'bg-red-50';
    case 'booking_reminder':   return 'bg-blue-50';
    case 'no_show':            return 'bg-amber-50';
    case 'discount_approved':  return 'bg-purple-50';
    case 'discount_rejected':
    case 'registration_rejected': return 'bg-red-50';
    default:                   return 'bg-gray-50';
  }
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface NotificationBellProps {
  pollIntervalMs?: number;
  accentColor?: string;   // e.g. '#ee6b20' (defaults to orange)
}

export function NotificationBell({
  pollIntervalMs = 30_000,
  accentColor = '#ee6b20',
}: NotificationBellProps) {
  const [open,         setOpen]         = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread,       setUnread]       = useState(0);
  const [loading,      setLoading]      = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Fetch count (lightweight — runs on every poll) ───────────────────────
  const refreshCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnread(count);
    } catch { /* ignore silently */ }
  }, []);

  // ── Fetch full list (only when panel is open) ────────────────────────────
  const refreshList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAll(1);
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  // ── Poll unread count ────────────────────────────────────────────────────
  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, pollIntervalMs);
    return () => clearInterval(id);
  }, [refreshCount, pollIntervalMs]);

  // ── Fetch list when panel opens ──────────────────────────────────────────
  useEffect(() => { if (open) refreshList(); }, [open, refreshList]);

  // ── Close panel when clicking outside ───────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleMarkRead = async (n: AppNotification) => {
    if (n.isRead) return;
    await notificationService.markOneRead(n._id).catch(() => {});
    setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleDelete = async (n: AppNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.deleteOne(n._id).catch(() => {});
    setNotifications(prev => prev.filter(x => x._id !== n._id));
    if (!n.isRead) setUnread(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleClearAll = async () => {
    await notificationService.clearAll().catch(() => {});
    setNotifications([]);
    setUnread(0);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={panelRef}>
      {/* Bell trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-black text-white flex items-center justify-center px-1 shadow-md"
            style={{ backgroundColor: accentColor }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-[#1e3d5a]" />
              <h3 className="font-black text-[#1e3d5a] text-sm">Notifications</h3>
              {unread > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: accentColor }}>
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={handleMarkAllRead} title="Mark all read"
                  className="p-1.5 text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-100 rounded-lg transition-colors">
                  <CheckCheck className="size-4" />
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={handleClearAll} title="Clear all"
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="size-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3">
                <div className="size-6 border-2 border-gray-200 border-t-[#ee6b20] rounded-full animate-spin" />
                <p className="text-xs text-gray-400 font-medium">Loading…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center px-6">
                <div className="size-14 bg-gray-50 rounded-full flex items-center justify-center">
                  <Bell className="size-7 text-gray-300" />
                </div>
                <p className="font-bold text-[#1e3d5a] text-sm">All caught up!</p>
                <p className="text-xs text-gray-400">No notifications yet. Booking confirmations and reminders will appear here.</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => handleMarkRead(n)}
                  className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all group hover:bg-gray-50/80 ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  {/* Type icon */}
                  <div className={`size-9 rounded-xl ${tyepBg(n.type)} flex items-center justify-center shrink-0 mt-0.5`}>
                    <NotifIcon type={n.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13px] leading-tight ${!n.isRead ? 'font-black text-[#1e3d5a]' : 'font-semibold text-gray-700'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <div className="size-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: accentColor }} />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">{timeAgo(n.createdAt)}</p>
                  </div>

                  {/* Delete button (shows on hover) */}
                  <button
                    onClick={(e) => handleDelete(n, e)}
                    className="hidden group-hover:flex size-7 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg items-center justify-center transition-colors shrink-0 mt-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
