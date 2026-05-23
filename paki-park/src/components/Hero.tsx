"use client";
import { useState } from "react";
import { Button } from "./ui/button";
import { ArrowRight, MapPin, Clock, Shield } from "lucide-react";

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M3,20.5v-17c0-0.83,0.94-1.3,1.6-0.8l14,8.5c0.6,0.36,0.6,1.24,0,1.6l-14,8.5C3.94,21.8,3,21.33,3,20.5z"/>
    </svg>
  );
}

export function Hero() {
  const [videoEnded, setVideoEnded] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-screen flex items-center overflow-hidden">

      {/* Static Background Image (revealed when video ends) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/hero-bg-empty.jpg')" }}
      />

      {/* Background Video */}
      <video
        autoPlay
        muted
        playsInline
        onEnded={() => setVideoEnded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${videoEnded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        poster="/assets/hero-bg-empty.jpg"
      >
        <source src="/assets/video-pakipark.mp4" type="video/mp4" />
      </video>
      {/* Subtle dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-18 w-full">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Left Content */}
          <div className="flex flex-col space-y-4 pt-20">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
                Tap. Reserve. <br />
                <span className="text-white/90">Convenience in Every Spot!</span>
              </h1>

              <p className="text-sm md:text-base text-white/70 max-w-md leading-relaxed">
                PakiPark makes parking hassle-free. Reserve your spot in advance,
                pay securely, and never worry about finding parking again.
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                {/* Column 1 */}
                <div className="flex flex-col gap-2">
                  {/* Get Started Now — orange gradient glow */}
                  <button
                    onClick={() => scrollToSection("contact")}
                    className="group relative inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white overflow-hidden shadow-[0_0_24px_rgba(238,107,32,0.55)] hover:shadow-[0_0_36px_rgba(238,107,32,0.8)] transition-all duration-300"
                    style={{ background: "linear-gradient(135deg, #ee6b20 0%, #f59e0b 100%)" }}
                  >
                    <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                    Get Started Now
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>

                  {/* App Store */}
                  <a
                    href="#"
                    className="group inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/25 text-white px-5 py-2.5 hover:bg-white/20 hover:border-white/45 transition-all duration-300 backdrop-blur-md shadow-lg"
                  >
                    <AppleLogo />
                    <span className="flex flex-col leading-none">
                      <span className="text-[9px] text-white/50 uppercase tracking-widest">Download on the</span>
                      <span className="text-sm font-bold tracking-tight">App Store</span>
                    </span>
                  </a>
                </div>

                {/* Column 2 */}
                <div className="flex flex-col gap-2">
                  {/* Learn More — ghost with orange dot */}
                  <button
                    onClick={() => scrollToSection("features")}
                    className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white border border-white/30 bg-white/5 backdrop-blur-sm hover:bg-white/15 hover:border-white/50 transition-all duration-300"
                  >
                    <span className="size-2 rounded-full bg-[#ee6b20] group-hover:scale-125 transition-transform duration-300 shrink-0" />
                    Learn More
                  </button>

                  {/* Google Play */}
                  <a
                    href="#"
                    className="group inline-flex items-center gap-3 rounded-2xl bg-white/10 border border-white/25 text-white px-5 py-2.5 hover:bg-white/20 hover:border-white/45 transition-all duration-300 backdrop-blur-md shadow-lg"
                  >
                    <PlayLogo />
                    <span className="flex flex-col leading-none">
                      <span className="text-[9px] text-white/50 uppercase tracking-widest">Get it on</span>
                      <span className="text-sm font-bold tracking-tight">Google Play</span>
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/10 max-w-sm">
              <div className="space-y-1 text-center">
                <MapPin className="size-5 text-[#ee6b20] mx-auto mb-1" />
                <p className="text-xl font-bold text-white">500+</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Locations</p>
              </div>
              <div className="space-y-1 text-center">
                <Clock className="size-5 text-[#ee6b20] mx-auto mb-1" />
                <p className="text-xl font-bold text-white">24/7</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Available</p>
              </div>
              <div className="space-y-1 text-center">
                <Shield className="size-5 text-[#ee6b20] mx-auto mb-1" />
                <p className="text-xl font-bold text-white">100%</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Secure</p>
              </div>
            </div>
          </div>

          {/* Right Illustration (Appears after video ends) */}
          <div className={`relative hidden md:flex items-center justify-center lg:justify-end pt-40 transition-opacity duration-1000 ease-in-out ${videoEnded ? 'opacity-100' : 'opacity-0'}`}>
            <div className="relative w-full max-w-xs lg:max-w-md">
              {/* Pulsing glow behind mascot */}
              <div
                className="absolute inset-0 bg-[#ee6b20]/20 rounded-full blur-[80px]"
                style={{ animation: 'mascotGlow 3s ease-in-out infinite' }}
              />
              {/* Mascot with float + sway animation */}
              <img
                src="https://i.imgur.com/hcqFGkM.png"
                alt="PakiPark Illustration"
                className="relative w-full h-auto drop-shadow-2xl z-10"
                style={{
                  animation: 'mascotFloat 3.5s ease-in-out infinite, mascotSway 6s ease-in-out infinite',
                  transformOrigin: 'bottom center',
                }}
              />
            </div>
          </div>

          <style>{`
            @keyframes mascotFloat {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              25%       { transform: translateY(-12px) rotate(0.8deg); }
              75%       { transform: translateY(-6px) rotate(-0.5deg); }
            }
            @keyframes mascotSway {
              0%, 100% { transform: translateX(0px); }
              30%       { transform: translateX(6px); }
              70%       { transform: translateX(-4px); }
            }
            @keyframes mascotGlow {
              0%, 100% { opacity: 0.25; transform: scale(1); }
              50%       { opacity: 0.55; transform: scale(1.08); }
            }
          `}</style>

        </div>
      </div>
    </section>
  );
}
