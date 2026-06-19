import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Ban,
  Calendar,
  Clock,
  MapPin,
  PackageCheck,
  Percent,
  Phone,
  Mail,
  Star,
  Timer,
  Truck,
  User,
  RotateCcw,
  ShieldOff,
} from 'lucide-react';

import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { useNavigate } from '../../lib/router';
import { fetchDriverDetail, updateDriverAccountStatus, type DriverDetailRow } from '../../lib/supabaseSchema';
import {
  AccountActionModal,
  AccountStandingBadge,
  MetricCard,
  ProfileLine,
  RatingsFeedbackList,
  TableHead,
  formatDate,
  type AccountAction,
} from '../../components/pakiship/accountDetail';

interface DriverDetailPageProps {
  driverId: string;
}

export default function DriverDetailPage({ driverId }: DriverDetailPageProps) {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverDetailRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<AccountAction | null>(null);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchDriverDetail(driverId)
      .then((data) => { if (isMounted) { setDriver(data); setIsLoading(false); } })
      .catch(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [driverId]);

  const latestRating = driver?.ratingsHistory?.[0];

  const closeActionModal = () => {
    setPendingAction(null);
    setActionReason('');
  };

  const handleConfirmAccountAction = async () => {
    if (!pendingAction || !actionReason.trim() || !driver) return;
    await updateDriverAccountStatus(driver.id, pendingAction, actionReason.trim());
    const actionDate = new Date().toISOString().split('T')[0];
    const nextStanding = pendingAction === 'reactivate' ? 'active' : pendingAction === 'suspend' ? 'suspended' : 'deactivated';
    const nextStatus = pendingAction === 'reactivate' ? 'available' : pendingAction === 'suspend' ? 'suspended' : 'deactivated';
    setDriver((current) => current ? ({
      ...current,
      accountStanding: nextStanding,
      status: nextStatus,
      accountActionDate: actionDate,
      accountActionReason: actionReason.trim(),
      lastActive: pendingAction === 'deactivate' ? 'Permanently deactivated' : current.lastActive,
    }) : current);
    closeActionModal();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <PakiShipSidebar activeTab="drivers" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#39B5A8]/10 bg-white/80 px-10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate('/pakiship/drivers')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-sm font-bold text-[#1A5D56] transition-colors hover:bg-[#39B5A8]/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Drivers
          </button>

          <div className="rounded-full border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#39B5A8]">
            {driver?.id ?? '...'}
          </div>
        </header>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-bold text-[#39B5A8] uppercase tracking-widest animate-pulse">Loading driver...</p>
          </div>
        ) : !driver ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm font-bold text-red-400">Driver not found.</p>
          </div>
        ) : (

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          <section className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] text-2xl font-black text-white shadow-lg shadow-[#39B5A8]/20">
                  {driver.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-[#041614]">{driver.name}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <StatusBadge status={driver.status} />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-600 border border-amber-100">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {driver.rating.toFixed(1)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F9F8] px-3 py-1 text-xs font-bold text-[#39B5A8]">
                      <Truck className="h-3.5 w-3.5" />
                      {driver.vehicleType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-[#1A5D56] sm:grid-cols-2">
                <ProfileLine icon={<Mail className="h-4 w-4" />} label="Email" value={driver.email} />
                <ProfileLine icon={<Phone className="h-4 w-4" />} label="Phone" value={driver.phone} />
                <ProfileLine icon={<MapPin className="h-4 w-4" />} label="Region" value={`${driver.city}, ${driver.region}`} />
                <ProfileLine icon={<Clock className="h-4 w-4" />} label="Last Active" value={driver.lastActive} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<PackageCheck className="h-5 w-5" />} label="Completed Deliveries" value={driver.completedDeliveries.toLocaleString()} detail="Lifetime completed jobs" tone="emerald" />
            <MetricCard icon={<Percent className="h-5 w-5" />} label="On-Time Rate" value={`${driver.onTimeRate}%`} detail="Delivered within promised window" tone="blue" />
            <MetricCard icon={<Timer className="h-5 w-5" />} label="Average Time" value={driver.averageDeliveryTime} detail="Average completed delivery time" tone="amber" />
            <MetricCard icon={<User className="h-5 w-5" />} label="Cancellation Rate" value={`${driver.cancellationRate}%`} detail={`${driver.acceptanceRate}% assignment acceptance`} tone="red" />
          </section>

          <section className="rounded-[2rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Account Standing</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#041614]">Driver Account Controls</h2>
                  <AccountStandingBadge standing={driver.accountStanding} />
                </div>
                {driver.accountActionReason && (
                  <div className="mt-4 rounded-2xl bg-[#F0F9F8] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">Latest Reason</p>
                    <p className="mt-1 text-sm font-semibold text-[#1A5D56]">{driver.accountActionReason}</p>
                    {driver.accountActionDate && <p className="mt-1 text-xs font-semibold text-gray-400">{formatDate(driver.accountActionDate)}</p>}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {driver.accountStanding === 'active' && (
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

                {driver.accountStanding === 'suspended' && (
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

                {driver.accountStanding === 'deactivated' && (
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
                  <h2 className="text-xl font-bold text-[#041614]">Ratings History</h2>
                  <p className="text-sm font-semibold text-[#1A5D56]/60">Recent customer feedback and rating movement.</p>
                </div>
                <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-600">
                  Latest {latestRating ? latestRating.rating.toFixed(1) : '0.0'}
                </span>
              </div>

              <RatingsFeedbackList items={driver.ratingsHistory} />
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#39B5A8]/10 bg-white shadow-sm">
              <div className="border-b border-[#39B5A8]/10 p-6">
                <h2 className="text-xl font-bold text-[#041614]">Delivery Record</h2>
                <p className="text-sm font-semibold text-[#1A5D56]/60">Recent deliveries, outcomes, and issue notes.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F0F9F8]/70 border-b border-[#39B5A8]/10">
                    <tr>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#39B5A8]/5">
                    {driver.deliveryRecord.map((delivery) => (
                      <DeliveryRow key={delivery.id} delivery={delivery} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
        )}
      </div>

      {pendingAction && driver && (
        <AccountActionModal
          action={pendingAction}
          entityNoun="Driver"
          subjectName={driver.name}
          onCancel={closeActionModal}
          onConfirm={handleConfirmAccountAction}
          onReasonChange={setActionReason}
          reason={actionReason}
        />
      )}
    </div>
  );
}

interface DeliveryRecordItem {
  id: string;
  completedAt: string;
  destination: string;
  region: string;
  issue?: string;
  status: string;
  rating: number;
}

function DeliveryRow({ delivery }: { delivery: DeliveryRecordItem }) {
  return (
    <tr className="transition-colors hover:bg-[#F0F9F8]/30">
      <td className="px-6 py-5">
        <p className="font-bold text-[#041614]">{delivery.id}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(delivery.completedAt)}
        </p>
      </td>
      <td className="px-6 py-5 min-w-[200px]">
        <p className="font-semibold text-[#1A5D56]">{delivery.destination}</p>
        <p className="text-xs font-semibold text-gray-400">{delivery.region}</p>
        {delivery.issue && <p className="mt-1 text-xs font-semibold text-red-500">{delivery.issue}</p>}
      </td>
      <td className="px-6 py-5">
        <DeliveryStatusBadge status={delivery.status} />
      </td>
      <td className="px-6 py-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-600 border border-amber-100">
          <Star className="h-3.5 w-3.5 fill-current" />
          {delivery.rating.toFixed(1)}
        </span>
      </td>
    </tr>
  );
}

function DeliveryStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, string> = {
    Delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Delayed: 'bg-amber-50 text-amber-600 border-amber-100',
    Cancelled: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${statusConfig[status] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {status}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    on_delivery: 'bg-blue-50 text-blue-600 border-blue-100',
    offline: 'bg-gray-50 text-gray-500 border-gray-100',
    suspended: 'bg-red-50 text-red-600 border-red-100',
    deactivated: 'bg-red-100 text-red-700 border-red-200',
  };

  const labels: Record<string, string> = {
    available: 'Available',
    on_delivery: 'On Delivery',
    offline: 'Offline',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
  };

  return (
    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${statusConfig[status] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
}
