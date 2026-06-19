'use client';
import { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { TrendingUp, Car, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

export default function AdminAnalyticsView() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsService.getOverview().then(setStats).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Total Bookings', value: stats.total,     icon: Car,          color: '#0ea5e9', bg: '#f0f9ff' },
    { label: 'Upcoming',       value: stats.upcoming,  icon: Clock,        color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Active',         value: stats.active,    icon: Activity,     color: '#10b981', bg: '#f0fdf8' },
    { label: 'Completed',      value: stats.completed, icon: CheckCircle,  color: '#8b5cf6', bg: '#f5f0ff' },
    { label: 'Cancelled',      value: stats.cancelled, icon: XCircle,      color: '#ef4444', bg: '#fff1f2' },
  ] : [];

  const completionRate = stats ? Math.round((stats.completed / (stats.total || 1)) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3d5a] mb-1">Booking Analytics</h2>
        <p className="text-gray-500 text-sm">Overview of all parking reservations</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="size-8 border-4 border-[#1e3d5a] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
                <div className="size-12 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform" style={{ background: c.bg, color: c.color }}>
                  <c.icon className="size-6" />
                </div>
                <p className="text-2xl font-black text-[#1e3d5a]">{c.value}</p>
                <p className="text-xs font-bold text-gray-400 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Completion Rate */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="size-5 text-[#ee6b20]" />
                  <h3 className="font-bold text-[#1e3d5a]">Completion Rate</h3>
                </div>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-black text-[#1e3d5a]">{completionRate}%</p>
                  <p className="text-gray-400 text-sm mb-1">{stats.completed} completed out of {stats.total} total</p>
                </div>
                <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#1e3d5a] to-[#ee6b20] rounded-full transition-all"
                    style={{ width: `${completionRate}%` }} />
                </div>
              </div>

              {/* Status breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-[#1e3d5a] mb-4">Status Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Upcoming',  count: stats.upcoming,  color: '#f59e0b', pct: Math.round((stats.upcoming  / (stats.total || 1)) * 100) },
                    { label: 'Active',    count: stats.active,    color: '#10b981', pct: Math.round((stats.active    / (stats.total || 1)) * 100) },
                    { label: 'Completed', count: stats.completed, color: '#8b5cf6', pct: Math.round((stats.completed / (stats.total || 1)) * 100) },
                    { label: 'Cancelled', count: stats.cancelled, color: '#ef4444', pct: Math.round((stats.cancelled / (stats.total || 1)) * 100) },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-bold text-gray-500">{s.label}</div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                      </div>
                      <div className="w-12 text-right text-xs font-bold text-gray-400">{s.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
