import { ArrowLeft, Search, Package, ChevronRight, Calendar, MapPin, History, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { CustomerPageHeader } from "../components/CustomerPageHeader";
import { TransactionDetailsModal } from "../components/TransactionDetailsModal";
import {
  fetchCustomerHistory,
  fetchCustomerHistoryDetails,
  type HistoryDetailsResponse,
  type HistoryTransaction,
} from "@/lib/history";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";
const mascotImg = "/assets/873d403bd2add17b06645c58ef3cc7daba517b30.png";

export function HistoryPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const [transactions, setTransactions] = useState<HistoryTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<HistoryDetailsResponse | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await fetchCustomerHistory();
        setTransactions(result.transactions);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    void loadHistory();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.to.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "active") return matchesSearch && t.isLive;
    if (activeTab === "completed") return matchesSearch && t.bucket === "completed";
    return matchesSearch;
  });

  const handleOpenTransaction = async (transaction: HistoryTransaction) => {
    if (!transaction.trackingNumber) {
      return;
    }

    setIsLoadingDetails(true);
    try {
      const result = await fetchCustomerHistoryDetails(transaction.trackingNumber);
      setSelectedTransaction(result);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-[#041614] font-sans pb-20 selection:bg-[#39B5A8]/20">
      {/* Premium Glassmorphic Header */}
      <CustomerPageHeader
  title="Activity"
  subtitle="Your complete tracking history"
  icon={History}
  logo={logoImg}
  onBack={() => navigate("/customer/home")}
/>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        {/* Search & Tabs Container */}
        <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 mb-10">
          <div className="relative mb-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              placeholder="Search by ID, city, or destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 h-16 bg-slate-50/50 rounded-2xl border-none focus:ring-2 focus:ring-[#39B5A8]/20 transition-all outline-none font-medium text-slate-700"
            />
          </div>

          <div className="flex gap-1">
            {(['all', 'active', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3.5 rounded-xl text-xs font-bold transition-all capitalize tracking-wider ${
                  activeTab === tab 
                    ? "bg-[#39B5A8] text-white shadow-md" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Parcel Records</h2>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
              {filteredTransactions.length} results
            </span>
          </div>

          {isLoadingHistory && (
            <div className="py-12 text-center text-sm font-bold text-slate-400">
              Loading your parcel history...
            </div>
          )}

          {!isLoadingHistory && filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id}
              onClick={() => {
                void handleOpenTransaction(transaction);
              }}
              className="group relative bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-[#39B5A8]/40 hover:shadow-2xl hover:shadow-[#39B5A8]/10 transition-all cursor-pointer overflow-hidden"
            >
              {/* Header Info */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${transaction.isLive ? 'bg-[#39B5A8]/10 text-[#39B5A8]' : 'bg-slate-100 text-slate-400'}`}>
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-800">{transaction.id}</h3>
                      {transaction.isLive && (
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{transaction.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#1A5D56] mb-1">
                    {transaction.amount || "Pending"}
                  </p>
                  <span className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-xl ${
                    transaction.isLive ? 'bg-[#39B5A8] text-white shadow-lg shadow-[#39B5A8]/20' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>

              {/* Delivery Path UI */}
              <div className="flex items-center gap-4 bg-slate-50/80 p-5 rounded-3xl border border-slate-100/50">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">From</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-300" />
                    <span className="font-bold text-slate-700 text-sm">{transaction.from}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center px-2">
                   <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-[#39B5A8] group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>

                <div className="flex-1 text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-right">To</p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-bold text-slate-700 text-sm">{transaction.to}</span>
                    <MapPin className="w-3 h-3 text-[#39B5A8]" />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5" /> {transaction.date}</span>
                  {transaction.isLive && (
                    <span className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-bold">
                      <Clock className="w-3.5 h-3.5" /> Est. Arrival Today
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[#39B5A8] font-bold text-xs group-hover:gap-3 transition-all">
                  Details <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {!isLoadingHistory && filteredTransactions.length === 0 && (
            <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 bg-[#39B5A8]/10 rounded-full animate-ping" />
                <img src={mascotImg} alt="No orders" className="relative z-10 w-full h-full object-contain grayscale opacity-60" />
              </div>
              <h3 className="text-xl font-bold text-[#1A5D56] mb-2">No shipments found</h3>
              <p className="text-slate-400 text-sm font-medium mb-8 max-w-[450px] mx-auto">Try adjusting your search or filtering by status.</p>
              <button 
                onClick={() => {setSearchTerm(""); setActiveTab("all");}}
                className="px-10 py-4 bg-[#1A5D56] text-white rounded-2xl font-bold shadow-xl shadow-[#1A5D56]/30 hover:scale-105 active:scale-95 transition-all"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Details Modal */}
      {isLoadingDetails && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center text-white font-bold">
          Loading parcel details...
        </div>
      )}

      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
