import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  ExternalLink,
  Map,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  User,
} from "lucide-react";
import { useJobs, type Job } from "./JobsContext";

const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

function CallModal({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#041614]/60 flex items-end sm:items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#39B5A8] flex items-center justify-center text-white font-black text-3xl mb-3">
            {job.customerName.charAt(0)}
          </div>
          <h2 className="text-xl font-black text-[#041614]">{job.customerName}</h2>
          <p className="text-[#39B5A8] font-bold text-sm mt-1">{job.customerPhone}</p>
        </div>
        <a href={`tel:${job.customerPhone}`} className="w-full bg-[#39B5A8] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 mb-3"><Phone className="w-4 h-4" />Call Now</a>
        <button onClick={onClose} className="w-full py-3 text-gray-400 font-bold text-sm">Cancel</button>
      </div>
    </div>
  );
}

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { jobs, hasLoaded, isLoading } = useJobs();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const job = jobs.find((item) => item.id === jobId) ?? null;

  useEffect(() => {
    if (hasLoaded && !isLoading && !job) navigate("/driver");
  }, [hasLoaded, isLoading, job, navigate]);

  if (!job) {
    return <div className="min-h-screen bg-[#F0F9F8] flex items-center justify-center"><div className="w-16 h-16 border-4 border-[#39B5A8] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F0F9F8] text-[#1A5D56]">
      {showCallModal && <CallModal job={job} onClose={() => setShowCallModal(false)} />}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3"><button onClick={() => navigate("/driver")} className="p-2 hover:bg-[#F0F9F8] rounded-xl text-[#39B5A8]"><ArrowLeft className="w-5 h-5" /></button><img src={logoImg} alt="PakiSHIP Logo" className="h-8" /></div>
          <h1 className="text-base font-black text-[#041614]">Job Details</h1>
          <div className="w-20" />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><span className="text-xs font-black text-[#39B5A8] bg-[#F0F9F8] px-2.5 py-1 rounded-lg border border-[#39B5A8]/10">{job.jobNumber}</span><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${job.status === "available" ? "bg-green-100 text-green-700" : job.status === "in-progress" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{job.status === "in-progress" ? "In Progress" : job.status}</span></div>
            <div className="text-right"><div className="text-2xl font-black text-[#39B5A8] leading-none">{job.earnings}</div><div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Earnings</div></div>
          </div>
          {job.timeLimit && <div className="flex items-center gap-2 bg-[#F0F9F8] border border-[#39B5A8]/20 rounded-xl px-3 py-2"><Clock className="w-4 h-4 text-[#39B5A8]" /><span className="text-xs font-bold text-[#041614]">Est. completion: <span className="text-[#39B5A8]">{job.timeLimit}</span></span></div>}
        </div>
        <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3"><Map className="w-4 h-4 text-[#39B5A8]" /><h3 className="text-sm font-black text-[#041614]">Route Overview</h3></div>
          <div className="space-y-4">
            <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-[#39B5A8] flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-white" /></div><div><div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Pickup</div><div className="text-[#041614] font-bold text-sm">{job.pickup}</div></div></div>
            <div className="flex items-center gap-3 pl-4"><div className="w-0.5 h-8 bg-gradient-to-b from-[#39B5A8] to-red-400 ml-0.5" /><span className="text-xs text-gray-400 font-bold">{job.distance}</span></div>
            <div className="flex items-start gap-3"><div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-white" /></div><div><div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Drop-off</div><div className="text-[#041614] font-bold text-sm">{job.dropoff}</div></div></div>
          </div>
          <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.status === "available" ? job.pickup : job.dropoff)}`, "_blank")} className="mt-4 w-full bg-[#39B5A8] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm"><ExternalLink className="w-4 h-4" />Open Google Maps Navigation</button>
        </div>
        <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-5 shadow-sm">
          <h3 className="text-sm font-black text-[#041614] mb-3 flex items-center gap-2"><User className="w-4 h-4 text-[#39B5A8]" />Customer</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#39B5A8] flex items-center justify-center text-white font-black text-base">{job.customerName.charAt(0)}</div><div><div className="text-[#041614] font-black text-sm">{job.customerName}</div>{job.customerPhone && <div className="text-xs text-gray-400 font-bold">{job.customerPhone}</div>}</div></div>
            <div className="flex gap-2"><button onClick={() => setShowCallModal(true)} className="p-2.5 bg-[#39B5A8] text-white rounded-xl"><Phone className="w-4 h-4" /></button><button className="p-2.5 bg-gray-100 text-gray-600 rounded-xl"><MessageSquare className="w-4 h-4" /></button></div>
          </div>
        </div>
        <div className="bg-white border border-[#39B5A8]/10 rounded-[1.5rem] p-5 shadow-sm">
          <h3 className="text-sm font-black text-[#041614] mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-[#39B5A8]" />Package Details</h3>
          <div className="grid grid-cols-2 gap-3 mb-3"><div className="p-3 bg-[#F0F9F8] rounded-xl"><div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Size</div><div className="text-[#041614] font-black text-lg">{job.packageSize}</div></div><div className="p-3 bg-[#F0F9F8] rounded-xl"><div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Distance</div><div className="text-[#041614] font-black text-lg">{job.distance}</div></div></div>
          {job.packageDescription && <div className="p-3 border border-gray-100 rounded-xl mb-3"><div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Description</div><div className="text-[#041614] font-bold text-sm">{job.packageDescription}</div></div>}
          {job.specialInstructions && <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl flex items-start gap-2"><AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" /><div><div className="text-[9px] text-yellow-700 font-bold uppercase tracking-wider mb-0.5">Special Instructions</div><div className="text-yellow-900 font-bold text-sm">{job.specialInstructions}</div></div></div>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-6">
          {job.status === "available" && <><button onClick={() => navigate("/driver")} className="py-3.5 px-6 bg-gray-100 text-gray-600 rounded-xl font-black text-sm">Go Back</button><button onClick={() => setShowAcceptModal(true)} className="py-3.5 px-6 bg-[#39B5A8] text-white rounded-xl font-black shadow-lg flex items-center justify-center gap-2 text-sm"><Navigation className="w-4 h-4" />Use Mobile App</button></>}
          {job.status === "in-progress" && <><button onClick={() => setShowCallModal(true)} className="py-3.5 px-6 bg-white border-2 border-[#39B5A8] text-[#39B5A8] rounded-xl font-black flex items-center justify-center gap-2 text-sm"><Phone className="w-4 h-4" />Call Customer</button><button onClick={() => navigate(`/driver/job/${job.id}/update-status`)} className="py-3.5 px-6 bg-[#041614] text-white rounded-xl font-black shadow-lg flex items-center justify-center gap-2 text-sm"><RefreshCw className="w-4 h-4" />Update Parcel Status</button></>}
          {job.status === "completed" && <button onClick={() => navigate("/driver")} className="md:col-span-2 py-3.5 px-6 bg-[#39B5A8] text-white rounded-xl font-black shadow-lg text-sm">Back to Dashboard</button>}
        </div>
      </main>
      {showAcceptModal && <div className="fixed inset-0 bg-[#041614]/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"><div className="bg-white p-8 rounded-[2rem] max-w-lg w-full shadow-2xl"><div className="text-center mb-6"><div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[#F0F9F8] flex items-center justify-center text-[#39B5A8]"><Navigation className="w-7 h-7" /></div><h2 className="text-xl font-black text-[#041614] mb-2">Accept through the Mobile App</h2><p className="text-gray-500 text-sm leading-relaxed">You can review <span className="font-bold text-[#39B5A8]">{job.jobNumber}</span> here, but accepting delivery jobs is only available in the PakiShip mobile app.</p></div><div className="bg-[#F0F9F8] rounded-xl p-4 mb-5 grid grid-cols-2 gap-3 text-center"><div><div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Earnings</div><div className="text-xl font-black text-[#39B5A8]">{job.earnings}</div></div><div><div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Distance</div><div className="text-xl font-black text-[#041614]">{job.distance}</div></div></div><div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100"><button onClick={() => setShowAcceptModal(false)} className="px-6 py-2.5 bg-[#39B5A8] text-white rounded-xl font-black text-sm">Got it</button></div></div></div>}
    </div>
  );
}
