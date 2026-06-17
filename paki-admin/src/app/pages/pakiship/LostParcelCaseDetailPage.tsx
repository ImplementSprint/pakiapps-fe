import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  MessageSquareText,
  Package,
  Phone,
  Receipt,
  Route,
  Send,
  ShieldAlert,
  Star,
  Truck,
  User,
  X,
} from 'lucide-react';

import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from '../../lib/router';
import { getDisplayNameForEmail } from '../../lib/sampleAccounts';
import {
  LOST_PARCEL_CASES,
  type InvestigationStatusUpdate,
  type LostParcelCase,
  type LostParcelStatus,
  type RefundMethod,
  type RefundRecord,
  type ResolutionNotification,
  type ShipmentTimelineItem,
  type TimelineStatus,
} from './lostParcelRecords';

interface LostParcelCaseDetailPageProps {
  caseId: string;
}

export default function LostParcelCaseDetailPage({ caseId }: LostParcelCaseDetailPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialCase = LOST_PARCEL_CASES.find((item) => item.id === caseId) ?? LOST_PARCEL_CASES[0];
  const [lostCase, setLostCase] = useState<LostParcelCase>(initialCase);
  const [selectedStatus, setSelectedStatus] = useState<LostParcelStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [refundAmount, setRefundAmount] = useState(String(initialCase.refund?.amount ?? initialCase.parcelValue));
  const [refundMethod, setRefundMethod] = useState<RefundMethod>(initialCase.refund?.method ?? 'GCash');
  const [refundNote, setRefundNote] = useState(initialCase.refund?.note ?? '');
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const availableStatuses = getAvailableStatuses(lostCase.status);
  const parsedRefundAmount = Number(refundAmount);
  const refundAmountError = getRefundAmountError(parsedRefundAmount, lostCase.parcelValue);
  const canIssueRefund = !lostCase.refund && !refundAmountError && refundNote.trim().length > 0;
  const notificationSubject = `Resolution for lost parcel case ${lostCase.id}`;
  const notificationMessage = buildResolutionNotificationMessage(lostCase);
  const canSendResolutionNotification = lostCase.status === 'closed' && !lostCase.resolutionNotification;
  const adminName = getDisplayNameForEmail(user?.email, 'Juan Dela Cruz');

  const handleStatusUpdate = () => {
    if (!selectedStatus || !statusNote.trim()) return;

    const newUpdate: InvestigationStatusUpdate = {
      id: `ISH-${Date.now()}`,
      status: selectedStatus,
      timestamp: new Date().toISOString(),
      updatedBy: adminName,
      note: statusNote.trim(),
    };

    setLostCase((current) => ({
      ...current,
      status: selectedStatus,
      statusHistory: [...current.statusHistory, newUpdate],
    }));
    if (selectedStatus === 'closed' && !lostCase.resolutionNotification) {
      setIsResolutionModalOpen(true);
    }
    setSelectedStatus(null);
    setStatusNote('');
  };

  const handleIssueRefund = () => {
    if (!canIssueRefund) return;

    const timestamp = new Date().toISOString();
    const refund: RefundRecord = {
      id: `RF-${Date.now()}`,
      amount: parsedRefundAmount,
      method: refundMethod,
      timestamp,
      issuedBy: adminName,
      note: refundNote.trim(),
    };
    const refundUpdate: InvestigationStatusUpdate = {
      id: `ISH-${Date.now()}-refund`,
      status: 'refunded',
      timestamp,
      updatedBy: adminName,
      note: `Refund issued via ${refundMethod}. ${refund.note}`,
    };

    setLostCase((current) => ({
      ...current,
      status: 'refunded',
      refund,
      statusHistory: [...current.statusHistory, refundUpdate],
    }));
  };

  const handleSendResolutionNotification = () => {
    if (!canSendResolutionNotification) return;

    const notification: ResolutionNotification = {
      id: `NTF-${Date.now()}`,
      recipientEmail: lostCase.customerEmail,
      subject: notificationSubject,
      message: notificationMessage,
      sentAt: new Date().toISOString(),
      sentBy: adminName,
      outcome: lostCase.status,
    };

    setLostCase((current) => ({
      ...current,
      resolutionNotification: notification,
    }));
    setIsResolutionModalOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <PakiShipSidebar activeTab="shipments" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#39B5A8]/10 bg-white/80 px-10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate('/pakiship/shipments/lost-parcels')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-sm font-bold text-[#1A5D56] transition-colors hover:bg-[#39B5A8]/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cases
          </button>

          <div className="rounded-full border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#39B5A8]">
            {lostCase.id}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          <section className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#39B5A8]">Lost Parcel Case</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#041614]">{lostCase.parcelId}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <StatusBadge status={lostCase.status} />
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F9F8] px-3 py-1 text-xs font-bold text-[#39B5A8]">
                    <Route className="h-3.5 w-3.5" />
                    {lostCase.route}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-[#1A5D56] sm:grid-cols-2">
                <InfoTile icon={<User className="h-4 w-4" />} label="Customer" value={lostCase.affectedCustomer} />
                <InfoTile icon={<Mail className="h-4 w-4" />} label="Email" value={lostCase.customerEmail} />
                <InfoTile icon={<CalendarDays className="h-4 w-4" />} label="Date Reported" value={formatDate(lostCase.dateReported)} />
                <InfoTile icon={<ShieldAlert className="h-4 w-4" />} label="Assigned Team" value={lostCase.assignedTeam} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <MetricCard icon={<Package className="h-5 w-5" />} label="Parcel Value" value={formatCurrency(lostCase.parcelValue)} detail={lostCase.parcelId} tone="amber" />
            <MetricCard icon={<MapPin className="h-5 w-5" />} label="Last Known Location" value={lostCase.lastKnownLocation} detail={formatDateTime(lostCase.lastKnownTimestamp)} tone="red" />
            <MetricCard icon={<Truck className="h-5 w-5" />} label="Assigned Driver" value={lostCase.assignedDriver.name} detail={lostCase.assignedDriver.vehicle} tone="emerald" />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Investigation Status</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#041614]">{statusLabel(lostCase.status)}</h2>
                </div>
                <StatusBadge status={lostCase.status} />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                <WorkflowStage label="Open" active={lostCase.status === 'open'} complete={lostCase.status !== 'open'} />
                <WorkflowStage label="Investigating" active={lostCase.status === 'investigating'} complete={['found', 'refunded', 'closed'].includes(lostCase.status)} />
                <WorkflowStage label="Resolution" active={['found', 'refunded', 'closed'].includes(lostCase.status)} complete={lostCase.status === 'closed'} />
              </div>

              <div className="mt-6 rounded-[2rem] bg-[#F0F9F8] p-5">
                <label className="mb-3 block text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Next Status</label>
                {availableStatuses.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {availableStatuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setSelectedStatus(status)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          selectedStatus === status
                            ? 'border-[#39B5A8]/40 bg-white shadow-sm'
                            : 'border-[#39B5A8]/10 bg-[#FCFEFE] hover:bg-white'
                        }`}
                      >
                        <p className="font-black text-[#041614]">{statusLabel(status)}</p>
                        <p className="mt-1 text-xs font-semibold text-gray-400">{statusActionCopy(status)}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white p-4 text-sm font-bold text-[#1A5D56]">No next status available</div>
                )}

                <label className="mb-2 mt-5 block text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Investigation Note *</label>
                <textarea
                  value={statusNote}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder="Enter investigation note"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[#39B5A8]/10 bg-white px-4 py-3 text-sm font-semibold text-[#041614] outline-none transition-all focus:border-[#39B5A8]/30 focus:ring-4 focus:ring-[#39B5A8]/15"
                />

                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || !statusNote.trim()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#39B5A8] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2F9D91] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Record Status Update
                </button>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#041614]">Status Audit Trail</h2>
                  <p className="text-sm font-semibold text-[#1A5D56]/60">Recorded investigation changes</p>
                </div>
                <FileText className="h-5 w-5 text-[#39B5A8]" />
              </div>

              <div className="mt-6 space-y-4">
                {lostCase.statusHistory.map((item, index) => (
                  <AuditTrailItem
                    key={item.id}
                    item={item}
                    isLast={index === lostCase.statusHistory.length - 1}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Refund Desk</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#041614]">Customer Refund</h2>
                </div>
                <CreditCard className="h-6 w-6 text-[#39B5A8]" />
              </div>

              <div className="mt-6 rounded-[2rem] bg-[#F0F9F8] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">Payee</p>
                    <p className="mt-2 text-xl font-black text-[#041614]">{lostCase.affectedCustomer}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-400">{lostCase.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">Claim Value</p>
                    <p className="mt-2 text-xl font-black text-[#041614]">{formatCurrency(lostCase.parcelValue)}</p>
                  </div>
                </div>
              </div>

              {lostCase.refund ? (
                <div className="mt-5 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-1 h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-black text-emerald-700">Refund Issued</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700/80">{lostCase.refund.id}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Refund Amount</label>
                    <input
                      type="number"
                      min="1"
                      max={lostCase.parcelValue}
                      value={refundAmount}
                      onChange={(event) => setRefundAmount(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 text-sm font-bold text-[#041614] outline-none transition-all focus:border-[#39B5A8]/30 focus:ring-4 focus:ring-[#39B5A8]/15"
                    />
                    {refundAmountError && <p className="mt-2 text-xs font-bold text-red-500">{refundAmountError}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Refund Method</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {(['GCash', 'Bank Transfer', 'Card Reversal'] as RefundMethod[]).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setRefundMethod(method)}
                          className={`rounded-2xl border p-3 text-sm font-black transition-all ${
                            refundMethod === method
                              ? 'border-[#39B5A8]/40 bg-[#F0F9F8] text-[#041614]'
                              : 'border-[#39B5A8]/10 bg-white text-[#1A5D56] hover:bg-[#F0F9F8]'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Refund Note *</label>
                    <textarea
                      value={refundNote}
                      onChange={(event) => setRefundNote(event.target.value)}
                      placeholder="Enter refund note"
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-3 text-sm font-semibold text-[#041614] outline-none transition-all focus:border-[#39B5A8]/30 focus:ring-4 focus:ring-[#39B5A8]/15"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleIssueRefund}
                    disabled={!canIssueRefund}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#39B5A8] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2F9D91] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Issue Refund
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#041614]">Refund Receipt</h2>
                  <p className="text-sm font-semibold text-[#1A5D56]/60">Case resolution payment record</p>
                </div>
                <Receipt className="h-5 w-5 text-[#39B5A8]" />
              </div>

              <RefundReceipt
                caseId={lostCase.id}
                customer={lostCase.affectedCustomer}
                parcelId={lostCase.parcelId}
                refund={lostCase.refund}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[2rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#041614]">Assigned Driver</h2>
                  <p className="text-sm font-semibold text-[#1A5D56]/60">Driver context for investigation</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-black text-amber-600">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {lostCase.assignedDriver.rating.toFixed(1)}
                </span>
              </div>

              <div className="mt-6 space-y-3">
                <InfoTile icon={<User className="h-4 w-4" />} label="Driver" value={lostCase.assignedDriver.name} />
                <InfoTile icon={<Phone className="h-4 w-4" />} label="Phone" value={lostCase.assignedDriver.phone} />
                <InfoTile icon={<Truck className="h-4 w-4" />} label="Vehicle" value={lostCase.assignedDriver.vehicle} />
                <InfoTile icon={<Clock className="h-4 w-4" />} label="Last Contact" value={formatDateTime(lostCase.assignedDriver.lastContact)} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#041614]">Last Known Location</h2>
                  <p className="text-sm font-semibold text-[#1A5D56]/60">{formatDateTime(lostCase.lastKnownTimestamp)}</p>
                </div>
                <MapPin className="h-5 w-5 text-[#39B5A8]" />
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-[#39B5A8]/10 bg-[#F0F9F8] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">Location</p>
                <p className="mt-2 text-2xl font-black text-[#041614]">{lostCase.lastKnownLocation}</p>
                <p className="mt-3 text-sm font-semibold text-[#1A5D56]/70">{lostCase.route}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#041614]">Shipment Timeline</h2>
                <p className="text-sm font-semibold text-[#1A5D56]/60">Parcel movement and investigation checkpoints</p>
              </div>
              <Clock className="h-5 w-5 text-[#39B5A8]" />
            </div>

            <div className="mt-6 space-y-4">
              {lostCase.timeline.map((item, index) => (
                <TimelineItem key={item.id} item={item} isLast={index === lostCase.timeline.length - 1} />
              ))}
            </div>
          </section>
        </main>
      </div>

      {isResolutionModalOpen && !lostCase.resolutionNotification && (
        <ResolutionNotificationModal
          caseStatus={statusLabel(lostCase.status)}
          message={notificationMessage}
          onClose={() => setIsResolutionModalOpen(false)}
          onSend={handleSendResolutionNotification}
          recipient={lostCase.customerEmail}
          subject={notificationSubject}
        />
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

function getRefundAmountError(amount: number, claimValue: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Enter a valid refund amount.';
  }

  if (amount > claimValue) {
    return `Refund amount cannot exceed ${formatCurrency(claimValue)}.`;
  }

  return '';
}

function getAvailableStatuses(status: LostParcelStatus): LostParcelStatus[] {
  const nextStatuses = {
    open: ['investigating'],
    investigating: ['found', 'refunded', 'closed'],
    found: ['closed'],
    refunded: ['closed'],
    closed: [],
  } satisfies Record<LostParcelStatus, LostParcelStatus[]>;

  return nextStatuses[status];
}

function statusLabel(status: LostParcelStatus) {
  const labels = {
    open: 'Open',
    investigating: 'Investigating',
    found: 'Found',
    refunded: 'Refunded',
    closed: 'Closed',
  };

  return labels[status];
}

function statusActionCopy(status: LostParcelStatus) {
  const copy = {
    open: 'Reopen case',
    investigating: 'Begin active investigation',
    found: 'Parcel recovered',
    refunded: 'Customer refunded',
    closed: 'Close the case',
  };

  return copy[status];
}

function buildResolutionNotificationMessage(lostCase: LostParcelCase) {
  const refundLine = lostCase.refund
    ? `Refund: ${formatCurrency(lostCase.refund.amount)} via ${lostCase.refund.method}.`
    : 'Refund: Not applicable.';

  return [
    `Hello ${lostCase.affectedCustomer},`,
    '',
    `Your lost parcel case ${lostCase.id} for parcel ${lostCase.parcelId} has been closed.`,
    `Outcome: ${statusLabel(getResolutionOutcome(lostCase))}.`,
    refundLine,
    '',
    'Thank you for your patience while our team reviewed the case.',
    'PakiShip Support',
  ].join('\n');
}

function getResolutionOutcome(lostCase: LostParcelCase) {
  const resolution = [...lostCase.statusHistory]
    .reverse()
    .find((item) => ['found', 'refunded'].includes(item.status));

  return resolution?.status ?? lostCase.status;
}

function WorkflowStage({ active, complete, label }: { active: boolean; complete: boolean; label: string }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        active
          ? 'border-[#39B5A8]/30 bg-[#F0F9F8]'
          : complete
            ? 'border-emerald-100 bg-emerald-50'
            : 'border-[#39B5A8]/10 bg-[#FCFEFE]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full ${
            active ? 'bg-[#39B5A8] text-white' : complete ? 'bg-emerald-500 text-white' : 'bg-[#F0F9F8] text-[#39B5A8]'
          }`}
        >
          {complete ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
        </span>
        <p className="text-sm font-black text-[#041614]">{label}</p>
      </div>
    </div>
  );
}

function AuditTrailItem({ isLast, item }: { isLast: boolean; item: InvestigationStatusUpdate }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      <div className="flex flex-col items-center">
        <div className={`h-4 w-4 rounded-full border-4 ${auditDotClass(item.status)}`} />
        {!isLast && <div className="mt-2 h-full min-h-14 w-px bg-[#39B5A8]/20" />}
      </div>
      <div className="rounded-[1.5rem] border border-[#39B5A8]/10 bg-[#FCFEFE] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <StatusBadge status={item.status} />
            <p className="mt-2 text-sm font-bold text-[#041614]">{item.updatedBy}</p>
          </div>
          <p className="text-xs font-bold text-gray-400">{formatDateTime(item.timestamp)}</p>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#1A5D56]/75">{item.note}</p>
      </div>
    </div>
  );
}

function auditDotClass(status: LostParcelStatus) {
  const classes = {
    open: 'border-amber-100 bg-amber-500',
    investigating: 'border-blue-100 bg-blue-500',
    found: 'border-emerald-100 bg-emerald-500',
    refunded: 'border-red-100 bg-red-500',
    closed: 'border-gray-100 bg-gray-500',
  };

  return classes[status];
}

function RefundReceipt({
  caseId,
  customer,
  parcelId,
  refund,
}: {
  caseId: string;
  customer: string;
  parcelId: string;
  refund?: RefundRecord;
}) {
  if (!refund) {
    return (
      <div className="mt-6 rounded-[2rem] border border-dashed border-[#39B5A8]/20 bg-[#F0F9F8]/60 p-8 text-center">
        <Receipt className="mx-auto h-8 w-8 text-[#39B5A8]/50" />
        <p className="mt-3 text-sm font-black uppercase tracking-widest text-[#1A5D56]/50">No Refund Issued</p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-[2rem] border border-[#39B5A8]/10 bg-[#F0F9F8]">
      <div className="border-b border-[#39B5A8]/10 bg-white p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Transaction</p>
        <p className="mt-2 text-2xl font-black text-[#041614]">{refund.id}</p>
      </div>

      <div className="space-y-4 p-5">
        <ReceiptLine label="Amount" value={formatCurrency(refund.amount)} />
        <ReceiptLine label="Method" value={refund.method} />
        <ReceiptLine label="Issued To" value={customer} />
        <ReceiptLine label="Case" value={caseId} />
        <ReceiptLine label="Parcel" value={parcelId} />
        <ReceiptLine label="Issued By" value={refund.issuedBy} />
        <ReceiptLine label="Issued At" value={formatDateTime(refund.timestamp)} />
      </div>

      <div className="border-t border-[#39B5A8]/10 bg-white p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">Note</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#1A5D56]">{refund.note}</p>
      </div>
    </div>
  );
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#39B5A8]">{label}</p>
      <p className="text-right text-sm font-black text-[#041614]">{value}</p>
    </div>
  );
}

function ResolutionNotificationModal({
  caseStatus,
  message,
  onClose,
  onSend,
  recipient,
  subject,
}: {
  caseStatus: string;
  message: string;
  onClose: () => void;
  onSend: () => void;
  recipient: string;
  subject: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2.5rem] bg-white p-8 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[#F0F9F8] p-3 text-[#39B5A8]">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Resolution Notice</p>
            <h2 className="mt-2 text-2xl font-bold text-[#041614]">Send Customer Notification</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-[#F0F9F8]">
            <X className="h-5 w-5 text-[#1A5D56]" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <NoticeLine label="Recipient" value={recipient} />
          <NoticeLine label="Case Status" value={caseStatus} />
          <NoticeLine label="Subject" value={subject} />
        </div>

        <div className="mt-6 rounded-[2rem] border border-[#39B5A8]/10 bg-[#FCFEFE] p-6">
          <div className="flex items-start justify-between gap-4 border-b border-[#39B5A8]/10 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Message Preview</p>
              <h3 className="mt-2 text-xl font-bold text-[#041614]">{subject}</h3>
            </div>
            <Mail className="h-5 w-5 text-[#39B5A8]" />
          </div>
          <p className="mt-5 whitespace-pre-line text-sm font-medium leading-7 text-[#1A5D56]">{message}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#39B5A8]/15 bg-white px-5 py-3 text-sm font-bold text-[#1A5D56] transition-colors hover:bg-[#F0F9F8]"
          >
            Later
          </button>
          <button
            type="button"
            onClick={onSend}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#39B5A8] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#2F9D91]"
          >
            <Send className="h-4 w-4" />
            Send Resolution Notice
          </button>
        </div>
      </div>
    </div>
  );
}

function NoticeLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F0F9F8] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">{label}</p>
      <p className="mt-2 text-sm font-black text-[#041614]">{value}</p>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
  tone: 'emerald' | 'amber' | 'red';
  value: string;
}) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="rounded-[2rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
      <div className={`inline-flex rounded-2xl p-3 ${tones[tone]}`}>{icon}</div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#041614]">{value}</p>
      <p className="mt-2 text-sm font-semibold text-gray-400">{detail}</p>
    </div>
  );
}

function TimelineItem({ isLast, item }: { isLast: boolean; item: ShipmentTimelineItem }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      <div className="flex flex-col items-center">
        <div className={`h-4 w-4 rounded-full border-4 ${timelineDotClass(item.status)}`} />
        {!isLast && <div className="mt-2 h-full min-h-16 w-px bg-[#39B5A8]/20" />}
      </div>
      <div className="rounded-[1.5rem] border border-[#39B5A8]/10 bg-[#FCFEFE] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-[#041614]">{item.label}</p>
              <TimelineBadge status={item.status} />
            </div>
            <p className="mt-1 text-sm font-semibold text-[#1A5D56]">{item.location}</p>
          </div>
          <p className="text-xs font-bold text-gray-400">{formatDateTime(item.timestamp)}</p>
        </div>
        <p className="mt-3 text-sm font-medium leading-6 text-[#1A5D56]/75">{item.note}</p>
      </div>
    </div>
  );
}

function timelineDotClass(status: TimelineStatus) {
  const classes = {
    completed: 'border-emerald-100 bg-emerald-500',
    current: 'border-blue-100 bg-blue-500',
    pending: 'border-gray-100 bg-gray-300',
    flagged: 'border-red-100 bg-red-500',
  };

  return classes[status];
}

function TimelineBadge({ status }: { status: TimelineStatus }) {
  const statusConfig = {
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    current: 'bg-blue-50 text-blue-600 border-blue-100',
    pending: 'bg-gray-50 text-gray-500 border-gray-100',
    flagged: 'bg-red-50 text-red-600 border-red-100',
  };

  const labels = {
    completed: 'Completed',
    current: 'Current',
    pending: 'Pending',
    flagged: 'Flagged',
  };

  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${statusConfig[status]}`}>
      {labels[status]}
    </span>
  );
}

function StatusBadge({ status }: { status: LostParcelStatus }) {
  const statusConfig = {
    open: 'bg-amber-50 text-amber-600 border-amber-100',
    investigating: 'bg-blue-50 text-blue-600 border-blue-100',
    found: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    refunded: 'bg-red-50 text-red-600 border-red-100',
    closed: 'bg-gray-50 text-gray-500 border-gray-100',
  };

  const labels = {
    open: 'Open',
    investigating: 'Investigating',
    found: 'Found',
    refunded: 'Refunded',
    closed: 'Closed',
  };

  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${statusConfig[status]}`}>
      {labels[status]}
    </span>
  );
}
