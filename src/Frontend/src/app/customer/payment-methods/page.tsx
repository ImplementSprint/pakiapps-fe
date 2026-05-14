'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, CreditCard, Smartphone, Plus, Trash2,
  Star, CheckCircle2, AlertCircle, LogOut, X, Loader2,
  Shield, Wifi, Lock,
} from 'lucide-react';
import { paymentMethodService, type PaymentMethod } from '@/services/paymentMethodService';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';
const PH_RE    = /^(\+639|09)\d{9}$/;

// ── Link GCash Modal ──────────────────────────────────────────────────────────
function LinkGCashModal({ onClose, onLinked }: { onClose: () => void; onLinked: (m: PaymentMethod) => void }) {
  const [mobile,  setMobile]  = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = mobile.trim();
    if (!PH_RE.test(cleaned)) {
      toast.error('Invalid number — use format 09XXXXXXXXX or +639XXXXXXXXX');
      return;
    }
    setLoading(true);
    try {
      const method = await paymentMethodService.linkGCash(cleaned);
      toast.success('GCash account linked successfully! 🎉');
      onLinked(method);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to link GCash');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">💙</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1e3d5a]">Link GCash</h2>
              <p className="text-xs text-gray-400 font-medium">Enter your registered GCash number</p>
            </div>
          </div>
          <button onClick={onClose} className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="size-4 text-gray-500" />
          </button>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-6">
          <Lock className="size-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700 font-medium">
            Only your number is stored — we never access your GCash balance or OTP.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-black tracking-widest text-[#1e3d5a] uppercase">
              GCash Mobile Number
            </label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="09XXXXXXXXX"
                maxLength={13}
                required
                className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            {mobile && !PH_RE.test(mobile.trim()) && (
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="size-3" /> Use format 09XXXXXXXXX or +639XXXXXXXXX
              </p>
            )}
            {mobile && PH_RE.test(mobile.trim()) && (
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Valid PH mobile number
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !PH_RE.test(mobile.trim())}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="size-4 animate-spin" />Linking…</> : <>💙 Link GCash Account</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Method Card ───────────────────────────────────────────────────────────────
function MethodCard({
  method, onRemove, onSetDefault, removing, settingDefault,
}: {
  method: PaymentMethod;
  onRemove:     (id: number) => void;
  onSetDefault: (id: number) => void;
  removing:     number | null;
  settingDefault: number | null;
}) {
  const busy = removing === method.id || settingDefault === method.id;

  return (
    <div className={`bg-white rounded-2xl border p-5 flex items-center gap-4 transition-all hover:shadow-md ${
      method.isDefault
        ? 'border-blue-200 ring-2 ring-blue-100 bg-gradient-to-r from-blue-50/40 to-white'
        : 'border-gray-100 hover:border-gray-200'
    }`}>

      {/* Provider icon */}
      <div className={`size-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
        method.isDefault ? 'bg-blue-100' : 'bg-gray-50'
      }`}>
        💙
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-black text-[#1e3d5a] text-sm">{method.displayLabel || 'GCash'}</p>
          {method.isDefault && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full">
              <Star className="size-2.5 fill-blue-600" /> Default
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{method.mobileNumber}</p>
        <p className="text-[10px] text-gray-300 mt-1">Added {new Date(method.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!method.isDefault && (
          <button
            onClick={() => onSetDefault(method.id)}
            disabled={busy}
            className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
            title="Set as default"
          >
            {settingDefault === method.id
              ? <Loader2 className="size-4 animate-spin" />
              : <Star className="size-4" />
            }
          </button>
        )}
        <button
          onClick={() => onRemove(method.id)}
          disabled={busy}
          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          title="Remove"
        >
          {removing === method.id
            ? <Loader2 className="size-4 animate-spin" />
            : <Trash2 className="size-4" />
          }
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PaymentMethodsPage() {
  const router = useRouter();

  const [methods,        setMethods]        = useState<PaymentMethod[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [removing,       setRemoving]       = useState<number | null>(null);
  const [settingDefault, setSettingDefault] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await paymentMethodService.getAll();
      setMethods(data);
    } catch {
      toast.error('Could not load payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLinked = (m: PaymentMethod) => {
    setMethods(prev => [m, ...prev.filter(x => x.id !== m.id)]);
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Remove this payment method?')) return;
    setRemoving(id);
    try {
      await paymentMethodService.remove(id);
      setMethods(prev => prev.filter(m => m.id !== id));
      toast.success('Payment method removed');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove');
    } finally {
      setRemoving(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    setSettingDefault(id);
    try {
      await paymentMethodService.setDefault(id);
      setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
      toast.success('Default payment method updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update default');
    } finally {
      setSettingDefault(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 pb-12">
      {showModal && (
        <LinkGCashModal
          onClose={() => setShowModal(false)}
          onLinked={handleLinked}
        />
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customer/profile')}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-[#1e3d5a] transition-colors"
            >
              <ArrowLeft className="size-5" />
            </button>
            <Image src={LOGO_SRC} alt="PakiPark" width={100} height={32} className="h-8 w-auto object-contain" unoptimized />
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-[#1e3d5a] hidden sm:block">Payment Methods</h1>
            <button
              onClick={() => authService.logout()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-all text-sm font-semibold"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">

        {/* Hero banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-[2rem] p-8 text-white shadow-xl">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 size-40 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -left-8 size-48 bg-white/5 rounded-full pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="size-5 text-[#ee6b20]" />
                <span className="text-xs font-black tracking-widest text-white/50 uppercase">Saved Methods</span>
              </div>
              <h2 className="text-2xl font-black mb-1">Payment Wallet</h2>
              <p className="text-white/60 text-sm">
                {methods.length === 0
                  ? 'No saved methods yet — link GCash to pay instantly'
                  : `${methods.length} method${methods.length > 1 ? 's' : ''} saved`}
              </p>
            </div>
            <div className="size-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-5xl">
              💙
            </div>
          </div>

          {/* Features row */}
          <div className="relative z-10 grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: <Wifi className="size-3" />,    label: 'Instant Pay' },
              { icon: <Shield className="size-3" />,  label: 'Secure' },
              { icon: <CheckCircle2 className="size-3" />, label: 'No CVV needed' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-1.5 text-white/80 text-xs font-bold">
                {f.icon} {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* Add button */}
        <button
          id="btn-link-gcash"
          onClick={() => setShowModal(true)}
          className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-blue-200 rounded-2xl text-blue-600 font-black hover:bg-blue-50 hover:border-blue-300 transition-all group"
        >
          <div className="size-8 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="size-4 text-blue-600" />
          </div>
          Link GCash Account
        </button>

        {/* Methods list */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#1e3d5a] uppercase tracking-widest">Your Saved Methods</h3>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 className="size-8 animate-spin text-blue-400" />
                <p className="text-sm font-medium">Loading payment methods…</p>
              </div>
            </div>
          )}

          {!loading && methods.length === 0 && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">💳</div>
              <p className="font-black text-[#1e3d5a] mb-1">No payment methods yet</p>
              <p className="text-sm text-gray-400">Link your GCash account above to pay for bookings instantly.</p>
            </div>
          )}

          {!loading && methods.map(m => (
            <MethodCard
              key={m.id}
              method={m}
              onRemove={handleRemove}
              onSetDefault={handleSetDefault}
              removing={removing}
              settingDefault={settingDefault}
            />
          ))}
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h4 className="font-black text-[#1e3d5a] mb-4 flex items-center gap-2">
            <Shield className="size-4 text-[#ee6b20]" />
            How Auto-Charge Works
          </h4>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Link your GCash number above' },
              { step: '2', text: 'When booking, select "GCash (linked)" as payment method' },
              { step: '3', text: 'Your default saved method is pre-selected automatically' },
              { step: '4', text: 'Booking fee is charged upon confirmation — no manual payment needed' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <div className="size-6 bg-[#1e3d5a] text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">
                  {step}
                </div>
                <p className="text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
