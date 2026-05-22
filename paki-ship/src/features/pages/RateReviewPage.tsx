import { useState, useEffect } from "react";
import { Star, MessageSquare, ShieldCheck, Zap, Package, UserCheck, Clock, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router";
import { CustomerPageHeader } from "../components/CustomerPageHeader";
import { submitCustomerFeedback, getMyReviews, type CustomerReview } from "@/lib/customer-feedback";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

const MASCOTS = {
  1: { src: "https://i.imgur.com/yBvmbRD.png", label: "Poor" },
  2: { src: "https://i.imgur.com/PKTxvFR.png", label: "Fair" },
  3: { src: "https://i.imgur.com/cFzyyZ4.png", label: "Good" },
  4: { src: "https://i.imgur.com/C1jpIzN.png", label: "Very Good" },
  5: { src: "https://i.imgur.com/jknPCsk.png", label: "Excellent" },
};

export function RateReviewPage() {
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myReviews, setMyReviews] = useState<CustomerReview[]>([]);

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "error" | "success" }>({
    show: false,
    message: "",
    type: "success",
  });

  const quickTags = [
    { id: "fast", label: "Fast Delivery", icon: <Zap className="w-4 h-4" /> },
    { id: "secured", label: "Item Secured", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "friendly", label: "Friendly Rider", icon: <UserCheck className="w-4 h-4" /> },
    { id: "perfect", label: "Perfect Condition", icon: <Package className="w-4 h-4" /> },
    { id: "ontime", label: "On Time", icon: <Clock className="w-4 h-4" /> },
  ];

  const showToast = (message: string, type: "error" | "success") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    getMyReviews().then(setMyReviews).catch(() => {});
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const toggleTag = (label: string) => {
    setSelectedTags(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      showToast("Please select a star rating to continue.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitCustomerFeedback({
        trackingNumber,
        rating,
        review,
        tags: selectedTags,
      });

      showToast(result.message + " Redirecting to home...", "success");
      getMyReviews().then(setMyReviews).catch(() => {});
      setTimeout(() => {
        navigate("/customer/home");
      }, 2000);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to submit parcel feedback.",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9F8] selection:bg-[#39B5A8]/20 font-sans">

      <style>{`
        @keyframes mascotPop {
          0%   { transform: scale(0.4) translateY(10px); opacity: 0; }
          100% { transform: scale(1)   translateY(0px);  opacity: 1; }
        }
      `}</style>

      {/* Toast */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 transform ${
          toast.show ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0 pointer-events-none"
        }`}
      >
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2 min-w-[320px] ${
          toast.type === "error"
            ? "bg-white border-red-100 text-red-600 shadow-red-200/50"
            : "bg-white border-[#39B5A8]/20 text-[#1A5D56] shadow-[#39B5A8]/20"
        }`}>
          {toast.type === "error" ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6 text-[#39B5A8]" />}
          <p className="font-bold text-sm tracking-tight">{toast.message}</p>
          <button onClick={() => setToast(p => ({ ...p, show: false }))} className="ml-auto p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Header */}
      <CustomerPageHeader
        title="Rate & Review"
        subtitle="Help us improve the PakiShip experience"
        icon={MessageSquare}
        logo={logoImg}
      />

      <main className="max-w-6xl mx-auto px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] shadow-lg shadow-[#1A5D56]/5 border border-[#39B5A8]/20 p-6 lg:p-8">
            <div className="mb-6 border-l-4 border-[#39B5A8] pl-5">
              <h2 className="text-2xl font-bold text-[#1A5D56]">How was your delivery?</h2>
              <p className="text-slate-500 font-medium text-sm">Help us improve the PakiShip experience.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#1A5D56] uppercase tracking-wider">Tracking Number</label>
                  <input
                    type="text"
                    placeholder="PKS-2024-001"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:border-[#39B5A8] focus:bg-white focus:outline-none transition-all text-[#1A5D56] font-bold"
                    required
                  />
                </div>

                {/* Star Rating Box with Inline Mascot */}
                <div className="bg-[#F0F9F8] rounded-xl p-3 border border-[#39B5A8]/10 flex flex-col items-center justify-center shadow-inner">

                  {/* Inline Mascot */}
                  <div className={`transition-all duration-300 overflow-hidden flex items-center justify-center ${
                    rating > 0 ? "h-20 opacity-100 mb-2" : "h-0 opacity-0 mb-0"
                  }`}>
                    {rating > 0 && (
                      <img
                        key={rating}
                        src={MASCOTS[rating as keyof typeof MASCOTS].src}
                        alt={MASCOTS[rating as keyof typeof MASCOTS].label}
                        className="h-full w-auto object-contain drop-shadow-md"
                        style={{
                          animation: "mascotPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
                        }}
                      />
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-125 active:scale-90"
                      >
                        <Star className={`w-6 h-6 ${star <= (hoveredRating || rating) ? "fill-[#39B5A8] text-[#39B5A8] drop-shadow-sm" : "text-slate-300 fill-slate-50"}`} />
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] font-bold text-[#1A5D56] mt-1.5 uppercase tracking-tighter">
                    {rating === 0 ? "Tap to Rate" : ["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1]}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-[#1A5D56] uppercase tracking-wider">What went well?</label>
                <div className="flex flex-wrap gap-2">
                  {quickTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.label)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-xs transition-all border-2 ${
                        selectedTags.includes(tag.label)
                          ? "bg-[#39B5A8] border-[#39B5A8] text-white shadow-md scale-105"
                          : "bg-white border-slate-100 text-slate-500 hover:border-[#39B5A8]/40"
                      }`}
                    >
                      {tag.icon}
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="block text-[11px] font-bold text-[#1A5D56] uppercase tracking-wider">Review (Optional)</label>
                  <span className="text-[10px] text-slate-400 font-bold">{review.length}/500</span>
                </div>
                <textarea
                  placeholder="Tell us more about your experience..."
                  value={review}
                  maxLength={500}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:border-[#39B5A8] focus:bg-white transition-all resize-none text-[#1A5D56] font-bold min-h-[110px] text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/customer/home")}
                  className="flex-1 h-12 rounded-xl border-2 border-slate-200 font-bold text-slate-500 text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] h-12 rounded-xl bg-[#39B5A8] hover:bg-[#1A5D56] text-white font-bold transition-all shadow-lg shadow-[#39B5A8]/20 text-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#1A5D56] rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#39B5A8]/10 rounded-full" />

              <div className="flex items-center justify-between mb-5 relative z-10">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                  <ShieldCheck className="w-5 h-5 text-[#39B5A8]" />
                  Recent Feedback
                </h3>
                <span className="text-[10px] bg-white/10 px-2 py-1 rounded-md font-bold text-[#39B5A8] border border-white/10">{myReviews.length} Total</span>
              </div>

              <div className="space-y-4 relative z-10">
                {myReviews.length === 0 ? (
                  <p className="text-sm text-white/50 font-medium text-center py-4">No reviews submitted yet.</p>
                ) : (
                  myReviews.slice(0, 3).map((item) => (
                    <div key={item.reviewId} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:bg-white/[0.08] transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-[#39B5A8] tracking-widest uppercase">{item.trackingNumber}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < item.rating ? "fill-[#39B5A8] text-[#39B5A8]" : "fill-white/10 text-white/10"}`} />
                          ))}
                        </div>
                      </div>
                      {item.review && (
                        <p className="text-[13px] text-white/80 font-medium italic mb-3 leading-relaxed">
                          "{item.review}"
                        </p>
                      )}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[9px] font-extrabold bg-[#39B5A8]/20 text-[#39B5A8] px-2.5 py-1 rounded-lg border border-[#39B5A8]/20 uppercase tracking-wider">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 border border-[#39B5A8]/20 shadow-sm flex items-center gap-4">
              <div className="bg-[#F0F9F8] p-3 rounded-2xl">
                <UserCheck className="w-6 h-6 text-[#1A5D56]" />
              </div>
              <div>
                <h4 className="font-bold text-[#1A5D56] text-xs uppercase tracking-widest mb-1">Impact</h4>
                <p className="text-sm text-slate-500 font-bold leading-tight">
                  Your feedback helps us reward top-tier riders.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
