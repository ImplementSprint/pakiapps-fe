import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '../../lib/router';
import {
  AlertTriangle,
  CalendarDays,
  Filter,
  Download,
  Search,
  Truck,
  MapPin,
  User,
  ChevronDown,
  Settings,
  LogOut,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import { getDisplayNameForEmail } from '../../lib/sampleAccounts';
import {
  fetchShipments,
  fetchShipmentDriverNames,
  updateShipmentStatus as updateShipmentStatusInDB,
  type ShipmentStatus,
} from '../../lib/supabaseSchema';

interface ShipmentRecord {
  id: string;
  store: string;
  sender: string;
  receiver: string;
  location: string;
  destination: string;
  quantity: string;
  amount: string;
  status: 'In Transit' | 'Pending' | 'Delivered' | 'Cancelled';
  driver: string;
  eta: string;
  date: string;
  statusHistory?: unknown[];
}

export default function ShipmentsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [driverFilter, setDriverFilter] = useState('All Drivers');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [driverOptions, setDriverOptions] = useState<string[]>(['All Drivers']);
  const [isLoadingShipments, setIsLoadingShipments] = useState(false);

  const placeholderName = getDisplayNameForEmail(user?.email, 'Juan Dela Cruz');
  const shipmentsPerPage = 6;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);

  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const openStatusDialog = (shipment: ShipmentRecord) => {
    setSelectedShipment(shipment);
    setNewStatus(shipment.status);
    setReason('');
    setIsDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedShipment) return;
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    const targetStatus = newStatus as ShipmentRecord['status'];
    const loadingToast = toast.loading('Updating shipment status...');

    try {
      const updatedShipment = await updateShipmentStatusInDB(
        selectedShipment.id,
        targetStatus as ShipmentStatus,
        reason,
        placeholderName,
      );

      if (updatedShipment) {
        setShipments((prev) =>
          prev.map((shipment) => (shipment.id === selectedShipment.id ? { ...shipment, ...updatedShipment } : shipment)),
        );
      } else {
        // Optimistic update if Supabase returned null
        setShipments((prev) =>
          prev.map((s) => (s.id === selectedShipment.id ? { ...s, status: targetStatus } : s)),
        );
      }
      toast.dismiss(loadingToast);
      toast.success(targetStatus === 'Cancelled' ? 'Shipment cancelled' : `Shipment status updated to ${targetStatus}`);
      setIsDialogOpen(false);
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Unable to update shipment status.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingShipments(true);

    Promise.all([
      fetchShipments(),
      fetchShipmentDriverNames(),
    ])
      .then(([shipmentRows, driverNames]) => {
        if (!isMounted) return;
        setShipments(shipmentRows);
        setDriverOptions(['All Drivers', ...driverNames]);
      })
      .catch(() => {
        if (isMounted) {
          // Backend unreachable — render with empty state (0 records)
          setShipments([]);
          setDriverOptions(['All Drivers']);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingShipments(false);
      });

    return () => { isMounted = false; };
  }, []);

  const activeFilterCount = [
    bookingSearchQuery.trim().length > 0,
    statusFilter !== 'All',
    driverFilter !== 'All Drivers',
    startDateFilter.length > 0,
    endDateFilter.length > 0,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setBookingSearchQuery('');
    setStatusFilter('All');
    setDriverFilter('All Drivers');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  const filteredShipments = useMemo(() => {
    const normalizeFilterDate = (value: string) => {
      if (!value) {
        return null;
      }

      const date = new Date(`${value}T00:00:00`);
      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return date;
    };

    const parseShipmentDate = (value: string) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const startDate = normalizeFilterDate(startDateFilter);
    const endDate = normalizeFilterDate(endDateFilter);
    const rangeStart = startDate && endDate && startDate > endDate ? endDate : startDate;
    const rangeEnd = startDate && endDate && startDate > endDate ? startDate : endDate;

    return shipments.filter((shipment) => {
      const query = bookingSearchQuery.trim().toLowerCase();
      const matchesSearch = shipment.id.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'All' || shipment.status === statusFilter;
      const matchesDriver = driverFilter === 'All Drivers' || shipment.driver === driverFilter;
      const shipmentDate = parseShipmentDate(shipment.date);
      const matchesDateRange =
        shipmentDate !== null &&
        (rangeStart === null || shipmentDate >= rangeStart) &&
        (rangeEnd === null || shipmentDate <= rangeEnd);

      return matchesSearch && matchesStatus && matchesDriver && matchesDateRange;
    });
  }, [bookingSearchQuery, driverFilter, endDateFilter, shipments, startDateFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / shipmentsPerPage));

  const paginatedShipments = useMemo(() => {
    const startIndex = (currentPage - 1) * shipmentsPerPage;
    return filteredShipments.slice(startIndex, startIndex + shipmentsPerPage);
  }, [currentPage, filteredShipments]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [bookingSearchQuery, driverFilter, endDateFilter, startDateFilter, statusFilter]);

  const handleExport = () => {
    const headers = ['Shipment ID', 'Sender', 'Receiver', 'Store', 'Destination', 'Assigned Driver', 'Shipment Value', 'Status', 'Date'];
    const csvData = filteredShipments.map((shipment) => [
      shipment.id,
      shipment.sender,
      shipment.receiver,
      shipment.store,
      shipment.destination,
      shipment.driver,
      shipment.amount,
      shipment.status,
      shipment.date,
    ]);
    const csvContent = `data:text/csv;charset=utf-8,${[headers, ...csvData].map((row) => row.join(',')).join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pakiship-all-shipments-${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exporting shipments to CSV...');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <PakiShipSidebar activeTab="shipments" />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#39B5A8]/10 bg-white/80 px-10 backdrop-blur-md">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#39B5A8]">Operations Console</p>
            <p className="mt-1 text-sm font-semibold text-[#1A5D56]/70">Monitor bookings, assignments, and shipment progress in one place.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-[#39B5A8]/10"></div>
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 transition-all hover:bg-[#F0F9F8]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] font-bold text-white shadow-lg shadow-[#39B5A8]/20">
                  {placeholderName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden min-w-max text-left md:block">
                  <p className="whitespace-nowrap text-sm font-bold leading-tight text-[#041614]">{placeholderName}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#1A5D56] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-[#39B5A8]/10 bg-white shadow-xl">
                  <button
                    onClick={() => navigate('/pakiship/profile')}
                    className="w-full px-5 py-3 text-left font-semibold text-[#041614] transition-colors hover:bg-[#F0F9F8]"
                  >
                    <span className="flex items-center gap-3">
                      <User className="h-4 w-4 text-[#39B5A8]" /> Profile
                    </span>
                  </button>
                  <button
                    onClick={() => navigate('/pakiship/settings')}
                    className="w-full px-5 py-3 text-left font-semibold text-[#041614] transition-colors hover:bg-[#F0F9F8]"
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-[#39B5A8]" /> Settings
                    </span>
                  </button>
                  <div className="border-t border-[#39B5A8]/10"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3 text-left font-semibold text-red-500 transition-colors hover:bg-red-50"
                  >
                    <span className="flex items-center gap-3">
                      <LogOut className="h-4 w-4" /> Logout
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#041614]">PakiShip Shipments</h1>
              <p className="font-medium italic text-[#1A5D56] opacity-70">
                Monitor and manage all shipments across the system with a unified operations table.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/pakiship/tracking')}
                className="rounded-xl border-[#39B5A8]/15 bg-white font-bold text-[#1A5D56] hover:bg-[#F0F9F8]"
              >
                <MapPin className="mr-2 h-4 w-4 text-[#39B5A8]" /> Live Map
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/pakiship/shipments/lost-parcels')}
                className="rounded-xl border-[#39B5A8]/15 bg-white font-bold text-[#1A5D56] hover:bg-[#F0F9F8]"
              >
                <AlertTriangle className="mr-2 h-4 w-4 text-red-500" /> Lost Parcel Cases
              </Button>
              <Button
                onClick={handleExport}
                className="rounded-xl bg-[#39B5A8] font-bold text-white shadow-lg shadow-[#39B5A8]/20 hover:bg-[#2F9D91]"
              >
                <Download className="mr-2 h-4 w-4" /> Export Data
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-sm">
            <CardHeader className="p-10 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-[#041614]">All Shipments</CardTitle>
                  <p className="mt-1 text-sm font-medium text-[#1A5D56]/65">
                    Sender, receiver, assigned driver, shipment status, and shipment value in one paginated view.
                  </p>
                </div>
                <div className="rounded-full border border-[#39B5A8]/10 bg-[#F0F9F8] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                  {isLoadingShipments ? 'Loading...' : `${filteredShipments.length} Records`}
                </div>
              </div>

              <div className="mt-6 rounded-[2rem] border border-[#39B5A8]/10 bg-[#F0F9F8]/70 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-[#39B5A8]" />
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1A5D56]">Shipment Lookup</p>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#1A5D56]/65">
                      Search by booking ID and narrow results by shipment status, schedule, and assigned driver.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-start lg:self-center">
                    {activeFilterCount > 0 && (
                      <div className="rounded-full border border-[#39B5A8]/10 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                        {activeFilterCount} Active Filters
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFilters}
                      disabled={activeFilterCount === 0}
                      className="rounded-xl border-[#39B5A8]/15 bg-white font-bold text-[#1A5D56] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="mr-2 h-4 w-4" /> Clear Filters
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))]">
                  <div className="xl:col-span-1">
                    <label htmlFor="booking-search" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                      Booking ID
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#39B5A8]/60" />
                      <Input
                        id="booking-search"
                        type="text"
                        value={bookingSearchQuery}
                        onChange={(event) => setBookingSearchQuery(event.target.value)}
                        placeholder="Search by booking ID"
                        className="h-12 rounded-2xl border-[#39B5A8]/10 bg-white pl-11 pr-4 text-sm font-semibold text-[#041614] placeholder:text-[#39B5A8]/35 focus-visible:border-[#39B5A8]/30 focus-visible:ring-[#39B5A8]/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="status-filter" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                      Status
                    </label>
                    <div className="relative">
                      <Filter className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#39B5A8]/60" />
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger
                          id="status-filter"
                          className="h-12 w-full rounded-2xl border-[#39B5A8]/15 bg-white pl-11 pr-4 text-sm font-bold text-[#041614] shadow-sm outline-none transition-colors hover:bg-[#F8FCFC] focus:ring-2 focus:ring-[#39B5A8]/20"
                        >
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="overflow-hidden rounded-2xl border-[#39B5A8]/15 bg-white p-1 shadow-xl">
                          {['All', 'In Transit', 'Pending', 'Delivered', 'Cancelled'].map((status) => (
                            <SelectItem
                              key={status}
                              value={status}
                              className="rounded-xl px-3 py-2 text-sm font-semibold text-[#1A5D56] focus:bg-[#F0F9F8] focus:text-[#041614]"
                            >
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="driver-filter" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                      Assigned Driver
                    </label>
                    <div className="relative">
                      <Truck className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#39B5A8]/60" />
                      <Select value={driverFilter} onValueChange={setDriverFilter}>
                        <SelectTrigger
                          id="driver-filter"
                          className="h-12 w-full rounded-2xl border-[#39B5A8]/15 bg-white pl-11 pr-4 text-sm font-bold text-[#041614] shadow-sm outline-none transition-colors hover:bg-[#F8FCFC] focus:ring-2 focus:ring-[#39B5A8]/20"
                        >
                          <SelectValue placeholder="All Drivers" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 overflow-y-auto rounded-2xl border-[#39B5A8]/15 bg-white p-1 shadow-xl">
                          {driverOptions.map((driver) => (
                            <SelectItem
                              key={driver}
                              value={driver}
                              className="rounded-xl px-3 py-2 text-sm font-semibold text-[#1A5D56] focus:bg-[#F0F9F8] focus:text-[#041614]"
                            >
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="start-date-filter" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                      Start Date
                    </label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#39B5A8]/60" />
                      <Input
                        id="start-date-filter"
                        type="date"
                        value={startDateFilter}
                        onChange={(event) => setStartDateFilter(event.target.value)}
                        className="h-12 rounded-2xl border-[#39B5A8]/10 bg-white pl-11 pr-4 text-sm font-semibold text-[#041614] focus-visible:border-[#39B5A8]/30 focus-visible:ring-[#39B5A8]/15"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="end-date-filter" className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">
                      End Date
                    </label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#39B5A8]/60" />
                      <Input
                        id="end-date-filter"
                        type="date"
                        value={endDateFilter}
                        onChange={(event) => setEndDateFilter(event.target.value)}
                        className="h-12 rounded-2xl border-[#39B5A8]/10 bg-white pl-11 pr-4 text-sm font-semibold text-[#041614] focus-visible:border-[#39B5A8]/30 focus-visible:ring-[#39B5A8]/15"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#F0F9F8]">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">Shipment</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">Sender</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">Receiver</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">Driver</th>
                      <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">Value</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">Status</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-[#39B5A8]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#39B5A8]/5">
                    {paginatedShipments.length > 0 ? (
                      paginatedShipments.map((shipment) => (
                        <tr key={shipment.id} className="group cursor-pointer transition-colors hover:bg-[#F0F9F8]/30" onClick={() => navigate(`/pakiship/shipments/${shipment.id}`)}>
                          <td className="px-8 py-6">
                            <p className="text-xs font-bold text-[#041614]">{shipment.id}</p>
                            <p className="mt-1 text-xs font-black text-[#041614] group-hover:text-[#39B5A8]">{shipment.store}</p>
                            <p className="text-[10px] font-medium text-gray-400">{shipment.date}</p>
                          </td>
                          <td className="px-6 py-6">
                            <p className="text-xs font-bold text-[#1A5D56]">{shipment.sender}</p>
                            <p className="max-w-[220px] truncate text-[10px] text-gray-400">{shipment.location}</p>
                          </td>
                          <td className="px-6 py-6">
                            <p className="text-xs font-bold text-[#1A5D56]">{shipment.receiver}</p>
                            <p className="max-w-[220px] truncate text-[10px] text-gray-400">{shipment.destination}</p>
                          </td>
                          <td className="px-6 py-6">
                            <p className="text-xs font-bold text-[#1A5D56]">{shipment.driver}</p>
                            <p className="text-[10px] font-bold text-[#39B5A8]">ETA: {shipment.eta}</p>
                          </td>
                          <td className="px-6 py-6">
                            <p className="text-xs font-black text-[#1A5D56]">PHP {shipment.amount}</p>
                            <p className="text-[10px] font-bold uppercase tracking-tight text-gray-400">{shipment.quantity}</p>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span
                              className={`inline-flex items-center justify-center rounded-lg border px-3 py-1 text-[10px] font-black uppercase ${
                                shipment.status === 'In Transit'
                                  ? 'border-blue-100 bg-blue-50 text-blue-600'
                                  : shipment.status === 'Delivered'
                                    ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                                    : shipment.status === 'Cancelled'
                                      ? 'border-red-100 bg-red-50 text-red-600'
                                      : 'border-amber-100 bg-amber-50 text-amber-600'
                              }`}
                            >
                              {shipment.status}
                            </span>
                          </td>
                          <td className="px-4 py-6 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation();
                                openStatusDialog(shipment);
                              }}
                            >
                              <ShieldAlert className="mr-2 h-3.5 w-3.5" />
                              Override
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-10 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 opacity-30">
                            <Search className="h-8 w-8" />
                            <p className="text-sm font-black uppercase tracking-widest text-[#1A5D56]">No Shipments Found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-[#39B5A8]/5 px-8 py-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-[#1A5D56]/70">
                  Showing {(currentPage - 1) * shipmentsPerPage + (paginatedShipments.length > 0 ? 1 : 0)}-
                  {(currentPage - 1) * shipmentsPerPage + paginatedShipments.length} of {filteredShipments.length} shipments
                </p>

                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage((page) => page - 1);
                          }
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'text-[#1A5D56]'}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(event) => {
                            event.preventDefault();
                            setCurrentPage(page);
                          }}
                          className={
                            currentPage === page
                              ? 'border-[#39B5A8]/20 bg-[#F0F9F8] text-[#39B5A8]'
                              : 'text-[#1A5D56]'
                          }
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage((page) => page + 1);
                          }
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'text-[#1A5D56]'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Override Shipment Status</DialogTitle>
                <DialogDescription>
                  Change the shipment status or cancel it with a required reason.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {selectedShipment && (
                  <div className="rounded-2xl border border-[#39B5A8]/10 bg-[#F0F9F8] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">Shipment</p>
                    <p className="mt-1 text-sm font-black text-[#041614]">{selectedShipment.id}</p>
                    <p className="text-xs font-semibold text-[#1A5D56]/65">{selectedShipment.store}</p>
                  </div>
                )}
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Reason for override or cancellation"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="resize-none"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!reason.trim()}
                  className={newStatus === 'Cancelled' ? 'bg-red-500 text-white hover:bg-red-600' : ''}
                >
                  {newStatus === 'Cancelled' ? 'Cancel Shipment' : 'Apply Override'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
