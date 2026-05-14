'use client';
import { useState, useEffect } from 'react';
import { bookingService, type Booking } from '@/services/bookingService';
import { Search, RefreshCw } from 'lucide-react';

const STATUSES = ['all','upcoming','active','completed','cancelled'] as const;
type StatusFilter = typeof STATUSES[number];

export default function AdminBookingsView() {
  const [bookings, setBookings]        = useState<Booking[]>([]);
  const [status, setStatus]            = useState<StatusFilter>('all');
  const [search, setSearch]            = useState('');
  const [isLoading, setIsLoading]      = useState(true);
  const [page, setPage]                = useState(1);
  const [total, setTotal]              = useState(0);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await bookingService.getAllBookings({ status: status === 'all' ? undefined : status, search: search || undefined, page });
      setBookings(data.bookings);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, [status, page]);
  const handleSearch = () => { setPage(1); load(); };

  const badge: Record<string, string> = {
    upcoming:  'bg-blue-100 text-blue-700',
    active:    'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
    no_show:   'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search reference, customer…"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${status === s ? 'bg-[#1e3d5a] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#1e3d5a]'}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50">
          <RefreshCw className={`size-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Reference','Customer','Spot','Date','Time Slot','Status','Amount'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center"><RefreshCw className="size-5 text-[#ee6b20] animate-spin mx-auto" /></td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No bookings found</td></tr>
              ) : bookings.map(b => (
                <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono font-bold text-[#1e3d5a]">{b.reference}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{(b.userId as any)?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#ee6b20]">{b.spot}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.timeSlot}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${badge[b.status] ?? badge.upcoming}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-700">₱{b.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{total} total bookings</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Prev</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
