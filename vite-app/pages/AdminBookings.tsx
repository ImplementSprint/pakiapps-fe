import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Clock, User, Car, MapPin, CheckCircle, AlertCircle, XCircle, Eye, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { bookingService } from '../services/bookingService';
import { BackendStatus } from '../components/BackendStatus';

interface Booking {
  id: string;
  customer: string;
  email: string;
  phone: string;
  spot: string;
  vehicleType: string;
  plateNumber: string;
  date: string;
  time: string;
  duration: string;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  amount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
}

export function AdminBookings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  // Fetch bookings from API
  useEffect(() => {
    setLoading(true);
    setApiError(null);
    const statusParam = filterStatus === 'all' ? undefined : filterStatus;
    bookingService.getAllBookings({ status: statusParam, search: searchQuery || undefined }).then((data) => {
      if (data?.bookings) {
        setAllBookings(data.bookings.map((b: any) => ({
          id: b.reference || b._id,
          customer: b.userId?.name || 'Customer',
          email: b.userId?.email || '',
          phone: b.userId?.phone || '',
          spot: b.spot,
          vehicleType: b.vehicleId?.type || 'Sedan',
          plateNumber: b.vehicleId?.plateNumber || '',
          date: b.date,
          time: b.timeSlot || '',
          duration: '1 hr',
          status: b.status === 'upcoming' ? 'pending' : b.status,
          amount: b.amount,
          paymentStatus: b.paymentStatus || 'paid',
        })));
      }
    }).catch((err: any) => {
      setApiError(err?.message || 'Failed to load bookings');
    }).finally(() => setLoading(false));
  }, [filterStatus, searchQuery]);

  if (apiError) {
    return (
      <BackendStatus
        error={apiError}
        onRetry={() => { setApiError(null); window.location.reload(); }}
      />
    );
  }

  const filteredBookings = allBookings.filter((booking) => {
    const matchesSearch = 
      booking.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.spot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="size-3" />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <CheckCircle className="size-3" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            <Clock className="size-3" />
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
            <XCircle className="size-3" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-xs font-semibold text-green-600">Paid</span>;
      case 'pending':
        return <span className="text-xs font-semibold text-red-600">Pending</span>;
      case 'partial':
        return <span className="text-xs font-semibold text-yellow-600">Partial</span>;
      default:
        return null;
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#1e3d5a]">Booking Details</h3>
                  <p className="text-gray-600">Booking ID: <span className="font-semibold text-[#ee6b20]">{selectedBooking.id}</span></p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-[#1e3d5a] mb-3">Customer Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="font-semibold text-[#1e3d5a]">{selectedBooking.customer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="font-semibold text-[#1e3d5a]">{selectedBooking.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Phone:</span>
                      <span className="font-semibold text-[#1e3d5a]">{selectedBooking.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-[#1e3d5a] mb-3">Parking Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Spot:</span>
                      <span className="font-semibold text-[#1e3d5a]">{selectedBooking.spot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Duration:</span>
                      <span className="font-semibold text-[#1e3d5a]">{selectedBooking.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-[#1e3d5a] mb-3">Vehicle Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Car className="size-4 text-gray-600" />
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="font-semibold text-[#1e3d5a]">{selectedBooking.vehicleType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Plate:</span>
                      <span className="font-semibold text-[#1e3d5a]">{selectedBooking.plateNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 p-4 bg-[#1e3d5a]/5 rounded-lg border border-[#1e3d5a]/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-3xl font-bold text-[#1e3d5a]">₱{selectedBooking.amount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Payment Status</p>
                      <p className="text-lg font-bold">{getPaymentBadge(selectedBooking.paymentStatus)}</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="size-4" />
                    <span>Booking Date:</span>
                    <span className="font-semibold text-[#1e3d5a]">{selectedBooking.date} at {selectedBooking.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button className="flex-1 bg-[#ee6b20] hover:bg-[#d55f1c] text-white">
                  <Download className="size-4 mr-2" />
                  Export Receipt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1e3d5a] mb-2">Bookings Management</h1>
        <p className="text-gray-600">View and manage all parking bookings</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by customer, booking ID, spot, or plate number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <Filter className="size-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#ee6b20]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Export Button */}
          <Button className="bg-[#ee6b20] hover:bg-[#d55f1c] text-white">
            <Download className="size-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <style>{`
        .booking-card { transition: all 0.35s cubic-bezier(0.34,1.2,0.64,1); }
        .booking-card:hover { transform: translateY(-6px); }
        .booking-card .b-blob { transition: transform 0.4s ease; transform: scale(1); }
        .booking-card:hover .b-blob { transform: scale(2.2); }
        .booking-card .b-icon { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); }
        .booking-card .b-accent { opacity: 0; transition: opacity 0.3s; }
        .booking-card:hover .b-accent { opacity: 1; }
      `}</style>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Bookings', value: allBookings.length,                                       icon: Calendar,    color: '#0ea5e9', light: '#f0f9ff' },
          { label: 'Active',         value: allBookings.filter(b => b.status === 'active').length,    icon: CheckCircle, color: '#10b981', light: '#f0fdf8' },
          { label: 'Completed',      value: allBookings.filter(b => b.status === 'completed').length, icon: CheckCircle, color: '#8b5cf6', light: '#f5f0ff' },
          { label: 'Pending',        value: allBookings.filter(b => b.status === 'pending').length,   icon: AlertCircle, color: '#f59e0b', light: '#fffbeb' },
        ].map((stat, index) => (
          <div
            key={index}
            className="booking-card relative bg-white rounded-3xl border-2 border-[#f1f5f9] p-6 flex flex-col items-center text-center overflow-hidden"
          >
            <style>{`
              .booking-card:nth-child(${index + 1}):hover {
                border-color: ${stat.color}60;
                background: ${stat.light};
                box-shadow: 0 20px 50px ${stat.color}25, 0 4px 16px ${stat.color}15;
              }
              .booking-card:nth-child(${index + 1}) .b-icon {
                background: ${stat.light};
                box-shadow: 0 2px 8px ${stat.color}25;
              }
              .booking-card:nth-child(${index + 1}):hover .b-icon {
                background: ${stat.color};
                box-shadow: 0 8px 24px ${stat.color}50;
                transform: scale(1.12) rotate(6deg);
              }
              .booking-card:nth-child(${index + 1}):hover .b-icon svg {
                color: white !important;
              }
              .booking-card:nth-child(${index + 1}):hover .b-label {
                color: ${stat.color};
              }
              .booking-card:nth-child(${index + 1}) .b-blob {
                background: ${stat.color}12;
              }
              .booking-card:nth-child(${index + 1}) .b-accent {
                background: linear-gradient(90deg, transparent, ${stat.color}, transparent);
              }
            `}</style>
            <div className="b-blob absolute -top-6 -right-6 w-20 h-20 rounded-full" />
            <div className="b-icon size-14 rounded-2xl flex items-center justify-center mb-4 relative z-10">
              <stat.icon className="size-6 transition-colors duration-300" style={{ color: stat.color }} />
            </div>
            <p className="text-3xl font-extrabold text-[#1e3d5a] mb-1 relative z-10">{stat.value}</p>
            <p className="b-label text-sm font-semibold text-gray-400 transition-colors duration-300 relative z-10">{stat.label}</p>
            <div className="b-accent absolute bottom-0 left-0 right-0 h-[3px] rounded-b-3xl" />
          </div>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booking ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Spot</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-[#1e3d5a]">{booking.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-[#1e3d5a]">{booking.customer}</p>
                      <p className="text-xs text-gray-500">{booking.vehicleType} - {booking.plateNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-[#ee6b20]">{booking.spot}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{booking.date}</p>
                      <p className="text-xs text-gray-500">{booking.time}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{booking.duration}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-[#1e3d5a]">₱{booking.amount}</span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(booking.status)}
                  </td>
                  <td className="px-6 py-4">
                    {getPaymentBadge(booking.paymentStatus)}
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(booking)}
                      className="border-[#1e3d5a] text-[#1e3d5a] hover:bg-[#1e3d5a] hover:text-white"
                    >
                      <Eye className="size-4 mr-1" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="p-12 text-center">
            <AlertCircle className="size-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No bookings found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
