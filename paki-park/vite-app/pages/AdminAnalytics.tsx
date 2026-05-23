import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Car, Calendar, Clock, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsService } from '../services/analyticsService';
import { BackendStatus } from '../components/BackendStatus';

export function AdminAnalytics() {
  // Revenue data over time
  const [revenueData, setRevenueData] = useState([
    { month: 'Jan', revenue: 45000, bookings: 320 },
    { month: 'Feb', revenue: 52000, bookings: 380 },
    { month: 'Mar', revenue: 48000, bookings: 350 },
    { month: 'Apr', revenue: 61000, bookings: 425 },
    { month: 'May', revenue: 58000, bookings: 410 },
    { month: 'Jun', revenue: 67000, bookings: 475 },
  ]);

  // Hourly occupancy data
  const [occupancyData, setOccupancyData] = useState([
    { hour: '6 AM', occupancy: 15 },
    { hour: '8 AM', occupancy: 65 },
    { hour: '10 AM', occupancy: 85 },
    { hour: '12 PM', occupancy: 92 },
    { hour: '2 PM', occupancy: 78 },
    { hour: '4 PM', occupancy: 88 },
    { hour: '6 PM', occupancy: 95 },
    { hour: '8 PM', occupancy: 72 },
    { hour: '10 PM', occupancy: 45 },
  ]);

  // Vehicle type distribution
  const [vehicleTypeData, setVehicleTypeData] = useState([
    { name: 'Sedan', value: 580, color: '#1e3d5a' },
    { name: 'SUV', value: 425, color: '#ee6b20' },
    { name: 'Van', value: 285, color: '#4ade80' },
    { name: 'Truck', value: 180, color: '#f59e0b' },
    { name: 'Hatchback', value: 245, color: '#8b5cf6' },
    { name: 'Pickup', value: 195, color: '#ec4899' },
  ]);

  // Payment method distribution
  const [paymentMethodData, setPaymentMethodData] = useState([
    { name: 'GCash',          value: 850, color: '#007dfe' },
    { name: 'PayMaya',        value: 620, color: '#00b14f' },
    { name: 'Credit/Debit Card', value: 450, color: '#f59e0b' },
  ]);

  // Daily bookings trend
  const dailyBookingsData = [
    { day: 'Mon', bookings: 78 },
    { day: 'Tue', bookings: 85 },
    { day: 'Wed', bookings: 92 },
    { day: 'Thu', bookings: 88 },
    { day: 'Fri', bookings: 95 },
    { day: 'Sat', bookings: 110 },
    { day: 'Sun', bookings: 102 },
  ];

  const [stats, setStats] = useState([
    { label: 'Total Revenue (This Month)', value: '₱125,450', icon: DollarSign, color: '#10b981', light: '#f0fdf8', change: '+15%' },
    { label: 'Total Bookings (This Month)', value: '1,234',    icon: Car,         color: '#0ea5e9', light: '#f0f9ff', change: '+12%' },
    { label: 'Active Users',               value: '856',       icon: Users,       color: '#8b5cf6', light: '#f5f0ff', change: '+8%'  },
    { label: 'Avg. Parking Duration',      value: '3.5 hrs',   icon: Clock,       color: '#f59e0b', light: '#fffbeb', change: '+0.5 hrs' },
  ]);

  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch analytics data from API
  useEffect(() => {
    analyticsService.getDashboardStats().then((data) => {
      if (data) {
        setStats([
          { label: 'Total Revenue (This Month)', value: `₱${data.revenue?.toLocaleString() || '0'}`, icon: DollarSign, color: '#10b981', light: '#f0fdf8', change: '+15%' },
          { label: 'Total Bookings (This Month)', value: data.totalBookings?.toLocaleString() || '0', icon: Car, color: '#0ea5e9', light: '#f0f9ff', change: '+12%' },
          { label: 'Active Users', value: data.activeUsers?.toLocaleString() || '0', icon: Users, color: '#8b5cf6', light: '#f5f0ff', change: '+8%' },
          { label: 'Avg. Parking Duration', value: '3.5 hrs', icon: Clock, color: '#f59e0b', light: '#fffbeb', change: '+0.5 hrs' },
        ]);
      }
    }).catch((err: any) => {
      setApiError(err?.message || 'Failed to load analytics');
    });

    // Backend returns { _id: "2025-03", revenue, bookings }
    // Charts need { month: "Mar 25", revenue, bookings }
    analyticsService.getRevenueData().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        setRevenueData(data.map((d: any) => {
          const [year, mon] = (d._id || '').split('-');
          const label = mon ? `${SHORT_MONTHS[parseInt(mon, 10) - 1]} ${String(year).slice(2)}` : d._id;
          return { month: label, revenue: d.revenue || 0, bookings: d.bookings || 0 };
        }));
      }
    }).catch((err: any) => {
      if (!apiError) setApiError(err?.message || 'Failed to load revenue data');
    });

    // Backend returns { _id: "10:00 - 11:00", count }
    // Charts need { hour: "10 AM", occupancy: count }
    analyticsService.getOccupancyData().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setOccupancyData(data.map((d: any) => {
          const startPart = (d._id || '').split(' - ')[0];
          const h = parseInt(startPart, 10);
          const label = isNaN(h) ? d._id : (h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`);
          return { hour: label, occupancy: d.count || 0 };
        }));
      }
    }).catch(() => {});

    // Backend returns { _id: "sedan", count }
    // Charts need { name: "Sedan", value: count, color }
    analyticsService.getVehicleTypeDistribution().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const colors = ['#1e3d5a', '#ee6b20', '#4ade80', '#f59e0b', '#8b5cf6', '#ec4899'];
        setVehicleTypeData(data.map((d: any, i: number) => ({
          name:  d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Other',
          value: d.count || 0,
          color: colors[i % colors.length],
        })));
      }
    }).catch(() => {});

    // Backend returns { _id: "GCash", count }
    // Charts need { name: "GCash", value: count, color }
    analyticsService.getPaymentMethodDistribution().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        const pmColors: Record<string, string> = {
          'GCash':            '#007dfe',
          'PayMaya':          '#00b14f',
          'Credit/Debit Card':'#f59e0b',
        };
        setPaymentMethodData(data.map((d: any) => ({
          name:  d._id || 'Other',
          value: d.count || 0,
          color: pmColors[d._id] || '#6b7280',
        })));
      }
    }).catch(() => {});
  }, []);

  if (apiError) {
    return (
      <BackendStatus
        error={apiError}
        onRetry={() => { setApiError(null); window.location.reload(); }}
      />
    );
  }

  return (
    // Increased space-y-8 to space-y-12, added overall padding (p-4 sm:p-8)
    <div className="space-y-12 p-4 sm:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-4xl font-bold text-[#1e3d5a] mb-3">Analytics & Reports</h1>
        <p className="text-gray-600 text-lg">Comprehensive parking operation insights and trends</p>
      </div>

      {/* Stats Grid */}
      <style>{`
        .analytics-card { transition: all 0.35s cubic-bezier(0.34,1.2,0.64,1); }
        .analytics-card:hover { transform: translateY(-6px); }
        .analytics-card .a-blob { transition: transform 0.4s ease; transform: scale(1); }
        .analytics-card:hover .a-blob { transform: scale(2.2); }
        .analytics-card .a-icon { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); }
        .analytics-card .a-accent { opacity: 0; transition: opacity 0.3s; }
        .analytics-card:hover .a-accent { opacity: 1; }
      `}</style>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="analytics-card relative bg-white rounded-3xl border-2 border-[#f1f5f9] p-6 flex flex-col items-center text-center overflow-hidden"
          >
            <style>{`
              .analytics-card:nth-child(${index + 1}):hover {
                border-color: ${stat.color}60;
                background: ${stat.light};
                box-shadow: 0 20px 50px ${stat.color}25, 0 4px 16px ${stat.color}15;
              }
              .analytics-card:nth-child(${index + 1}) .a-icon {
                background: ${stat.light};
                box-shadow: 0 2px 8px ${stat.color}25;
              }
              .analytics-card:nth-child(${index + 1}):hover .a-icon {
                background: ${stat.color};
                box-shadow: 0 8px 24px ${stat.color}50;
                transform: scale(1.12) rotate(6deg);
              }
              .analytics-card:nth-child(${index + 1}):hover .a-icon svg {
                color: white !important;
              }
              .analytics-card:nth-child(${index + 1}):hover .a-label {
                color: ${stat.color};
              }
              .analytics-card:nth-child(${index + 1}) .a-blob {
                background: ${stat.color}12;
              }
              .analytics-card:nth-child(${index + 1}) .a-accent {
                background: linear-gradient(90deg, transparent, ${stat.color}, transparent);
              }
            `}</style>

            {/* Blob */}
            <div className="a-blob absolute -top-6 -right-6 w-20 h-20 rounded-full" />

            {/* Icon */}
            <div className="a-icon size-14 rounded-2xl flex items-center justify-center mb-4 relative z-10">
              <stat.icon className="size-6 transition-colors duration-300" style={{ color: stat.color }} />
            </div>

            {/* Value */}
            <p className="text-2xl font-extrabold text-[#1e3d5a] mb-1 relative z-10">{stat.value}</p>

            {/* Label */}
            <p className="a-label text-xs font-semibold text-gray-400 transition-colors duration-300 relative z-10 mb-2 leading-tight">{stat.label}</p>

            {/* Change badge */}
            <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full relative z-10"
              style={{ background: stat.color + '18', color: stat.color }}>
              {stat.change}
            </span>

            {/* Bottom accent */}
            <div className="a-accent absolute bottom-0 left-0 right-0 h-[3px] rounded-b-3xl" />
          </div>
        ))}
      </div>

      {/* Revenue & Bookings Chart */}
      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold text-[#1e3d5a] mb-1">Revenue & Bookings Trend</h3>
            <p className="text-base text-gray-500">Last 6 months performance</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <BarChart3 className="size-6 text-[#1e3d5a]" />
          </div>
        </div>
        {/* Increased h-80 to h-96 */}
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" stroke="#9ca3af" axisLine={false} tickLine={false} dy={10} />
              <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  padding: '12px'
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#ee6b20" 
                strokeWidth={4}
                dot={{ fill: '#ee6b20', strokeWidth: 2, r: 6, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                name="Revenue (₱)"
              />
              <Line 
                type="monotone" 
                dataKey="bookings" 
                stroke="#1e3d5a" 
                strokeWidth={4}
                dot={{ fill: '#1e3d5a', strokeWidth: 2, r: 6, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                name="Bookings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hourly Occupancy */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-[#1e3d5a] mb-1">Peak Hours Analysis</h3>
            <p className="text-base text-gray-500">Average occupancy by hour</p>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="hour" stroke="#9ca3af" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="occupancy" 
                  fill="#ee6b20" 
                  radius={[6, 6, 0, 0]}
                  name="Occupancy (%)"
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Type Distribution */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-[#1e3d5a] mb-1">Vehicle Type Distribution</h3>
            <p className="text-base text-gray-500">Breakdown by vehicle category</p>
          </div>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {vehicleTypeData.map((entry, index) => (
                    <Cell key={`vehicle-${entry.name}-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Layout - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-[#1e3d5a] mb-1">Weekly Bookings Trend</h3>
            <p className="text-base text-gray-500">Daily booking volume</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBookingsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" stroke="#9ca3af" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="bookings" 
                  fill="#1e3d5a" 
                  radius={[6, 6, 0, 0]}
                  name="Bookings"
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-[#1e3d5a] mb-1">Payment Method Preferences</h3>
            <p className="text-base text-gray-500">Transaction breakdown by method</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80} // Turned to Donut
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`payment-${entry.name}-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        <div className="bg-gradient-to-br from-[#1e3d5a] to-[#2d5a7f] rounded-2xl shadow-md p-8 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
             <Calendar className="size-32" />
          </div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl">
              <Calendar className="size-8" />
            </div>
            <TrendingUp className="size-6 text-blue-200" />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 font-medium mb-1">Peak Day</p>
            <p className="text-4xl font-bold mb-2">Saturday</p>
            <p className="text-blue-100/80 text-sm">110 avg. bookings</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#ee6b20] to-[#ff8a50] rounded-2xl shadow-md p-8 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
             <Clock className="size-32" />
          </div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl">
              <Clock className="size-8" />
            </div>
            <TrendingUp className="size-6 text-orange-200" />
          </div>
          <div className="relative z-10">
            <p className="text-orange-100 font-medium mb-1">Peak Hour</p>
            <p className="text-4xl font-bold mb-2">6:00 PM</p>
            <p className="text-orange-100/80 text-sm">95% occupancy</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-md p-8 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
             <DollarSign className="size-32" />
          </div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl">
              <DollarSign className="size-8" />
            </div>
            <TrendingUp className="size-6 text-green-200" />
          </div>
          <div className="relative z-10">
            <p className="text-green-100 font-medium mb-1">Avg. Transaction</p>
            <p className="text-4xl font-bold mb-2">₱285</p>
            <p className="text-green-100/80 text-sm">Per booking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
