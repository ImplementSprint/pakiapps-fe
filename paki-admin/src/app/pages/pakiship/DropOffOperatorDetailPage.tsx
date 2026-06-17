import { useState, useEffect, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Package,
  PackageCheck,
  Percent,
  Phone,
  RotateCcw,
  ShieldOff,
  Star,
  Store,
  TrendingUp,
  X,
} from 'lucide-react';

import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { useNavigate } from '../../lib/router';
import { fetchOperatorDetail, updateOperatorAccountStatus, type OperatorDetailRow } from '../../lib/supabaseSchema';

interface DropOffOperatorDetailPageProps {
  operatorId: string;
}

type AccountAction = 'suspend' | 'reactivate' | 'deactivate';

export default function DropOffOperatorDetailPage({ operatorId }: DropOffOperatorDetailPageProps) {
  const navigate = useNavigate();
  const [operator, setOperator] = useState<OperatorDetailRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<AccountAction | null>(null);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchOperatorDetail(operatorId)
      .then((data) => { if (isMounted) { setOperator(data); setIsLoading(false); } })
      .catch(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [operatorId]);

  const latestRating = operator?.customerRatings?.[0];
  const capacity = operator?.binCapacity;

  const closeActionModal = () => {
    setPendingAction(null);
    setActionReason('');
  };

  const handleConfirmAccountAction = async () => {
    if (!pendingAction || !actionReason.trim() || !operator) return;
    await updateOperatorAccountStatus(operator.id, pendingAction, actionReason.trim());
    const actionDate = new Date().toISOString().split('T')[0];
    const nextStanding = pendingAction === 'reactivate' ? 'active' : pendingAction === 'suspend' ? 'suspended' : 'deactivated';
    const nextStatus = pendingAction === 'reactivate' ? 'active' : pendingAction === 'suspend' ? 'suspended' : 'deactivated';
    setOperator((current: OperatorDetailRow | null) => current ? ({
      ...current,
      accountStanding: nextStanding,
      status: nextStatus,
      accountActionDate: actionDate,
      accountActionReason: actionReason.trim(),
      lastActive: pendingAction === 'deactivate' ? 'Permanently deactivated' : current.lastActive,
      operatingHours: pendingAction === 'deactivate' ? 'Deactivated' : pendingAction === 'suspend' ? 'Suspended' : current.operatingHours,
    }) : current);
    closeActionModal();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <PakiShipSidebar activeTab="drop-off-operators" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#39B5A8]/10 bg-white/80 px-10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate('/pakiship/drop-off-operators')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-sm font-bold text-[#1A5D56] transition-colors hover:bg-[#39B5A8]/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Operators
          </button>

          <div className="rounded-full border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#39B5A8]">
            {operator?.id ?? '...'}
          </div>
        </header>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-bold text-[#39B5A8] uppercase tracking-widest animate-pulse">Loading operator...</p>
          </div>
        ) : !operator ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-bold text-red-400">Operator not found.</p>
          </div>
        ) : (

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          <section className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] text-2xl font-black text-white shadow-lg shadow-[#39B5A8]/20">
                  {operator.businessName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-[#041614]">{operator.businessName}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <StatusBadge status={operator.status} />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-600 border border-amber-100">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {operator.averageRating.toFixed(1)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F9F8] px-3 py-1 text-xs font-bold text-[#39B5A8]">
                      <Store className="h-3.5 w-3.5" />
                      {operator.location}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-[#1A5D56] sm:grid-cols-2">
                <ProfileLine icon={<Mail className="h-4 w-4" />} label="Email" value={operator.email} />
                <ProfileLine icon={<Phone className="h-4 w-4" />} label="Phone" value={operator.phone} />
                <ProfileLine icon={<MapPin className="h-4 w-4" />} label="Region" value={`${operator.location}, ${operator.region}`} />
                <ProfileLine icon={<Clock className="h-4 w-4" />} label="Hours" value={operator.operatingHours} />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#F0F9F8] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">Registered Address</p>
              <p className="mt-1 text-sm font-bold text-[#1A5D56]">{operator.address}</p>
              <p className="mt-1 text-xs font-semibold text-gray-400">{operator.ownerName}</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<PackageCheck className="h-5 w-5" />} label="Parcels Handled" value={operator.parcelsHandled.toLocaleString()} detail={`${operator.pendingParcels} pending parcels`} tone="emerald" />
            <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="Successful Handoffs" value={`${operator.successfulHandoffRate}%`} detail="Completed without exception" tone="blue" />
            <MetricCard icon={<Percent className="h-5 w-5" />} label="Issue Rate" value={`${operator.issueRate}%`} detail="Recent exception rate" tone="red" />
            <MetricCard icon={<Star className="h-5 w-5" />} label="Customer Rating" value={operator.averageRating.toFixed(1)} detail={`Latest ${latestRating ? latestRating.rating.toFixed(1) : '0.0'} rating`} tone="amber" />
          </section>

          <section className="rounded-[2rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Account Standing</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#041614]">Operator Account Controls</h2>
                  <AccountStandingBadge standing={operator.accountStanding} />
                </div>
                {operator.accountActionReason && (
                  <div className="mt-4 rounded-2xl bg-[#F0F9F8] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">Latest Reason</p>
                    <p className="mt-1 text-sm font-semibold text-[#1A5D56]">{operator.accountActionReason}</p>
                    {operator.accountActionDate && <p className="mt-1 text-xs font-semibold text-gray-400">{formatDate(operator.accountActionDate)}</p>}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {operator.accountStanding === 'active' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPendingAction('suspend')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-600"
                    >
                      <ShieldOff className="h-4 w-4" />
                      Suspend
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAction('deactivate')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600"
                    >
                      <Ban className="h-4 w-4" />
                      Deactivate Permanently
                    </button>
                  </>
                )}

                {operator.accountStanding === 'suspended' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPendingAction('reactivate')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reactivate
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAction('deactivate')}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600"
                    >
                      <Ban className="h-4 w-4" />
                      Deactivate Permanently
                    </button>
                  </>
                )}

                {operator.accountStanding === 'deactivated' && (
                  <p className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-bold text-red-600">
                    Account permanently deactivated
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#041614]">Bin Capacity</h2>
                  <p className="text-sm font-semibold text-[#1A5D56]/60">{(capacity?.utilizationRate ?? 0)}% utilized</p>
                </div>
                <span className="rounded-full border border-[#39B5A8]/10 bg-[#F0F9F8] px-3 py-1 text-xs font-black text-[#39B5A8]">
                  {(capacity?.availableBins ?? 0)} Available
                </span>
              </div>

              <div className="mt-6">
                <div className="h-3 overflow-hidden rounded-full bg-[#F0F9F8]">
                  <div className="h-full rounded-full bg-[#39B5A8]" style={{ width: `${capacity?.utilizationRate ?? 0}%` }} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <CapacityTile label="Total Bins" value={(capacity?.totalBins ?? 0).toLocaleString()} />
                  <CapacityTile label="Occupied" value={(capacity?.occupiedBins ?? 0).toLocaleString()} />
                  <CapacityTile label="Reserved" value={(capacity?.reservedBins ?? 0).toLocaleString()} />
                  <CapacityTile label="Available" value={(capacity?.availableBins ?? 0).toLocaleString()} />
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#041614]">Customer Ratings</h2>
                  <p className="text-sm font-semibold text-[#1A5D56]/60">Recent drop-off feedback</p>
                </div>
                <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-600">
                  {operator.averageRating.toFixed(1)} Average
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {operator.customerRatings.map((item: any) => (
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
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-[#39B5A8]/10 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#39B5A8]/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#041614]">Drop-Off History</h2>
                <p className="text-sm font-semibold text-[#1A5D56]/60">Recent parcel intake and release records</p>
              </div>
              <Package className="h-5 w-5 text-[#39B5A8]" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F0F9F8]/70 border-b border-[#39B5A8]/10">
                  <tr>
                    <TableHead>Record</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Released</TableHead>
                    <TableHead>Exceptions</TableHead>
                    <TableHead>Status</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#39B5A8]/5">
                  {operator.dropOffHistory.map((item: any) => (
                    <HistoryRow key={item.id} history={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
        )}
      </div>

      {pendingAction && operator && (
        <AccountActionModal
          action={pendingAction}
          businessName={operator.businessName}
          onCancel={closeActionModal}
          onConfirm={handleConfirmAccountAction}
          onReasonChange={setActionReason}
          reason={actionReason}
        />
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function ProfileLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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

function MetricCard({
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

function CapacityTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F0F9F8] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#041614]">{value}</p>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest">{children}</th>;
}

interface DropOffHistoryItem {
  id: string;
  date: string;
  parcelsReceived: number;
  parcelsReleased: number;
  exceptions: number;
  status: string;
}

function HistoryRow({ history }: { history: DropOffHistoryItem }) {
  return (
    <tr className="transition-colors hover:bg-[#F0F9F8]/30">
      <td className="px-6 py-5">
        <p className="font-bold text-[#041614]">{history.id}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(history.date)}
        </p>
      </td>
      <td className="px-6 py-5">
        <p className="font-black text-[#041614]">{history.parcelsReceived.toLocaleString()}</p>
      </td>
      <td className="px-6 py-5">
        <p className="font-black text-[#041614]">{history.parcelsReleased.toLocaleString()}</p>
      </td>
      <td className="px-6 py-5">
        <p className={`font-black ${history.exceptions > 0 ? 'text-red-500' : 'text-[#1A5D56]'}`}>{history.exceptions}</p>
      </td>
      <td className="px-6 py-5">
        <HistoryStatusBadge status={history.status} />
      </td>
    </tr>
  );
}

function HistoryStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, string> = {
    Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'In Progress': 'bg-blue-50 text-blue-600 border-blue-100',
    'Issue Logged': 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${statusConfig[status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {status}
    </span>
  );
}

function AccountStandingBadge({ standing }: { standing: string }) {
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

function AccountActionModal({
  action,
  businessName,
  onCancel,
  onConfirm,
  onReasonChange,
  reason,
}: {
  action: AccountAction;
  businessName: string;
  onCancel: () => void;
  onConfirm: () => void;
  onReasonChange: (reason: string) => void;
  reason: string;
}) {
  const actionLabels = {
    suspend: 'Suspend Operator',
    reactivate: 'Reactivate Operator',
    deactivate: 'Deactivate Operator Permanently',
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
            <p className="mt-1 text-sm font-medium text-gray-400">{businessName}</p>
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

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    limited: 'bg-amber-50 text-amber-600 border-amber-100',
    inactive: 'bg-gray-50 text-gray-500 border-gray-100',
    suspended: 'bg-red-50 text-red-600 border-red-100',
    deactivated: 'bg-red-100 text-red-700 border-red-200',
  };

  const labels: Record<string, string> = {
    active: 'Active',
    limited: 'Limited Capacity',
    inactive: 'Inactive',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
  };

  return (
    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${statusConfig[status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}
