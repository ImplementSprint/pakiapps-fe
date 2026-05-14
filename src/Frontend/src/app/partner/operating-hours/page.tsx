'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Clock, Save, LogOut, Loader2,
  CheckCircle2, Sun, Moon, AlertCircle, Building2,
} from 'lucide-react';
import { operatingHoursService, type DaySchedule } from '@/services/operatingHoursService';
import { locationsService } from '@/services/locationsService';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_SCHEDULE: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  dayName: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i],
  openTime:  '06:00',
  closeTime: '23:00',
  isClosed:  false,
}));

// ─── Time Input ───────────────────────────────────────────────────────────────
function TimeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="h-9 w-28 px-2 text-sm font-mono font-bold text-[#1e3d5a] bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ee6b20]/30 focus:border-[#ee6b20] disabled:opacity-40 disabled:bg-gray-50 transition-all"
    />
  );
}

// ─── Day Row ──────────────────────────────────────────────────────────────────
function DayRow({ day, onChange }: { day: DaySchedule; onChange: (d: Partial<DaySchedule>) => void }) {
  const hours = day.isClosed ? 0 : (() => {
    const [oh, om] = (day.openTime  || '06:00').split(':').map(Number);
    const [ch, cm] = (day.closeTime || '23:00').split(':').map(Number);
    return Math.max(0, (ch * 60 + cm - oh * 60 - om) / 60);
  })();

  return (
    <div className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
      day.isClosed ? 'border-red-100 bg-red-50/30 opacity-75' : 'border-gray-100 hover:border-[#ee6b20]/20 hover:shadow-sm'
    }`}>
      {/* Day label */}
      <div className="flex items-center gap-3 min-w-[120px]">
        <div className={`size-9 rounded-xl flex items-center justify-center text-xs font-black ${
          day.isClosed ? 'bg-red-100 text-red-500' : 'bg-[#1e3d5a] text-white'
        }`}>
          {DAY_ABBR[day.dayOfWeek]}
        </div>
        <p className="font-bold text-[#1e3d5a] text-sm">{day.dayName}</p>
      </div>

      {/* Toggle closed */}
      <label className="flex items-center gap-2 cursor-pointer">
        <div className={`relative w-10 h-5 rounded-full transition-colors ${day.isClosed ? 'bg-red-400' : 'bg-green-400'}`}>
          <div className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-transform ${day.isClosed ? 'translate-x-0.5' : 'translate-x-5'}`} />
          <input type="checkbox" className="sr-only" checked={!day.isClosed} onChange={e => onChange({ isClosed: !e.target.checked })} />
        </div>
        <span className={`text-xs font-bold ${day.isClosed ? 'text-red-500' : 'text-green-600'}`}>
          {day.isClosed ? 'Closed' : 'Open'}
        </span>
      </label>

      {/* Time pickers */}
      <div className={`flex items-center gap-3 flex-wrap ${day.isClosed ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-2">
          <Sun className="size-3.5 text-[#ee6b20]" />
          <TimeInput value={day.openTime}  onChange={v => onChange({ openTime: v })}  disabled={day.isClosed} />
        </div>
        <span className="text-gray-400 font-bold text-sm">—</span>
        <div className="flex items-center gap-2">
          <Moon className="size-3.5 text-[#1e3d5a]" />
          <TimeInput value={day.closeTime} onChange={v => onChange({ closeTime: v })} disabled={day.isClosed} />
        </div>
      </div>

      {/* Hours badge */}
      {!day.isClosed && hours > 0 && (
        <span className="ml-auto text-[10px] font-black text-[#1e3d5a]/60 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
          {hours} hrs open
        </span>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OperatingHoursPage() {
  const router = useRouter();

  const [locations,  setLocations]  = useState<any[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [schedule,   setSchedule]   = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  // Load partner's locations
  useEffect(() => {
    locationsService.getMyLocations?.()
      .then((locs: any[]) => {
        setLocations(locs ?? []);
        if (locs?.length > 0) setLocationId(locs[0].id);
      })
      .catch(() => {
        // Fallback: try /api/locations with partner filter
        setLocations([]);
      });
  }, []);

  // Load hours when location changes
  const loadHours = useCallback(async (locId: number) => {
    setLoading(true);
    try {
      const data = await operatingHoursService.getByLocation(locId);
      setSchedule(data.length === 7 ? data : DEFAULT_SCHEDULE);
    } catch {
      setSchedule(DEFAULT_SCHEDULE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (locationId) loadHours(locationId);
  }, [locationId, loadHours]);

  const updateDay = (dayOfWeek: number, patch: Partial<DaySchedule>) => {
    setSchedule(prev => prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!locationId) return;
    setSaving(true);
    try {
      await operatingHoursService.upsert(locationId, schedule.map(d => ({
        dayOfWeek: d.dayOfWeek,
        openTime:  d.isClosed ? null! : d.openTime,
        closeTime: d.isClosed ? null! : d.closeTime,
        isClosed:  d.isClosed,
      })));
      toast.success('Operating hours saved! ✅');
      setSaved(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save hours');
    } finally {
      setSaving(false);
    }
  };

  const applyAll = (openTime: string, closeTime: string) => {
    setSchedule(prev => prev.map(d => d.isClosed ? d : { ...d, openTime, closeTime }));
    setSaved(false);
    toast.success('Applied to all open days');
  };

  const openDays   = schedule.filter(d => !d.isClosed).length;
  const closedDays = schedule.filter(d =>  d.isClosed).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
              <ArrowLeft className="size-5" />
            </button>
            <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-8 w-auto object-contain" unoptimized />
          </div>
          <h1 className="text-lg font-black text-[#1e3d5a]">Operating Hours</h1>
          <button onClick={() => authService.logout()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-all text-sm font-semibold">
            <LogOut className="size-4" /><span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Location selector */}
        {locations.length > 1 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <label className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase mb-3 flex items-center gap-2">
              <Building2 className="size-4 text-[#ee6b20]" /> Select Location
            </label>
            <select
              value={locationId ?? ''}
              onChange={e => setLocationId(Number(e.target.value))}
              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#1e3d5a] focus:outline-none focus:ring-2 focus:ring-[#ee6b20]/30 focus:border-[#ee6b20]"
            >
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open Days',   value: openDays,   color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
            { label: 'Closed Days', value: closedDays, color: 'text-red-500',   bg: 'bg-red-50',   border: 'border-red-100' },
            { label: 'Days Set',    value: 7,          color: 'text-[#1e3d5a]', bg: 'bg-blue-50',  border: 'border-blue-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Apply to all shortcut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-black text-[#1e3d5a] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock className="size-4 text-[#ee6b20]" /> Quick Apply to All Open Days
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Sun className="size-3.5 text-[#ee6b20]" />
              <input id="bulk-open" type="time" defaultValue="06:00"
                className="h-9 w-28 px-2 text-sm font-mono font-bold text-[#1e3d5a] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ee6b20]/30" />
            </div>
            <span className="text-gray-400 font-bold">—</span>
            <div className="flex items-center gap-2">
              <Moon className="size-3.5 text-[#1e3d5a]" />
              <input id="bulk-close" type="time" defaultValue="23:00"
                className="h-9 w-28 px-2 text-sm font-mono font-bold text-[#1e3d5a] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ee6b20]/30" />
            </div>
            <button
              onClick={() => {
                const o = (document.getElementById('bulk-open')  as HTMLInputElement).value;
                const c = (document.getElementById('bulk-close') as HTMLInputElement).value;
                applyAll(o, c);
              }}
              className="px-5 h-9 bg-[#1e3d5a] hover:bg-[#2a5373] text-white text-xs font-black rounded-xl transition-colors shadow-sm"
            >
              Apply to All
            </button>
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-3">
          <h2 className="text-sm font-black text-[#1e3d5a] uppercase tracking-widest">Weekly Schedule</h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-[#ee6b20]" />
            </div>
          ) : (
            schedule.map(day => (
              <DayRow
                key={day.dayOfWeek}
                day={day}
                onChange={patch => updateDay(day.dayOfWeek, patch)}
              />
            ))
          )}
        </div>

        {/* Save banner */}
        <div className={`fixed bottom-6 inset-x-0 flex justify-center px-6 transition-all ${saving || !locationId ? 'opacity-100' : 'opacity-100'}`}>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl shadow-black/10 p-4 flex items-center gap-4 max-w-lg w-full">
            {saved ? (
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm flex-1">
                <CheckCircle2 className="size-5" /> Hours saved successfully
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm flex-1">
                <AlertCircle className="size-4" /> Unsaved changes
              </div>
            )}
            <button
              id="btn-save-hours"
              onClick={handleSave}
              disabled={saving || !locationId}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#ee6b20] hover:bg-[#d95a10] disabled:opacity-50 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-orange-200"
            >
              {saving ? <><Loader2 className="size-4 animate-spin" />Saving…</> : <><Save className="size-4" />Save Hours</>}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
