import type { ReactNode } from 'react';
import { AlertTriangle, Star, X } from 'lucide-react';

export type AccountAction = 'suspend' | 'reactivate' | 'deactivate';

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

interface RatingFeedbackItem {
  date: string;
  customer?: string;
  rating: number;
  comment: string;
}

/** Shared "recent customer feedback" list used by the driver and operator detail pages. */
export function RatingsFeedbackList({ items }: { items: RatingFeedbackItem[] }) {
  return (
    <div className="mt-6 space-y-3">
      {items.map((item) => (
        <div key={`${item.date}-${item.customer}`} className="rounded-2xl bg-[#F0F9F8] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-[#041614]">{item.customer}</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">{formatDate(item.date)}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-amber-600">
              <Star className="h-3.5 w-3.5 fill-current" />
              {item.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-3 text-sm font-medium leading-6 text-[#1A5D56]">{item.comment}</p>
        </div>
      ))}
    </div>
  );
}

export function ProfileLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#F0F9F8] px-4 py-3">
      <span className="text-[#39B5A8]">{icon}</span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">{label}</p>
        <p className="text-sm font-bold text-[#1A5D56]">{value}</p>
      </div>
    </div>
  );
}

export function MetricCard({
  detail,
  icon,
  label,
  tone,
  value,
}: {
  detail: string;
  icon: ReactNode;
  label: string;
  tone: 'emerald' | 'blue' | 'amber' | 'red';
  value: string;
}) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="rounded-[2rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
      <div className={`inline-flex rounded-2xl p-3 ${tones[tone]}`}>{icon}</div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#041614]">{value}</p>
      <p className="mt-2 text-sm font-semibold text-gray-400">{detail}</p>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">{children}</th>;
}

export function AccountStandingBadge({ standing }: { standing: string }) {
  const standingConfig: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    suspended: 'bg-amber-50 text-amber-600 border-amber-100',
    deactivated: 'bg-red-50 text-red-600 border-red-100',
  };

  const labels: Record<string, string> = {
    active: 'Active',
    suspended: 'Suspended',
    deactivated: 'Permanently Deactivated',
  };

  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${standingConfig[standing] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {labels[standing] || standing}
    </span>
  );
}

interface AccountActionModalProps {
  action: AccountAction;
  /** Singular noun for the managed entity, e.g. "Driver" or "Operator". */
  entityNoun: string;
  /** Display name shown under the title (driver name or business name). */
  subjectName: string;
  onCancel: () => void;
  onConfirm: () => void;
  onReasonChange: (reason: string) => void;
  reason: string;
}

export function AccountActionModal({
  action,
  entityNoun,
  subjectName,
  onCancel,
  onConfirm,
  onReasonChange,
  reason,
}: AccountActionModalProps) {
  const actionLabels: Record<AccountAction, string> = {
    suspend: `Suspend ${entityNoun}`,
    reactivate: `Reactivate ${entityNoun}`,
    deactivate: `Deactivate ${entityNoun} Permanently`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-start gap-4">
          <div className="rounded-2xl bg-red-100 p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[#041614]">{actionLabels[action]}</h2>
            <p className="mt-1 text-sm font-medium text-gray-400">{subjectName}</p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-xl p-2 transition-colors hover:bg-[#F0F9F8]">
            <X className="h-5 w-5 text-[#1A5D56]" />
          </button>
        </div>

        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#39B5A8]">Reason *</label>
        <textarea
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Enter reason"
          rows={4}
          className="w-full resize-none rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-3 text-sm font-medium text-[#041614] outline-none transition-all focus:border-[#39B5A8]"
          required
        />

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl bg-gray-100 px-6 py-3 font-bold text-[#1A5D56] transition-all hover:bg-gray-200">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!reason.trim()}
            className="flex-1 rounded-xl bg-red-500 px-6 py-3 font-bold text-white transition-all hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
