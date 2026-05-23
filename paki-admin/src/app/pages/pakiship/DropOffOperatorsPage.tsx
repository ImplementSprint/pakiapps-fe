import { useMemo, useState, useEffect } from 'react';
import {
  ChevronDown,
  CircleCheck,
  Eye,
  Filter,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Search,
  Truck,
} from 'lucide-react';

import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { useNavigate } from '../../lib/router';
import { type OperatorStatus } from './dropOffOperatorRecords';
import { fetchOperators, type OperatorRow } from '../../lib/supabaseSchema';

export default function DropOffOperatorsPage() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OperatorStatus | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState('All Locations');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchOperators()
      .then((rows) => { if (isMounted) setOperators(rows); })
      .catch(() => { if (isMounted) setOperators([]); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const locations = useMemo(
    () => ['All Locations', ...Array.from(new Set(operators.map((o) => o.region).filter(Boolean)))],
    [operators],
  );

  const filteredOperators = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return operators.filter((operator) => {
      const matchesSearch =
        operator.id.toLowerCase().includes(query) ||
        operator.businessName.toLowerCase().includes(query) ||
        operator.ownerName.toLowerCase().includes(query) ||
        operator.location.toLowerCase().includes(query) ||
        operator.region.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || operator.status === statusFilter;
      const matchesLocation = locationFilter === 'All Locations' || operator.region === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [operators, locationFilter, searchQuery, statusFilter]);

  const activeCount = operators.filter((o) => o.status === 'active').length;
  const limitedCount = operators.filter((o) => o.status === 'limited').length;
  const parcelsHandled = operators.reduce((total, o) => total + o.parcelsHandled, 0);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setLocationFilter('All Locations');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <PakiShipSidebar activeTab="drop-off-operators" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#39B5A8]/10 bg-white/80 px-10 backdrop-blur-md">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#39B5A8]">Operator Network</p>
            <p className="mt-1 text-sm font-semibold text-[#1A5D56]/70">Oversee active drop-off points by status and location.</p>
          </div>

          <div className="rounded-full border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#39B5A8]">
            {isLoading ? 'Loading...' : `${filteredOperators.length} Operators`}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          <section>
            <h1 className="text-3xl font-bold tracking-tight text-[#041614]">Drop-Off Operators</h1>
            <p className="text-[#1A5D56] opacity-70 font-medium italic">Search and filter the PakiShip drop-off operator network.</p>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <SummaryCard icon={<CircleCheck className="w-6 h-6" />} label="Active Operators" value={activeCount.toLocaleString()} tone="emerald" />
            <SummaryCard icon={<Truck className="w-6 h-6" />} label="Limited Capacity" value={limitedCount.toLocaleString()} tone="amber" />
            <SummaryCard icon={<PackageCheck className="w-6 h-6" />} label="Parcels Handled" value={parcelsHandled.toLocaleString()} tone="blue" />
          </div>

          <section className="bg-white p-6 rounded-[2rem] border border-[#39B5A8]/10 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end">
              <div className="flex-1">
                <label htmlFor="operator-search" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                  Search
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-3">
                  <Search className="h-4 w-4 text-[#39B5A8]/70" />
                  <input
                    id="operator-search"
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by operator, owner, ID, or location..."
                    className="w-full bg-transparent text-sm font-semibold text-[#041614] outline-none placeholder:text-[#39B5A8]/40"
                  />
                </div>
              </div>

              <FilterSelect
                icon={<CircleCheck className="h-4 w-4" />}
                label="Status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as OperatorStatus | 'all')}
                options={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Limited Capacity', value: 'limited' },
                  { label: 'Inactive', value: 'inactive' },
                  { label: 'Suspended', value: 'suspended' },
                  { label: 'Deactivated', value: 'deactivated' },
                ]}
              />

              <FilterSelect
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={locationFilter}
                onChange={setLocationFilter}
                options={locations.map((location) => ({ label: location, value: location }))}
              />

              <button
                type="button"
                onClick={clearFilters}
                className="h-12 rounded-xl border border-[#39B5A8]/10 bg-white px-5 text-sm font-bold text-[#1A5D56] transition-colors hover:bg-[#F0F9F8]"
              >
                Clear
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-[#39B5A8]/10 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F0F9F8]/70 border-b border-[#39B5A8]/10">
                  <tr>
                    <TableHead>Operator</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Parcels</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead align="right">Action</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#39B5A8]/5">
                  {filteredOperators.map((operator) => (
                    <tr key={operator.id} className="transition-colors hover:bg-[#F0F9F8]/30">
                      <td className="px-6 py-5 min-w-[300px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-xl flex items-center justify-center text-white font-bold">
                            {operator.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#041614]">{operator.businessName}</p>
                            <p className="text-xs font-semibold text-gray-400">{operator.id} - {operator.ownerName}</p>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-gray-400">
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {operator.email}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {operator.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 min-w-[220px]">
                        <p className="font-bold text-[#1A5D56]">{operator.location}</p>
                        <p className="text-xs font-semibold text-gray-400">{operator.region}</p>
                        <p className="mt-1 max-w-[260px] truncate text-[10px] font-semibold text-gray-400">{operator.address}</p>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={operator.status} />
                        <p className="mt-1 text-[10px] font-semibold text-gray-400">{operator.lastActive}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-[#041614]">{operator.parcelsHandled.toLocaleString()}</p>
                        <p className="text-xs font-semibold text-gray-400">{operator.pendingParcels} pending</p>
                      </td>
                      <td className="px-6 py-5 min-w-[150px]">
                        <p className="text-sm font-bold text-[#1A5D56]">{operator.operatingHours}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/pakiship/drop-off-operators/${operator.id}`)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#39B5A8] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#2F9D91]"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOperators.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Filter className="h-8 w-8 text-[#39B5A8]/40" />
                  <p className="mt-3 text-sm font-black uppercase tracking-widest text-[#1A5D56]/40">No Operators Found</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'emerald' | 'blue' | 'amber';
  value: string;
}) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-[#39B5A8]/10 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-2xl ${tones[tone]}`}>{icon}</div>
        <span className="text-3xl font-black text-[#041614]">{value}</span>
      </div>
      <p className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-[0.15em]">{label}</p>
    </div>
  );
}

function FilterSelect({
  icon,
  label,
  onChange,
  options,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div className="min-w-[210px]">
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#39B5A8]/70">{icon}</span>
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

function TableHead({ align, children }: { align?: 'right'; children: React.ReactNode }) {
  return (
    <th className={`px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </th>
  );
}

function StatusBadge({ status }: { status: OperatorStatus }) {
  const statusConfig = {
    active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    limited: 'bg-amber-50 text-amber-600 border-amber-100',
    inactive: 'bg-gray-50 text-gray-500 border-gray-100',
    suspended: 'bg-red-50 text-red-600 border-red-100',
    deactivated: 'bg-red-100 text-red-700 border-red-200',
  };

  const labels = {
    active: 'Active',
    limited: 'Limited Capacity',
    inactive: 'Inactive',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
  };

  return (
    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${statusConfig[status]}`}>
      {labels[status]}
    </span>
  );
}
