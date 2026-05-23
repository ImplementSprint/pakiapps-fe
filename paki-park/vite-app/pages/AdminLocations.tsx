import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  MapPin, Plus, Edit2, Trash2, Settings, CheckCircle, AlertTriangle,
  Clock, Car, DollarSign, X, ChevronDown, Wifi, RefreshCw, Layers,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { locationService, type Location } from '../services/locationService';
import { parkingSlotService, type GenerateSlotsPayload } from '../services/parkingSlotService';
import { AdvancedParkingConfig, type AdvancedParkingConfig as AdvancedParkingConfigType } from '../components/AdvancedParkingConfig';

// ── Types ─────────────────────────────────────────────────────────────────────
type LocationStatus = 'active' | 'maintenance' | 'closed';

interface LocationForm {
  name: string;
  address: string;
  lat: string;
  lng: string;
  totalSpots: string;
  hourlyRate: string;
  status: LocationStatus;
  operatingHours: string;
  amenitiesInput: string;
  amenities: string[];
}

const defaultForm = (): LocationForm => ({
  name: '', address: '', lat: '', lng: '',
  totalSpots: '100', hourlyRate: '50',
  status: 'active', operatingHours: '06:00 - 23:00',
  amenitiesInput: '', amenities: [],
});

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LocationStatus }) {
  const map = {
    active:      { cls: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    maintenance: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle },
    closed:      { cls: 'bg-red-100 text-red-700 border-red-200', icon: X },
  };
  const { cls, icon: Icon } = map[status] || map.active;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${cls}`}>
      <Icon className="size-3" />{status}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AdminLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationForm>(defaultForm());
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Slot configuration
  const [configTarget, setConfigTarget] = useState<Location | null>(null);
  const [showSlotConfig, setShowSlotConfig] = useState(false);
  const [syncingSlots, setSyncingSlots] = useState(false);

  // ── Load locations ──────────────────────────────────────────────────────────
  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const data = await locationService.getLocations();
      setLocations(data);
      // Load slot counts in parallel
      const counts: Record<string, number> = {};
      await Promise.allSettled(data.map(async (loc) => {
        try {
          const slots = await parkingSlotService.getSlotsByLocation(loc._id);
          counts[loc._id] = slots.length;
        } catch { counts[loc._id] = 0; }
      }));
      setSlotCounts(counts);
    } catch { toast.error('Failed to load locations'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadLocations(); }, []);

  // ── Form helpers ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingLocation(null);
    setForm(defaultForm());
    setShowFormModal(true);
  };

  const openEdit = (loc: Location) => {
    setEditingLocation(loc);
    setForm({
      name: loc.name,
      address: loc.address,
      lat: loc.lat?.toString() || '',
      lng: loc.lng?.toString() || '',
      totalSpots: loc.totalSpots.toString(),
      hourlyRate: loc.hourlyRate.toString(),
      status: loc.status,
      operatingHours: loc.operatingHours || '06:00 - 23:00',
      amenitiesInput: '',
      amenities: loc.amenities || [],
    });
    setShowFormModal(true);
  };

  const addAmenity = () => {
    const tag = form.amenitiesInput.trim();
    if (tag && !form.amenities.includes(tag)) {
      setForm(f => ({ ...f, amenities: [...f.amenities, tag], amenitiesInput: '' }));
    }
  };

  const removeAmenity = (a: string) => {
    setForm(f => ({ ...f, amenities: f.amenities.filter(x => x !== a) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      toast.error('Name and address are required');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<Location> = {
        name: form.name.trim(),
        address: form.address.trim(),
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
        totalSpots: parseInt(form.totalSpots) || 100,
        availableSpots: parseInt(form.totalSpots) || 100,
        hourlyRate: parseFloat(form.hourlyRate) || 50,
        status: form.status,
        operatingHours: form.operatingHours,
        amenities: form.amenities,
      };

      if (editingLocation) {
        await locationService.updateLocation(editingLocation._id, payload);
        toast.success(`${form.name} updated!`);
      } else {
        await locationService.createLocation(payload);
        toast.success(`${form.name} created!`);
      }
      setShowFormModal(false);
      await loadLocations();
    } catch (err: any) {
      toast.error(err?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await locationService.deleteLocation(deleteTarget._id);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      await loadLocations();
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  // ── Slot config ─────────────────────────────────────────────────────────────
  const handleSlotConfigSave = async (config: AdvancedParkingConfigType) => {
    if (!configTarget || !config.isEvenLayout || !config.evenConfig) {
      toast.error('Only even (grid) layouts can be synced automatically. Use the parking dashboard for custom layouts.');
      setShowSlotConfig(false);
      return;
    }
    setSyncingSlots(true);
    try {
      const sections = Array.from({ length: config.evenConfig.rows }, (_, i) => String.fromCharCode(65 + i));
      const payload: GenerateSlotsPayload = {
        locationId: configTarget._id,
        sections,
        slotsPerSection: config.evenConfig.columns,
        floors: config.floors,
      };
      const slots = await parkingSlotService.generateSlots(payload);
      toast.success(`${slots.length} slots configured for ${configTarget.name}! Location totals updated.`);
      setShowSlotConfig(false);
      setConfigTarget(null);
      // Reload all locations so totalSpots + availableSpots reflect the new slot count
      await loadLocations();
    } catch (err: any) {
      toast.error(err?.message || 'Slot configuration failed');
    } finally { setSyncingSlots(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3d5a]">Parking Locations</h1>
          <p className="text-gray-500 mt-1">Manage all parking facilities and their slot configurations.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadLocations} variant="outline" className="rounded-xl font-bold border-gray-200" disabled={isLoading}>
            <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={openCreate} className="bg-[#ee6b20] hover:bg-[#d55f1c] rounded-xl font-bold shadow-md">
            <Plus className="size-4 mr-2" /> Add Location
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 gap-4">
          <RefreshCw className="size-8 text-[#ee6b20] animate-spin" />
          <span className="text-gray-400 font-medium">Loading locations…</span>
        </div>
      )}

      {/* Locations grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <div key={loc._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Card header */}
              <div className="bg-gradient-to-r from-[#1e3d5a] to-[#2a5373] p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">{loc.name}</h3>
                    <p className="text-white/70 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{loc.address}</span>
                    </p>
                  </div>
                  <StatusBadge status={loc.status} />
                </div>
              </div>

              {/* Card body */}
              <div className="p-6 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Car className="size-4 text-[#ee6b20] mx-auto mb-1" />
                    <p className="text-lg font-black text-[#1e3d5a]">{loc.availableSpots}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Available</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <Layers className="size-4 text-blue-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-[#1e3d5a]">{loc.totalSpots}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <DollarSign className="size-4 text-green-500 mx-auto mb-1" />
                    <p className="text-lg font-black text-[#1e3d5a]">₱{loc.hourlyRate}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">per hour</p>
                  </div>
                </div>

                {/* Operating hours + slot count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Clock className="size-4" /> {loc.operatingHours}
                  </span>
                  <span className={`flex items-center gap-2 font-bold px-3 py-1 rounded-full text-xs border ${
                    (slotCounts[loc._id] || 0) > 0
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    <Wifi className="size-3" />
                    {slotCounts[loc._id] || 0} DB Slots
                  </span>
                </div>

                {/* Amenities */}
                {loc.amenities && loc.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {loc.amenities.map(a => (
                      <span key={a} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">{a}</span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Button onClick={() => { setConfigTarget(loc); setShowSlotConfig(true); }}
                    variant="outline" className="flex-1 rounded-xl font-bold text-[#1e3d5a] border-[#1e3d5a]/30 hover:bg-blue-50 text-xs">
                    <Settings className="size-3.5 mr-1.5" /> Configure Slots
                  </Button>
                  <Button onClick={() => openEdit(loc)} variant="outline" className="rounded-xl font-bold border-gray-200 hover:bg-orange-50 hover:border-[#ee6b20] text-xs">
                    <Edit2 className="size-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button onClick={() => setDeleteTarget(loc)} variant="outline"
                    className="rounded-xl font-bold border-gray-200 hover:bg-red-50 hover:border-red-300 text-red-500 text-xs">
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {locations.length === 0 && (
            <div className="col-span-2 text-center py-20 text-gray-400">
              <MapPin className="size-12 mx-auto mb-4 opacity-30" />
              <p className="font-bold text-lg">No parking locations yet</p>
              <p className="text-sm mt-1">Create your first location to get started.</p>
              <Button onClick={openCreate} className="mt-6 bg-[#ee6b20] hover:bg-[#d55f1c] rounded-xl">
                <Plus className="size-4 mr-2" /> Add First Location
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Create / Edit Location Modal ──────────────────────────────────── */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowFormModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-[#1e3d5a] p-6 rounded-t-3xl flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{editingLocation ? `Edit: ${editingLocation.name}` : 'Add New Location'}</h2>
              <button onClick={() => setShowFormModal(false)} className="text-white/60 hover:text-white"><X className="size-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name + Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location Name *</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. SM Mall of Asia" className="rounded-xl" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address *</label>
                  <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street, City, Province" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Latitude</label>
                  <Input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} placeholder="14.5547" type="number" step="any" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Longitude</label>
                  <Input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} placeholder="121.0244" type="number" step="any" className="rounded-xl" />
                </div>
              </div>

              {/* Spot counts + rates */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Spots</label>
                  <Input value={form.totalSpots} onChange={e => setForm(f => ({ ...f, totalSpots: e.target.value }))} type="number" min="1" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hourly Rate (₱)</label>
                  <Input value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} type="number" min="0" className="rounded-xl" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm"
                    value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as LocationStatus }))}>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Operating hours */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Operating Hours</label>
                <Input value={form.operatingHours} onChange={e => setForm(f => ({ ...f, operatingHours: e.target.value }))} placeholder="06:00 - 23:00" className="rounded-xl" />
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amenities</label>
                <div className="flex gap-2 mb-2">
                  <Input value={form.amenitiesInput} onChange={e => setForm(f => ({ ...f, amenitiesInput: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                    placeholder="e.g. CCTV, Covered, EV Charging" className="rounded-xl flex-1" />
                  <Button onClick={addAmenity} variant="outline" className="rounded-xl border-gray-200">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.amenities.map(a => (
                    <span key={a} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                      {a}
                      <button onClick={() => removeAmenity(a)} className="ml-1 hover:text-red-500"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <Button variant="outline" onClick={() => setShowFormModal(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-[#1e3d5a] hover:bg-[#16304a] rounded-xl font-bold">
                {saving ? <RefreshCw className="size-4 mr-2 animate-spin" /> : null}
                {saving ? 'Saving…' : editingLocation ? 'Save Changes' : 'Create Location'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="size-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="size-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-[#1e3d5a] mb-2">Delete Location?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete <span className="font-bold text-red-600">{deleteTarget.name}</span> and all its parking slot configurations. Active bookings will remain but lose their location reference.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl">
                {deleting ? <RefreshCw className="size-4 mr-2 animate-spin" /> : null}
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slot configuration modal (AdvancedParkingConfig) ──────────────── */}
      {configTarget && (
        <div className="fixed inset-0 z-[105]">
          {syncingSlots && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-xl">
                <RefreshCw className="size-6 text-[#ee6b20] animate-spin" />
                <span className="font-bold text-[#1e3d5a]">Syncing slots to database…</span>
              </div>
            </div>
          )}
          <AdvancedParkingConfig
            isOpen={true}
            onClose={() => { setShowSlotConfig(false); setConfigTarget(null); }}
            onSave={handleSlotConfigSave}
          />
        </div>
      )}
    </div>
  );
}
