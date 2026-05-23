'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Car, Truck, Bike, Plus, Trash2, Edit,
  CheckCircle2, X, Upload, FileText, LogOut, Star, Eye,
} from 'lucide-react';
import { vehiclesService } from '@/services/vehiclesService';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

const LOGO_SRC   = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
// Sample document images shown in the lightbox
const DOC_SAMPLES: Record<string, { src: string; title: string }> = {
  orDoc: { src: '/assets/LTO OR.png',                                          title: 'Sample: Official Receipt (OR)' },
  crDoc: { src: '/assets/LTO-Certificate-of-Registration-Sample-3-768x959.webp', title: 'Sample: Certificate of Registration (CR)' },
};

/* ─── helpers ────────────────────────────────────────────────── */
const VehicleIcon = ({ type, size }: { type?: string; size: number }) => {
  switch ((type ?? '').toLowerCase()) {
    case 'motorcycle':
    case 'motor':
      return <Bike size={size} />;
    case 'truck':
      return <Truck size={size} />;
    default:
      return <Car size={size} />;
  }
};

const BLANK_FORM = {
  brand: '', model: '', color: '', plateNumber: '', type: 'sedan',
  orDoc: null as string | null,
  crDoc: null as string | null,
};

/* ─── main component ─────────────────────────────────────────── */
export default function VehiclesPage() {
  const router = useRouter();
  const orRef = useRef<HTMLInputElement>(null);
  const crRef = useRef<HTMLInputElement>(null);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [docErrors, setDocErrors] = useState({ orDoc: false, crDoc: false });
  const [sampleDoc, setSampleDoc] = useState<string | null>(null); // lightbox state

  /* fetch ─────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehiclesService.getMyVehicles();
      setVehicles(data ?? []);
      setSelectedIdx(i => (data?.length ? Math.min(i, data.length - 1) : 0));
    } catch {
      toast.error('Could not load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* doc upload ────────────────────────────────────────────────── */
  const handleDoc = (e: React.ChangeEvent<HTMLInputElement>, field: 'orDoc' | 'crDoc') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File exceeds 5 MB'); return; }
    setForm(f => ({ ...f, [field]: file.name }));
    toast.success(`${field === 'orDoc' ? 'OR' : 'CR'} selected`);
  };

  /* save (add or update) ──────────────────────────────────────── */
  const handleSave = async () => {
    const plate = form.plateNumber.trim().toUpperCase();
    const plateOk = /^[A-Z\d]{2,4} ?\d{3,4}$|^[A-Z\d]{1,8}$/.test(plate);
    if (!plate || plate.length < 4 || !plateOk) { toast.error('Invalid plate number'); return; }
    if (!form.brand.trim()) { toast.error('Brand is required'); return; }
    if (!form.model.trim()) { toast.error('Model is required'); return; }
    if (!form.color.trim()) { toast.error('Color is required'); return; }

    // OR and CR are required
    const missingOr = !form.orDoc;
    const missingCr = !form.crDoc;
    setDocErrors({ orDoc: missingOr, crDoc: missingCr });
    if (missingOr || missingCr) {
      toast.error('Official Receipt (OR) and Certificate of Registration (CR) are required.');
      return;
    }
    setDocErrors({ orDoc: false, crDoc: false });

    const payload = { ...form, plateNumber: plate, isDefault: false };
    try {
      if (editingId) {
        await vehiclesService.updateVehicle(editingId, payload);
        toast.success('Vehicle updated');
      } else {
        await vehiclesService.addVehicle(payload);
        toast.success('Vehicle added');
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ ...BLANK_FORM });
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Could not save vehicle');
    }
  };

  /* set default ──────────────────────────────────────────────── */
  const handleSetDefault = async (v: any) => {
    if (v.isDefault) return;
    try {
      await vehiclesService.setDefault(v._id ?? String(v.id));
      toast.success(`${v.brand} ${v.model} set as default vehicle`);
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Could not set default vehicle');
    }
  };

  /* delete ────────────────────────────────────────────────────── */
  const handleDelete = async (v: any) => {
    if (!confirm(`Delete ${v.brand} ${v.model} (${v.plateNumber})?`)) return;
    try {
      await vehiclesService.deleteVehicle(v._id ?? String(v.id));
      toast.success('Vehicle deleted');
      await load();
      setSelectedIdx(i => Math.max(0, i - 1));
    } catch (err: any) {
      toast.error(err?.message || 'Could not delete vehicle');
    }
  };

  /* open edit modal ───────────────────────────────────────────── */
  const openEdit = (v: any) => {
    setForm({
      brand: v.brand ?? '',
      model: v.model ?? '',
      color: v.color ?? '',
      plateNumber: v.plateNumber ?? '',
      type: (v.type ?? 'sedan').toLowerCase(),
      orDoc: v.orDoc ?? null,
      crDoc: v.crDoc ?? null,
    });
    setEditingId(v._id ?? String(v.id));
    setShowModal(true);
  };

  const selected = vehicles[selectedIdx] ?? null;

  /* ─── render ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      {/* ── Top nav ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/customer/home')}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-[#1e3d5a] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <Image
              src={LOGO_SRC} alt="PakiPark"
              width={100} height={32}
              className="h-8 object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-lg font-black text-[#1e3d5a]">My Vehicles</h1>
          <button
            onClick={() => authService.logout()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all text-sm font-semibold"
            title="Log Out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* ── Section header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#1e3d5a] rounded-lg text-white">
              <VehicleIcon type={selected?.type} size={18} />
            </div>
            <h2 className="text-lg font-black text-[#1e3d5a]">My Vehicles</h2>
          </div>
          <button
            onClick={() => { setForm({ ...BLANK_FORM }); setEditingId(null); setShowModal(true); }}
            className="text-xs font-bold text-[#ee6b20] flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
          >
            <Plus size={14} /> Add New
          </button>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-300 animate-pulse">
              <Car size={40} />
              <p className="text-sm font-medium text-gray-400">Loading vehicles…</p>
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && vehicles.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-10 flex flex-col items-center gap-3">
            <div className="size-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
              <Car size={32} />
            </div>
            <div className="text-center">
              <p className="font-black text-[#1e3d5a] text-sm">No vehicles yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first vehicle to start booking</p>
            </div>
            <button
              onClick={() => { setForm({ ...BLANK_FORM }); setEditingId(null); setShowModal(true); }}
              className="mt-1 px-5 py-2.5 bg-[#ee6b20] text-white text-xs font-bold rounded-xl hover:bg-[#d95a10] transition-colors shadow-lg shadow-orange-200"
            >
              + Add Vehicle
            </button>
          </div>
        )}

        {/* ── Vehicle card + sidebar list ── */}
        {!loading && selected && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Active vehicle card */}
            <div className="lg:col-span-7 group relative overflow-hidden bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
              {/* Ghost icon watermark */}
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700 text-[#1e3d5a]">
                <VehicleIcon type={selected.type} size={140} />
              </div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-orange-100 text-[#ee6b20] text-[9px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={10} /> Active Selection
                      </span>
                      {selected.isDefault && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-black uppercase rounded-full tracking-wider flex items-center gap-1">
                          <Star size={9} className="fill-yellow-500 text-yellow-500" /> Default
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!selected.isDefault && (
                        <button
                          onClick={() => handleSetDefault(selected)}
                          className="p-1.5 bg-gray-50 text-gray-400 hover:text-yellow-500 rounded-lg transition-colors"
                          title="Set as default vehicle"
                        >
                          <Star size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(selected)}
                        className="p-1.5 bg-gray-50 text-gray-400 hover:text-[#1e3d5a] rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(selected)}
                        className="p-1.5 bg-gray-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-[#1e3d5a] mt-2 uppercase">
                    {selected.brand}{' '}
                    <span className="text-[#ee6b20]">{selected.model}</span>
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { label: 'PLATE', value: selected.plateNumber, mono: true },
                    { label: 'COLOR', value: selected.color,       mono: false },
                    { label: 'TYPE',  value: selected.type,        mono: false },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">{label}</p>
                      <p className={`text-sm font-black text-[#1e3d5a] capitalize ${mono ? 'font-mono tracking-wider' : ''}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar list */}
            <div className="lg:col-span-5 flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
              {vehicles.map((v: any, idx: number) => (
                <div
                  key={v._id ?? v.id ?? idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedIdx(idx)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedIdx(idx); }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${
                    selectedIdx === idx
                      ? 'border-[#1e3d5a] bg-white shadow-sm'
                      : 'border-transparent bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${
                    selectedIdx === idx
                      ? 'bg-[#1e3d5a] text-white'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                  }`}>
                    <VehicleIcon type={v.type} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#1e3d5a] text-xs truncate uppercase">
                      {v.brand} {v.model}
                    </h4>
                    <p className="text-[9px] font-mono font-bold text-gray-400">{v.plateNumber}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSetDefault(v); }}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      v.isDefault
                        ? 'text-yellow-500 bg-yellow-50'
                        : 'text-gray-300 hover:text-yellow-400 hover:bg-yellow-50 opacity-0 group-hover:opacity-100'
                    }`}
                    title={v.isDefault ? 'Default vehicle' : 'Set as default'}
                  >
                    <Star size={14} className={v.isDefault ? 'fill-yellow-400' : ''} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Vehicle Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-[#1e3d5a]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 max-h-[90vh] flex flex-col border border-white/20">
            {/* Modal header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-[#1e3d5a]">
                  {editingId ? 'Edit' : 'Add New'} Vehicle
                </h3>
                <p className="text-xs text-gray-400 mt-1">Enter your vehicle details below</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#1e3d5a] hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto pr-2 -mr-2 space-y-5 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="veh-type" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Vehicle Type *</label>
                  <select
                    id="veh-type"
                    className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-[#1e3d5a] focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none appearance-none"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    {['sedan','suv','van','truck','motorcycle','hatchback','pickup'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="veh-brand" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Brand *</label>
                  <input
                    id="veh-brand"
                    className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-[#1e3d5a] focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none placeholder:text-gray-400"
                    value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    placeholder="e.g., Toyota"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="veh-model" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Model *</label>
                <input
                  id="veh-model"
                  className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-[#1e3d5a] focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none placeholder:text-gray-400"
                  value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  placeholder="e.g., Vios, Fortuner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="veh-plate" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Plate Number *</label>
                  <input
                    id="veh-plate"
                    className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-mono font-bold text-[#1e3d5a] uppercase focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none placeholder:text-gray-300"
                    maxLength={8}
                    value={form.plateNumber}
                    onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value.toUpperCase() }))}
                    placeholder="ABC 1234"
                  />
                  <p className="text-[9px] text-gray-400 pl-1">Format: ABC 1234 (4–8 chars)</p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="veh-color" className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Color *</label>
                  <input
                    id="veh-color"
                    className="w-full p-3.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm font-medium text-[#1e3d5a] focus:bg-white focus:border-[#ee6b20] focus:ring-4 focus:ring-[#ee6b20]/10 outline-none placeholder:text-gray-400"
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="e.g., Pearl White"
                  />
                  <p className="text-[10px] text-amber-600 font-semibold pl-1 flex items-center gap-1">
                    <span>⚠</span> Must match the color registered in your OR/CR.
                  </p>
                </div>
              </div>

              {/* Required docs */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-gray-100 flex-1" />
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider px-2">Required Documents *</span>
                  <div className="h-px bg-gray-100 flex-1" />
                </div>
                {([['orDoc','Official Receipt (OR)', orRef], ['crDoc','Certificate of Registration (CR)', crRef]] as const).map(([field, label, ref]) => {
                  const hasError = docErrors[field as 'orDoc' | 'crDoc'];
                  const uploaded = form[field as 'orDoc' | 'crDoc'];
                  return (
                    <div
                      key={field}
                      role="button"
                      tabIndex={0}
                      onClick={() => { ref.current?.click(); setDocErrors(e => ({ ...e, [field]: false })); }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') ref.current?.click(); }}
                      className={`group border-2 border-dashed rounded-2xl p-4 flex items-center gap-4 transition-all cursor-pointer ${
                        uploaded
                          ? 'border-green-400 bg-green-50/40 hover:bg-green-50'
                          : hasError
                          ? 'border-red-400 bg-red-50/40 hover:bg-red-50/60'
                          : 'border-gray-200 hover:bg-orange-50/50 hover:border-[#ee6b20]/40'
                      }`}
                    >
                      <div className={`p-3 rounded-xl transition-all ${
                        uploaded ? 'bg-green-100' : hasError ? 'bg-red-100' : 'bg-gray-50 group-hover:bg-white group-hover:shadow-sm'
                      }`}>
                        <FileText size={20} className={uploaded ? 'text-green-600' : hasError ? 'text-red-500' : 'text-gray-400 group-hover:text-[#ee6b20] transition-colors'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[#1e3d5a]">
                            {label} <span className="text-red-500">*</span>
                          </p>
                          {/* View Sample link */}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setSampleDoc(field); }}
                            className="flex items-center gap-1 text-[10px] font-bold text-[#ee6b20] hover:text-[#d95a10] bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-full transition-all shrink-0"
                          >
                            <Eye size={11} /> View Sample
                          </button>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${
                          uploaded ? 'text-green-600 font-medium' : hasError ? 'text-red-500 font-medium' : 'text-gray-400'
                        }`}>
                          {uploaded ? `✓ ${uploaded}` : hasError ? 'This document is required' : 'Click to upload PDF, JPG, or PNG (Max 5MB)'}
                        </p>
                      </div>
                      <Upload size={18} className={`mr-2 transition-colors ${
                        uploaded ? 'text-green-500' : hasError ? 'text-red-400' : 'text-gray-300 group-hover:text-[#ee6b20]'
                      }`} />
                      <input
                        type="file" ref={ref} hidden
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={e => { handleDoc(e, field as 'orDoc'|'crDoc'); setDocErrors(d => ({ ...d, [field]: false })); }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-2xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#1e3d5a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3.5 bg-[#ee6b20] hover:bg-[#d55f1c] text-white rounded-2xl font-bold shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5"
              >
                Save Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sample Document Lightbox ── */}
      {sampleDoc && DOC_SAMPLES[sampleDoc] && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSampleDoc(null)}
        >
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-50 rounded-lg">
                  <FileText size={16} className="text-[#ee6b20]" />
                </div>
                <div>
                  <p className="font-black text-[#1e3d5a] text-sm">{DOC_SAMPLES[sampleDoc].title}</p>
                  <p className="text-[10px] text-gray-400">This is what the document should look like</p>
                </div>
              </div>
              <button
                onClick={() => setSampleDoc(null)}
                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-[#1e3d5a] transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Image */}
            <div className="p-4 bg-gray-50">
              <Image
                src={DOC_SAMPLES[sampleDoc].src}
                alt={DOC_SAMPLES[sampleDoc].title}
                width={600}
                height={820}
                className="w-full h-auto rounded-2xl shadow-sm border border-gray-200"
                unoptimized
              />
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-orange-50 border-t border-orange-100 flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#ee6b20] uppercase tracking-wider">
                ⚠ Upload a clear, readable scan or photo of your actual document.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
