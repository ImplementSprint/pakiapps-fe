import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from '../../lib/router';
import {
  ChevronDown,
  CircleCheck,
  Clock,
  Eye,
  Filter,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  Truck,
  User,
  UserRoundCheck,
} from 'lucide-react';

import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { type DriverStatus } from './driverRecords';
import { fetchDrivers, type DriverRow } from '../../lib/supabaseSchema';

type RatingFilter = 'all' | 'excellent' | 'good' | 'fair' | 'low';

export default function DriversPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState('All Regions');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchDrivers()
      .then((rows) => { if (isMounted) setDrivers(rows); })
      .catch(() => { if (isMounted) setDrivers([]); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const regions = useMemo(
    () => ['All Regions', ...Array.from(new Set(drivers.map((d) => d.region).filter(Boolean)))],
    [drivers],
  );

  const filteredDrivers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return drivers.filter((driver) => {
      const matchesSearch =
        driver.name.toLowerCase().includes(query) ||
        driver.id.toLowerCase().includes(query) ||
        driver.email.toLowerCase().includes(query) ||
        driver.phone.toLowerCase().includes(query);
      const matchesRating =
        ratingFilter === 'all' ||
        (ratingFilter === 'excellent' && driver.rating >= 4.8) ||
        (ratingFilter === 'good' && driver.rating >= 4.5 && driver.rating < 4.8) ||
        (ratingFilter === 'fair' && driver.rating >= 4.0 && driver.rating < 4.5) ||
        (ratingFilter === 'low' && driver.rating < 4.0);
      const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
      const matchesRegion = regionFilter === 'All Regions' || driver.region === regionFilter;

      return matchesSearch && matchesRating && matchesStatus && matchesRegion;
    });
  }, [drivers, ratingFilter, regionFilter, searchQuery, statusFilter]);

  const availableCount = drivers.filter((d) => d.status === 'available').length;
  const onDeliveryCount = drivers.filter((d) => d.status === 'on_delivery').length;
  const highRatedCount = drivers.filter((d) => d.rating >= 4.8).length;

  const clearFilters = () => {
    setSearchQuery('');
    setRatingFilter('all');
    setStatusFilter('all');
    setRegionFilter('All Regions');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <PakiShipSidebar activeTab="drivers" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#39B5A8]/10 bg-white/80 px-10 backdrop-blur-md">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#39B5A8]">Driver Operations</p>
            <p className="mt-1 text-sm font-semibold text-[#1A5D56]/70">Manage active drivers by availability, service region, and rating.</p>
          </div>

          <div className="rounded-full border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#39B5A8]">
            {isLoading ? 'Loading...' : `${filteredDrivers.length} Drivers`}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          <section>
            <h1 className="text-3xl font-bold tracking-tight text-[#041614]">Drivers</h1>
            <p className="text-[#1A5D56] opacity-70 font-medium italic">Search and filter the active PakiShip driver pool.</p>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <SummaryCard icon={<UserRoundCheck className="w-6 h-6" />} label="Available" value={availableCount} tone="emerald" />
            <SummaryCard icon={<Truck className="w-6 h-6" />} label="On Delivery" value={onDeliveryCount} tone="blue" />
            <SummaryCard icon={<Star className="w-6 h-6" />} label="4.8+ Rated" value={highRatedCount} tone="amber" />
          </div>

          <section className="bg-white p-6 rounded-[2rem] border border-[#39B5A8]/10 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end">
              <div className="flex-1">
                <label htmlFor="driver-search" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                  Search
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-3">
                  <Search className="h-4 w-4 text-[#39B5A8]/70" />
                  <input
                    id="driver-search"
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name, ID, email, or phone..."
                    className="w-full bg-transparent text-sm font-semibold text-[#041614] outline-none placeholder:text-[#39B5A8]/40"
                  />
                </div>
              </div>

              <FilterSelect
                icon={<Star className="h-4 w-4" />}
                label="Rating"
                value={ratingFilter}
                onChange={(value) => setRatingFilter(value as RatingFilter)}
                options={[
                  { label: 'All Ratings', value: 'all' },
                  { label: 'Excellent (4.8-5.0)', value: 'excellent' },
                  { label: 'Good (4.5-4.7)', value: 'good' },
                  { label: 'Fair (4.0-4.4)', value: 'fair' },
                  { label: 'Below 4.0', value: 'low' },
                ]}
              />

              <FilterSelect
                icon={<CircleCheck className="h-4 w-4" />}
                label="Status"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as DriverStatus | 'all')}
                options={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Available', value: 'available' },
                  { label: 'On Delivery', value: 'on_delivery' },
                  { label: 'Offline', value: 'offline' },
                  { label: 'Suspended', value: 'suspended' },
                  { label: 'Deactivated', value: 'deactivated' },
                ]}
              />

              <FilterSelect
                icon={<MapPin className="h-4 w-4" />}
                label="Region"
                value={regionFilter}
                onChange={setRegionFilter}
                options={regions.map((region) => ({ label: region, value: region }))}
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
                    <TableHead>Driver</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deliveries</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead align="right">Action</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#39B5A8]/5">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="transition-colors hover:bg-[#F0F9F8]/30">
                      <td className="px-6 py-5 min-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-xl flex items-center justify-center text-white font-bold">
                            {driver.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#041614]">{driver.name}</p>
                            <p className="text-xs font-semibold text-gray-400">{driver.id}</p>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-gray-400">
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {driver.email}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {driver.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 min-w-[180px]">
                        <p className="font-bold text-[#1A5D56]">{driver.region}</p>
                        <p className="text-xs font-semibold text-gray-400">{driver.city}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-600 border border-amber-100">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {driver.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={driver.status} />
                        <p className="mt-1 text-[10px] font-semibold text-gray-400">{driver.lastActive}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-black text-[#041614]">{driver.completedDeliveries.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F9F8] px-3 py-1 text-xs font-bold text-[#39B5A8]">
                          <Truck className="h-3.5 w-3.5" />
                          {driver.vehicleType}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/pakiship/drivers/${driver.id}`)}
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

              {filteredDrivers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Filter className="h-8 w-8 text-[#39B5A8]/40" />
                  <p className="mt-3 text-sm font-black uppercase tracking-widest text-[#1A5D56]/40">No Drivers Found</p>
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
  value: number;
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
    <div className="min-w-[190px]">
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

function StatusBadge({ status }: { status: DriverStatus }) {
  const statusConfig = {
    available: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    on_delivery: 'bg-blue-50 text-blue-600 border-blue-100',
    offline: 'bg-gray-50 text-gray-500 border-gray-100',
    suspended: 'bg-red-50 text-red-600 border-red-100',
    deactivated: 'bg-red-100 text-red-700 border-red-200',
  };

  const labels = {
    available: 'Available',
    on_delivery: 'On Delivery',
    offline: 'Offline',
    suspended: 'Suspended',
    deactivated: 'Deactivated',
  };

  return (
    <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full uppercase border ${statusConfig[status]}`}>
      {labels[status]}
    </span>
  );
}
