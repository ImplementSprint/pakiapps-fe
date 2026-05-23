import { useState, useEffect } from "react";
import { 
  Star, X, Send, CheckCircle2, AlertCircle, 
  ShieldCheck, Zap, UserCheck, Clock, MapPin, 
  MessageSquare, Info 
} from "lucide-react";

interface RateAndReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  bookingId?: string;
}

export function RateAndReview({ isOpen, onClose, onSubmit, bookingId }: RateAndReviewProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "error" | "success" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "error" | "success") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  if (!isOpen) return null;

  const quickTags = [
    { id: "safe", label: "Safe Area", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "easy", label: "Easy to Find", icon: <MapPin className="w-4 h-4" /> },
    { id: "staff", label: "Friendly Staff", icon: <UserCheck className="w-4 h-4" /> },
    { id: "fast", label: "Quick Entry", icon: <Zap className="w-4 h-4" /> },
    { id: "timing", label: "Spacious Slot", icon: <Clock className="w-4 h-4" /> },
  ];

  const toggleTag = (label: string) => {
    setSelectedTags(prev => 
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

  const handleProcessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast("Please select a star rating to continue.", "error");
      return;
    }
    onSubmit({ bookingId, rating, comment, selectedTags });
    setIsSubmitted(true);
    setTimeout(() => { onClose(); setIsSubmitted(false); }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] z-[300] flex flex-col animate-in slide-in-from-bottom duration-500 font-sans text-slate-900">
      
      {/* --- TOAST --- */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[320] transition-all duration-500 ${toast.show ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"}`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 min-w-[320px] bg-white ${toast.type === "error" ? "border-red-100 text-red-600 shadow-red-200/50" : "border-orange-100 text-[#EE6B20] shadow-orange-200/50"}`}>
          {toast.type === "error" ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6 text-[#EE6B20]" />}
          <p className="font-bold text-sm tracking-tight">{toast.message}</p>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-2xl">
            <MessageSquare className="text-[#EE6B20] size-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase text-[#1E3D5A]">Rate & Review</h1>
            <p className="text-xs font-bold text-slate-400">Ref: {bookingId || "PKS-2024-001"}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors border border-transparent active:scale-90">
          <X className="size-6 text-slate-400" />
        </button>
      </header>

      {!isSubmitted ? (
        /* --- PRETTY SCROLLBAR APPLIED HERE --- */
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:py-12 
          scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-[#EE6B20]/50
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-slate-100
          [&::-webkit-scrollbar-thumb]:bg-slate-300
          [&::-webkit-scrollbar-thumb]:rounded-full
          hover:[&::-webkit-scrollbar-thumb]:bg-[#EE6B20]/50">
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: THE FORM */}
            <div className="lg:col-span-7 space-y-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
              <div className="border-l-4 border-[#EE6B20] pl-6 mb-8">
                <h2 className="text-3xl font-black text-[#1E3D5A]">How was your stay?</h2>
                <p className="text-slate-500 font-medium mt-1">Your review helps the community find the best spots.</p>
              </div>

              <form onSubmit={handleProcessSubmit} className="space-y-8">
                {/* Star Rating Box */}
                <div className="flex flex-col items-center sm:items-start gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-125 active:scale-90"
                      >
                        <Star
                          size={44}
                          className={`transition-all ${star <= (hoveredRating || rating) ? "fill-[#EE6B20] text-[#EE6B20] drop-shadow-sm" : "text-slate-200 fill-white"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-sm font-black text-[#1E3D5A] uppercase tracking-[0.2em]">
                    {rating === 0 ? "Tap to Rate" : ["Awful", "Average", "Good", "Great", "Exceptional"][rating - 1]}
                  </span>
                </div>

                {/* Quick Tags */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">What stood out?</label>
                  <div className="flex flex-wrap gap-3">
                    {quickTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.label)}
                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${selectedTags.includes(tag.label) ? "bg-[#1E3D5A] border-[#1E3D5A] text-white shadow-lg shadow-slate-300 scale-105" : "bg-white border-slate-100 text-slate-500 hover:border-[#EE6B20]/40"}`}
                      >
                        {tag.icon} {tag.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textbox */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Written Feedback</label>
                    <span className="text-[10px] text-slate-400 font-bold">{comment.length}/500</span>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                    placeholder="Tell us more about the parking conditions..."
                    className="w-full h-40 p-5 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-[#EE6B20] focus:bg-white transition-all outline-none text-[#1E3D5A] font-bold resize-none text-sm shadow-inner 
                    scrollbar-thin scrollbar-thumb-slate-300"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-slate-200 font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] py-4 rounded-2xl bg-[#EE6B20] text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-200 hover:bg-[#d55a1a] active:scale-95 transition-all flex items-center justify-center gap-2">
                    Submit Review <Send size={16} />
                  </button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: IMPACT & STATS */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#1E3D5A] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute -top-10 -right-10 size-40 bg-white/5 rounded-full" />
                
                <h3 className="text-xl font-black mb-8 flex items-center gap-3 relative z-10">
                  <ShieldCheck className="text-[#EE6B20]" /> Your Impact
                </h3>

                <div className="space-y-6 relative z-10">
                  <div className="p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-sm group transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-[#EE6B20] text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Active Member</div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={10} className="fill-[#EE6B20] text-[#EE6B20]" />)}
                      </div>
                    </div>
                    <p className="text-sm text-blue-100 font-medium italic leading-relaxed">
                      "Your reviews help thousands of drivers find safe and reliable parking spots in the city."
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                      <div className="text-3xl font-black text-[#EE6B20]">12</div>
                      <div className="text-[10px] font-black text-blue-200 uppercase mt-1 tracking-widest">Reviews</div>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                      <div className="text-3xl font-black text-[#EE6B20]">4.8</div>
                      <div className="text-[10px] font-black text-blue-200 uppercase mt-1 tracking-widest">Avg Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex items-center gap-5">
                <div className="bg-orange-50 p-4 rounded-2xl">
                  <UserCheck className="size-6 text-[#EE6B20]" />
                </div>
                <div>
                  <h4 className="font-black text-[#1E3D5A] text-xs uppercase tracking-widest mb-1">Community Note</h4>
                  <p className="text-sm text-slate-500 font-bold leading-tight">
                    Feedback is moderated to ensure safety.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col items-center justify-center px-6 animate-in zoom-in duration-500">
          <div className="size-40 bg-orange-50 rounded-[3rem] shadow-2xl shadow-orange-100 flex items-center justify-center mb-8 border border-orange-100">
            <CheckCircle2 size={80} className="text-[#EE6B20]" />
          </div>
          <h2 className="text-4xl font-black text-[#1E3D5A] text-center mb-3">Thank You!</h2>
          <p className="text-slate-400 font-bold text-center max-w-xs leading-relaxed uppercase tracking-tighter text-xs">
            Your contribution helps keep PakiPark reliable for everyone.
          </p>
        </main>
      )}
    </div>
  );
}
