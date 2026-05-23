import { useMemo, useState, useEffect, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Clock,
  Eye,
  Filter,
  PackageX,
  Search,
} from 'lucide-react';

import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { useNavigate } from '../../lib/router';
import { fetchLostParcelCases, type LostParcelCaseRow as LostParcelCase, type LostParcelStatus } from '../../lib/supabaseSchema';

export default function LostParcelCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<LostParcelCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LostParcelStatus | 'all'>('all');

  useEffect(() => {
    let isMounted = true;
    fetchLostParcelCases()
      .then((data) => { if (isMounted) { setCases(data); setIsLoading(false); } })
      .catch(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const filteredCases = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return cases.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(query) ||
        item.parcelId.toLowerCase().includes(query) ||
        item.affectedCustomer.toLowerCase().includes(query) ||
        item.route.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cases, searchQuery, statusFilter]);

  const openCount = cases.filter((item) => item.status === 'open').length;
  const investigatingCount = cases.filter((item) => item.status === 'investigating').length;
  const resolvedCount = cases.filter((item) => ['found', 'refunded', 'closed'].includes(item.status)).length;
  const totalValue = cases.reduce((total, item) => total + item.parcelValue, 0);
  const highValueCases = useMemo(
    () => [...cases].sort((first, second) => second.parcelValue - first.parcelValue).slice(0, 3),
    [cases],
  );

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <PakiShipSidebar activeTab="shipments" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#39B5A8]/10 bg-white/80 px-10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => navigate('/pakiship/shipments')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-sm font-bold text-[#1A5D56] transition-colors hover:bg-[#39B5A8]/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shipments
          </button>

          <div className="rounded-full border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#39B5A8]">
            {filteredCases.length} Cases
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <p className="text-sm font-bold text-[#39B5A8] uppercase tracking-widest animate-pulse">Loading cases...</p>
            </div>
          ) : (
          <>
            <section>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#39B5A8]">Shipment Exceptions</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#041614]">Lost Parcel Cases</h1>
              <p className="font-medium italic text-[#1A5D56] opacity-70">Track reported lost parcels, case status, customers, value, and reporting date.</p>
            </section>

            <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.35fr)_360px]">
              <div className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white shadow-sm">
                <div className="border-b border-[#39B5A8]/10 p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-end">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label htmlFor="lost-parcel-search" className="block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                          Case Queue
                        </label>
                        <span className="rounded-full border border-[#39B5A8]/10 bg-[#F0F9F8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">
                          {filteredCases.length} Showing
                        </span>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-3">
                        <Search className="h-4 w-4 text-[#39B5A8]/70" />
                        <input
                          id="lost-parcel-search"
                          type="text"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Search case, parcel, customer, or route..."
                          className="w-full bg-transparent text-sm font-semibold text-[#041614] outline-none placeholder:text-[#39B5A8]/40"
                        />
                      </div>
                    </div>

                    <FilterSelect
                      label="Status"
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value as LostParcelStatus | 'all')}
                      options={[
                        { label: 'All Statuses', value: 'all' },
                        { label: 'Open', value: 'open' },
                        { label: 'Investigating', value: 'investigating' },
                        { label: 'Found', value: 'found' },
                        { label: 'Refunded', value: 'refunded' },
                        { label: 'Closed', value: 'closed' },
                      ]}
                    />

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="h-12 rounded-xl border border-[#39B5A8]/10 bg-white px-5 text-sm font-bold text-[#1A5D56] transition-colors hover:bg-[#F0F9F8]"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  {filteredCases.map((item) => (
                    <CaseQueueCard
                      key={item.id}
                      item={item}
                      onView={() => navigate(`/pakiship/shipments/lost-parcels/${item.id}`)}
                    />
                  ))}

                  {filteredCases.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#39B5A8]/20 bg-[#F0F9F8]/50 py-16 text-center">
                      <Filter className="h-8 w-8 text-[#39B5A8]/40" />
                      <p className="mt-3 text-sm font-black uppercase tracking-widest text-[#1A5D56]/40">No Cases Found</p>
                    </div>
                  )}
                </div>
              </div>

              <aside className="space-y-6">
                <section className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Investigation Snapshot</p>
                      <h2 className="mt-2 text-xl font-bold text-[#041614]">Lost Parcel Queue</h2>
                    </div>
                    <PackageX className="h-6 w-6 text-[#39B5A8]" />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <SummaryMetric icon={<PackageX className="h-4 w-4" />} label="Open" value={openCount.toLocaleString()} tone="amber" />
                    <SummaryMetric icon={<Clock className="h-4 w-4" />} label="Investigating" value={investigatingCount.toLocaleString()} tone="blue" />
                    <SummaryMetric icon={<AlertTriangle className="h-4 w-4" />} label="At Risk" value={(openCount + investigatingCount).toLocaleString()} tone="red" />
                    <SummaryMetric icon={<CircleCheck className="h-4 w-4" />} label="Resolved" value={resolvedCount.toLocaleString()} tone="emerald" />
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#F0F9F8] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#39B5A8]">Total Parcel Value</p>
                    <p className="mt-2 text-2xl font-black text-[#041614]">{formatCurrency(totalValue)}</p>
                  </div>
                </section>

                <section className="rounded-[2.5rem] border border-[#39B5A8]/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-[#041614]">High Value Cases</h2>
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {highValueCases.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(`/pakiship/shipments/lost-parcels/${item.id}`)}
                        className="w-full rounded-2xl border border-[#39B5A8]/10 bg-[#FCFEFE] p-4 text-left transition-colors hover:bg-[#F0F9F8]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-[#041614]">{item.id}</p>
                            <p className="mt-1 text-xs font-semibold text-gray-400">{item.affectedCustomer}</p>
                          </div>
                          <p className="text-sm font-black text-[#1A5D56]">{formatCurrency(item.parcelValue)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </aside>
            </section>
          </>
          )}
        </main>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
}

function CaseQueueCard({ item, onView }: { item: LostParcelCase; onView: () => void }) {
  return (
    <div className="rounded-[2rem] border border-[#39B5A8]/10 bg-[#FCFEFE] p-5 transition-colors hover:bg-[#F7FCFC]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-black text-[#041614]">{item.id}</p>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-sm font-bold text-[#39B5A8]">{item.parcelId}</p>
          <p className="mt-3 text-sm font-semibold text-[#1A5D56]">{item.route}</p>
        </div>

        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#39B5A8] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#2F9D91]"
        >
          <Eye className="h-4 w-4" />
          View Case
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <CaseMeta icon={<PackageX className="h-4 w-4" />} label="Affected Customer" value={item.affectedCustomer} />
        <CaseMeta icon={<CalendarDays className="h-4 w-4" />} label="Date Reported" value={formatDate(item.dateReported)} />
        <CaseMeta icon={<CircleCheck className="h-4 w-4" />} label="Parcel Value" value={formatCurrency(item.parcelValue)} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-400">
        <span>{item.customerEmail}</span>
        <span className="h-1 w-1 rounded-full bg-gray-300" />
        <span>{item.assignedTeam}</span>
      </div>
    </div>
  );
}

function CaseMeta({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#F0F9F8] p-4">
      <div className="flex items-center gap-2 text-[#39B5A8]">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-[0.14em]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-black text-[#041614]">{value}</p>
    </div>
  );
}

function SummaryMetric({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: 'emerald' | 'amber' | 'red' | 'blue';
  value: string;
}) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
  };

  return (
    <div className="rounded-2xl bg-[#F0F9F8] p-4">
      <div className={`mb-3 inline-flex rounded-xl p-2 ${tones[tone]}`}>{icon}</div>
      <p className="text-2xl font-black text-[#041614]">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#39B5A8]">{label}</p>
    </div>
  );
}

function FilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div className="min-w-[230px]">
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">{label}</label>
      <div className="relative">
        <Clock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#39B5A8]/70" />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8] pl-11 pr-10 text-sm font-bold text-[#1A5D56] outline-none transition-all focus:border-[#39B5A8]/30 focus:ring-4 focus:ring-[#39B5A8]/15"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#39B5A8]/70" />
      </div>
    </div>
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
