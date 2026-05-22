import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, Clock, MapPin, Package, RefreshCw, Truck } from "lucide-react";
import { useJobs } from "./JobsContext";

const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";
type ParcelStatus = "picked-up" | "out-for-delivery" | "delivered";

const statusOptions = [
  { value: "picked-up" as ParcelStatus, label: "Picked Up", description: "Package has been collected from the sender.", icon: <Package className="w-5 h-5" />, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-600" },
  { value: "out-for-delivery" as ParcelStatus, label: "Out for Delivery", description: "Package is on the way to the recipient.", icon: <Truck className="w-5 h-5" />, color: "text-[#39B5A8]", bg: "bg-[#F0F9F8]", border: "border-[#39B5A8]/30", dot: "bg-[#39B5A8]" },
  { value: "delivered" as ParcelStatus, label: "Delivered", description: "Package has been successfully delivered.", icon: <CheckCircle2 className="w-5 h-5" />, color: "text-green-700", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-600" },
];

export default function UpdateParcelStatusPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { jobs, hasLoaded, isLoading, isMutating, updateParcelStatus } = useJobs();
  const [selectedStatus, setSelectedStatus] = useState<ParcelStatus>("picked-up");
  const [submitted, setSubmitted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const job = jobs.find((item) => item.id === jobId) ?? null;

  useEffect(() => {
    if (hasLoaded && !isLoading && !job) navigate("/driver");
  }, [hasLoaded, isLoading, job, navigate]);

  const handleSubmit = async () => {
    if (!job) return;
    try {
      setActionError(null);
      await updateParcelStatus(job.id, selectedStatus);
      setSubmitted(true);
      setTimeout(() => navigate("/driver"), 2000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update parcel status.");
    }
  };

  if (!job) return <div className="min-h-screen bg-[#F0F9F8] flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#39B5A8] border-t-transparent rounded-full animate-spin" /></div>;

  if (submitted) {
    const chosen = statusOptions.find((option) => option.value === selectedStatus)!;
    return <div className="min-h-screen bg-[#F0F9F8] flex items-center justify-center p-4"><div className="bg-white rounded-[2rem] p-10 max-w-sm w-full text-center shadow-xl border border-[#39B5A8]/10"><div className={`w-16 h-16 ${chosen.bg} ${chosen.border} border-2 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}><div className={chosen.color}>{chosen.icon}</div></div><h2 className="text-xl font-black text-[#041614] mb-2">Status Updated!</h2><div className={`${chosen.bg} ${chosen.border} border-2 rounded-2xl px-4 py-3 mb-3`}><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Status</p><p className={`text-lg font-black ${chosen.color}`}>{chosen.label}</p></div><p className="text-gray-500 text-sm font-medium mb-3">{job.jobNumber} has been updated successfully.</p><p className="text-xs text-gray-400 mt-4 font-bold">Redirecting to dashboard...</p></div></div>;
  }

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56]">
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3"><button onClick={() => navigate(`/driver/job/${jobId}`)} className="p-2 hover:bg-[#F0F9F8] rounded-xl transition-colors text-[#39B5A8]"><ArrowLeft className="w-5 h-5" /></button><img src={logoImg} alt="PakiSHIP Logo" className="h-8" /></div>
          <h1 className="text-base font-black text-[#041614]">Update Parcel Status</h1>
          <div className="w-20" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {actionError && <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-600 font-bold">{actionError}</div>}
        <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3"><span className="text-xs font-black text-[#39B5A8] bg-[#F0F9F8] px-2.5 py-1 rounded-lg border border-[#39B5A8]/10">{job.jobNumber}</span><span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">In Progress</span></div>
          <div className="flex items-start gap-3 mb-2"><div className="w-8 h-8 rounded-full bg-[#39B5A8] flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-white" /></div><div><div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Pickup</div><div className="text-[#041614] font-bold text-sm">{job.pickup}</div></div></div>
          <div className="pl-4 my-1"><div className="w-0.5 h-5 bg-gradient-to-b from-[#39B5A8] to-red-400 ml-0.5" /></div>
          <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-white" /></div><div><div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Drop-off</div><div className="text-[#041614] font-bold text-sm">{job.dropoff}</div></div></div>
          {job.timeLimit && <div className="mt-3 flex items-center gap-2 bg-[#F0F9F8] rounded-xl px-3 py-2 border border-[#39B5A8]/10"><Clock className="w-3.5 h-3.5 text-[#39B5A8]" /><span className="text-xs font-bold text-[#041614]">Time limit: <span className="text-[#39B5A8]">{job.timeLimit}</span></span></div>}
        </div>
        <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><RefreshCw className="w-4 h-4 text-[#39B5A8]" /><h3 className="text-sm font-black text-[#041614]">Select New Status</h3></div>
          <div className="space-y-3">{statusOptions.map((option) => { const isSelected = selectedStatus === option.value; return <button key={option.value} onClick={() => setSelectedStatus(option.value)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isSelected ? `${option.bg} ${option.border} ${option.color}` : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? `${option.bg} ${option.border}` : "bg-gray-100 border-gray-200"}`}><span className={isSelected ? option.color : "text-gray-400"}>{option.icon}</span></div><div className="flex-1"><div className={`font-black text-sm ${isSelected ? option.color : "text-gray-600"}`}>{option.label}</div><div className={`text-xs mt-0.5 ${isSelected ? "opacity-80" : "text-gray-400"}`}>{option.description}</div></div><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? `${option.border} bg-white` : "border-gray-300"}`}>{isSelected && <div className={`w-2.5 h-2.5 rounded-full ${option.dot}`} />}</div></button>; })}</div>
        </div>
        <div className="pb-6"><button onClick={() => void handleSubmit()} disabled={isMutating} className="w-full py-4 bg-[#041614] text-white rounded-xl font-black shadow-lg flex items-center justify-center gap-2 text-sm disabled:opacity-60"><RefreshCw className="w-4 h-4" />{isMutating ? "Saving Status..." : "Confirm Status Update"}</button><button onClick={() => navigate(`/driver/job/${jobId}`)} className="w-full py-3 mt-2 text-gray-400 font-bold text-sm">Cancel</button></div>
      </main>
    </div>
  );
}
