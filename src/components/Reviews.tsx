import { useState, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

const allReviews = [
  {
    name: "John Delos Reyes",
    role: "Business Professional",
    rating: 5,
    review:
      "PakiPark is a game-changer! I use it daily for work and never have to worry about finding parking anymore. The app is intuitive and reservations are instant.",
    avatar: "JD",
  },
  {
    name: "Alyssa Santos",
    role: "Frequent Traveler",
    rating: 5,
    review:
      "Perfect for airport parking! I can book in advance and the prices are very competitive. The navigation feature is incredibly helpful.",
    avatar: "AS",
  },
  {
    name: "Mark Reyes",
    role: "Restaurant Owner",
    rating: 5,
    review:
      "We partnered with PakiPark for our restaurant's valet service. The system is seamless and our customers love the convenience!",
    avatar: "MR",
  },
  {
    name: "Carla Mendoza",
    role: "Daily Commuter",
    rating: 5,
    review:
      "I save at least 20 minutes every morning thanks to PakiPark. No more circling the block — my spot is always ready when I arrive.",
    avatar: "CM",
  },
  {
    name: "Rico Buenaventura",
    role: "Mall Operations Manager",
    rating: 5,
    review:
      "Integrating PakiPark into our mall's parking system reduced congestion dramatically. Visitors love the real-time availability feature.",
    avatar: "RB",
  },
  {
    name: "Patricia Lim",
    role: "Healthcare Worker",
    rating: 5,
    review:
      "As a nurse with unpredictable shift hours, having a reliable parking reservation system is a lifesaver. PakiPark never lets me down.",
    avatar: "PL",
  },
];

const PAGE_SIZE = 3;

export function Reviews() {
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const totalPages = Math.ceil(allReviews.length / PAGE_SIZE);
  const reviews = allReviews.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const navigate = (dir: "left" | "right") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setPage((p) =>
        dir === "right"
          ? (p + 1) % totalPages
          : (p - 1 + totalPages) % totalPages
      );
      setAnimating(false);
    }, 350);
  };

  return (
    <section id="reviews" className="py-16 bg-white overflow-hidden">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-60px); }
        }
        @keyframes slideOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(60px); }
        }
        .cards-enter-right { animation: slideInRight 0.35s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .cards-enter-left  { animation: slideInLeft  0.35s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .cards-exit-right  { animation: slideOutRight 0.35s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .cards-exit-left   { animation: slideOutLeft  0.35s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }

        .arrow-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
        }
        .arrow-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: #1e3d5a;
          transform: scale(0);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
          z-index: 0;
        }
        .arrow-btn:hover::after { transform: scale(1); }
        .arrow-btn svg { position: relative; z-index: 1; transition: color 0.2s, transform 0.2s; }
        .arrow-btn:hover svg { color: white; }
        .arrow-btn:hover .arrow-left  { transform: translateX(-2px); }
        .arrow-btn:hover .arrow-right { transform: translateX(2px); }
        .arrow-btn:active { transform: scale(0.92); }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3d5a] mb-4">
            What Our Users Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have made parking stress-free with PakiPark.
          </p>
        </div>

        {/* Reviews row with arrows */}
        <div className="flex items-center gap-4">

          {/* Left Arrow */}
          <button
            onClick={() => navigate("left")}
            className="arrow-btn flex-shrink-0 size-11 rounded-full border-2 border-[#1e3d5a] flex items-center justify-center text-[#1e3d5a]"
            aria-label="Previous reviews"
          >
            <ChevronLeft className="size-5 arrow-left" />
          </button>

          {/* Cards */}
          <div
            className={`flex-1 grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${
              animating
                ? direction === "right" ? "cards-exit-right" : "cards-exit-left"
                : direction === "right" ? "cards-enter-right" : "cards-enter-left"
            }`}
          >
            {reviews.map((review, index) => (
              <Card
                key={`${page}-${index}`}
                className="hover:shadow-xl transition-all duration-300 border-2 hover:border-[#ee6b20]/40 hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="size-12 bg-gradient-to-br from-[#ee6b20] to-[#1e3d5a] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                      {review.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-[#1e3d5a]">{review.name}</p>
                      <p className="text-sm text-gray-500">{review.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-[#ee6b20] text-[#ee6b20]" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{review.review}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => navigate("right")}
            className="arrow-btn flex-shrink-0 size-11 rounded-full border-2 border-[#1e3d5a] flex items-center justify-center text-[#1e3d5a]"
            aria-label="Next reviews"
          >
            <ChevronRight className="size-5 arrow-right" />
          </button>
        </div>

        {/* Page dots */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (animating || i === page) return;
                setDirection(i > page ? "right" : "left");
                setAnimating(true);
                setTimeout(() => { setPage(i); setAnimating(false); }, 350);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === page ? "w-8 bg-[#ee6b20]" : "w-2 bg-gray-200 hover:bg-gray-400"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
