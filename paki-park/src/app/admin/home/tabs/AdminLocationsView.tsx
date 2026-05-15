'use client';
import { useState, useEffect } from 'react';
import { locationsService } from '@/services/locationsService';
import { api } from '@/lib/api';
import { MapPin, Plus, Trash2, RefreshCw, Clock, X, Save, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────
interface DaySchedule { open: string; close: string; closed: boolean; }
type WeekSchedule = Record<string,DaySchedule>;
const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];
const DEFAULT_SCHEDULE: WeekSchedule = Object.fromEntries(
  DAYS.map(d => [d.key, { open: '06:00', close: '23:00', closed: false }])
);
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

// ── Operating Hours Modal ──────────────────────────────────────────────────────
function OperatingHoursModal({ location, onClose, onSaved }: {
  location: any; onClose: () => void; onSaved: () => void;
}) {
  const [schedule, setSchedule] = useState<WeekSchedule>(() => {
    const raw = location.operatingHours;
    if (!raw || typeof raw === 'string') return { ...DEFAULT_SCHEDULE };
    return { ...DEFAULT_SCHEDULE, ...raw };
  });
  const [saving, setSaving] = useState(false);

  const set = (day: string, field: keyof DaySchedule, value: any) =>
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  // Apply same hours to all days
  const applyAllDays = (src: string) => {
    const base = schedule[src];
    if (!base) return;
    setSchedule(prev => Object.fromEntries(DAYS.map(d => [d.key, { ...base }])));
    toast.success('Applied to all days');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/locations/${location.id}/hours`, schedule);
      toast.success('Operating hours saved!');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Could not save hours');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center">
              <Clock className="size-5 text-[#1e3d5a]" />
            </div>
            <div>
              <h2 className="font-black text-[#1e3d5a] text-lg">Operating Hours</h2>
              <p className="text-xs text-gray-400">{location.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
            <X className="size-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-8 py-5 space-y-2 flex-1">
          {DAYS.map(({ key, label }) => {
            const day = schedule[key] ?? { open: '06:00', close: '23:00', closed: false };
            return (
              <div key={key} className={`flex flex-wrap items-center gap-3 p-4 rounded-2xl border transition-all ${
                day.closed ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-200 hover:border-[#1e3d5a]/30'
              }`}>
                {/* Day label */}
                <span className="w-28 text-sm font-bold text-[#1e3d5a]">{label}</span>

                {/* Closed toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => set(key, 'closed', !day.closed)}
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                      day.closed ? 'bg-red-400' : 'bg-green-400'
                    }`}
                  >
                    <div className={`size-4 bg-white rounded-full shadow transition-transform ${day.closed ? 'translate-x-0' : 'translate-x-4'}`} />
                  </div>
                  <span className={`text-xs font-bold ${day.closed ? 'text-red-500' : 'text-green-600'}`}>
                    {day.closed ? 'Closed' : 'Open'}
                  </span>
                </label>

                {!day.closed && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">From</span>
                      <select
                        value={day.open}
                        onChange={e => set(key, 'open', e.target.value)}
                        className="h-8 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span className="text-xs text-gray-400">To</span>
                      <select
                        value={day.close}
                        onChange={e => set(key, 'close', e.target.value)}
                        className="h-8 px-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20"
                      >
                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => applyAllDays(key)}
                      className="ml-auto text-[10px] font-bold text-[#ee6b20] hover:underline whitespace-nowrap"
                    >
                      Apply to all ↓
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 h-12 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 h-12 bg-[#1e3d5a] hover:bg-[#2a5373] text-white font-bold rounded-2xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? 'Saving…' : 'Save Hours'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminLocationsView() {
  const [locations, setLocations]     = useState<any[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [showAdd, setShowAdd]         = useState(false);
  const [form, setForm]               = useState({ name: '', address: '', totalSpots: '100' });
  const [hoursModal, setHoursModal]   = useState<any | null>(null);

  const load = async () => {
    setIsLoading(true);
    try { setLocations(await locationsService.getLocations()); }
    catch { toast.error('Could not load locations'); }
    finally { setIsLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    try {
      await locationsService.createLocation(form);
      toast.success('Location added!');
      setShowAdd(false);
      setForm({ name: '', address: '', totalSpots: '100' });
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await locationsService.deleteLocation(id); toast.success('Deleted'); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const formatHoursDisplay = (raw: any): string => {
    if (!raw || typeof raw === 'string') return raw ?? '06:00 – 23:00';
    const today = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];
    const d = raw[today];
    if (!d) return 'N/A';
    if (d.closed) return 'Closed today';
    return `${d.open} – ${d.close}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1e3d5a]">Parking Locations</h2>
        <div className="flex gap-2">
          <button onClick={load} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className={`size-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 px-4 py-2 bg-[#ee6b20] text-white rounded-xl text-sm font-bold">
            <Plus className="size-4" />Add Location
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-[#ee6b20]/30 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-[#1e3d5a]">New Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input placeholder="Location name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20" />
            <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className="h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20" />
            <input type="number" placeholder="Total Spots" value={form.totalSpots} onChange={e => setForm({ ...form, totalSpots: e.target.value })}
              className="h-10 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3d5a]/20" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="px-4 py-2 bg-[#1e3d5a] text-white rounded-xl text-sm font-bold hover:bg-[#2a5373]">Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <div className="col-span-3 text-center py-10"><RefreshCw className="size-6 text-[#ee6b20] animate-spin mx-auto" /></div> :
         locations.length === 0 ? <div className="col-span-3 text-center py-10 text-gray-400 text-sm">No locations found</div> :
         locations.map((loc: any) => (
          <div key={loc.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="size-10 bg-[#1e3d5a]/10 rounded-xl flex items-center justify-center">
                <MapPin className="size-5 text-[#1e3d5a]" />
              </div>
              <button onClick={() => handleDelete(String(loc.id), loc.name)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="size-4" />
              </button>
            </div>
            <h3 className="font-bold text-[#1e3d5a] mb-1">{loc.name}</h3>
            <p className="text-xs text-gray-400 mb-2">{loc.address}</p>

            {/* Operating hours display */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
              <Clock className="size-3 text-[#ee6b20]" />
              <span>{formatHoursDisplay(loc.operatingHours)}</span>
            </div>

            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500">{loc.availableSpots ?? loc.totalSpots} available</span>
              <span className="text-gray-400">/ {loc.totalSpots} total</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-[#ee6b20] rounded-full" style={{ width: `${Math.round(((loc.totalSpots - (loc.availableSpots ?? 0)) / loc.totalSpots) * 100)}%` }} />
            </div>

            {/* Edit hours button */}
            <button
              onClick={() => setHoursModal(loc)}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-[#1e3d5a]/20 text-[#1e3d5a] text-xs font-bold rounded-xl hover:bg-[#1e3d5a]/5 transition-colors"
            >
              <Clock className="size-3" /> Edit Operating Hours
            </button>
          </div>
        ))}
      </div>

      {hoursModal && (
        <OperatingHoursModal
          location={hoursModal}
          onClose={() => setHoursModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
