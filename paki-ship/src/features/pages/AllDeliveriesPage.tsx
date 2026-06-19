import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Package, Clock, Filter, Search } from "lucide-react";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

export function AllDeliveriesPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const allDeliveries = [
    {
      id: "PKS-2024-001",
      location: "Makati City",
      time: "15 mins away",
      status: "In Transit",
      statusClass: "text-[#54A0CC] bg-[#54A0CC]/10",
    },
    {
      id: "PKS-2024-002",
      location: "Quezon City",
      time: "30 mins away",
      status: "Out for Delivery",
      statusClass: "text-[#FDB833] bg-[#FDB833]/10",
    },
    {
      id: "PKS-2024-003",
      location: "BGC, Taguig",
      time: "1 hour away",
      status: "In Transit",
      statusClass: "text-[#54A0CC] bg-[#54A0CC]/10",
    },
    {
      id: "PKS-2024-007",
      location: "Pasig City",
      time: "2 hours away",
      status: "Picked Up",
      statusClass: "text-[#39B5A8] bg-[#39B5A8]/10",
    },
    {
      id: "PKS-2024-008",
      location: "Mandaluyong",
      time: "45 mins away",
      status: "Out for Delivery",
      statusClass: "text-[#FDB833] bg-[#FDB833]/10",
    },
    {
      id: "PKS-2024-009",
      location: "Manila",
      time: "20 mins away",
      status: "In Transit",
      statusClass: "text-[#54A0CC] bg-[#54A0CC]/10",
    },
  ];

  const filteredDeliveries = allDeliveries.filter(item => {
    const matchesStatus = filterStatus === "all" || item.status.toLowerCase().replace(" ", "") === filterStatus;
    const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56] font-sans">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-[#39B5A8]/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <img src={logoImg} alt="PakiSHIP" className="h-9" />
        <button 
          onClick={() => navigate("/customer/home")}
          className="flex items-center gap-2 px-4 py-2 hover:bg-[#39B5A8]/5 rounded-xl transition-colors text-[#39B5A8] font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-[#041614] mb-2">All Active Deliveries</h1>
          <p className="text-[#39B5A8] text-lg font-semibold">Track and manage your ongoing shipments</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-[#39B5A8]/10 rounded-[2rem] p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-[#39B5A8]/20 rounded-xl focus:outline-none focus:border-[#39B5A8] transition-colors"
                placeholder="Search by tracking number or location..."
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-[#39B5A8]" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-[#39B5A8]/20 rounded-xl focus:outline-none focus:border-[#39B5A8] transition-colors font-bold text-sm"
              >
                <option value="all">All Status</option>
                <option value="pickedup">Picked Up</option>
                <option value="intransit">In Transit</option>
                <option value="outfordelivery">Out for Delivery</option>
              </select>
            </div>
          </div>
        </div>

        {/* Delivery Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-[#39B5A8]/10 rounded-xl p-6">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Total Active</p>
            <p className="text-3xl font-black text-[#041614]">{allDeliveries.length}</p>
          </div>
          <div className="bg-white border border-[#39B5A8]/10 rounded-xl p-6">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">In Transit</p>
            <p className="text-3xl font-black text-[#54A0CC]">
              {allDeliveries.filter(d => d.status === "In Transit").length}
            </p>
          </div>
          <div className="bg-white border border-[#39B5A8]/10 rounded-xl p-6">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Out for Delivery</p>
            <p className="text-3xl font-black text-[#FDB833]">
              {allDeliveries.filter(d => d.status === "Out for Delivery").length}
            </p>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="space-y-4">
          {filteredDeliveries.length > 0 ? (
            filteredDeliveries.map((item) => (
              <div key={item.id} className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-6 flex flex-wrap items-center justify-between gap-4 hover:border-[#39B5A8]/30 transition-all shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-[#F0F9F8] rounded-xl flex items-center justify-center border border-[#39B5A8]/5">
                    <Package className="w-6 h-6 text-[#39B5A8]" />
                  </div>
                  <div>
                    <h4 className="text-[#041614] font-black text-lg">{item.id}</h4>
                    <p className="text-gray-500 text-sm font-medium">{item.location}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[#39B5A8] text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Status</span>
                    <span className={`text-sm font-black uppercase tracking-wider ${item.statusClass.split(' ')[0]}`}>
                      {item.status}
                    </span>
                  </div>

                  <button 
                    onClick={() => navigate("/customer/track-package")}
                    className="bg-[#041614] text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-[#123E3A] transition-all shadow-md active:scale-95"
                  >
                    Track Now
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">No active deliveries found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
