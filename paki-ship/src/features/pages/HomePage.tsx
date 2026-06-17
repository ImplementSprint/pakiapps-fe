const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";
const deliveriesImg = "/assets/576bcd660f871c285c388837321e405bf2a0b0b6.png";
const driversImg = "/assets/9c13aea467c3b6e39e9382931105e41c9e0e2ac6.png";
const ratingImg = "/assets/97994521c2c8fcbd9d50b6a61cd5cc438970a9fb.png";
const happyCustomerImg = "https://i.postimg.cc/GtWVmyDM/happycustomer.png";
const fastDeliveryImg = "/assets/d2e9134ea709a169d1b2baf66e582d942c84865f.png";
const secureHandlingImg = "/assets/a01d4dbc7e240db533f1105cde2c01754f07262d.png";
const trackingImg = "/assets/d430a49d5212f028207438a16a8e0f80d7e55b9c.png";
const trustedDriversImg = "/assets/9ce6c9e6e39864a483fda84577b70379ffdd3996.png";
import { Link } from "react-router";
import { 
  Package, Truck, MapPin, Clock, Shield, 
  Smartphone, Zap, Star, Users, Briefcase, 
  CheckCircle, ArrowRight, Search, ClipboardCheck,
  TrendingUp, Award
} from "lucide-react";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#F0F9F8] font-sans text-[#1A5D56] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="PakiSHIP Logo" className="h-12" />
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-[#1A5D56] font-bold hover:text-[#39B5A8] transition-colors text-sm">Log In</Link>
              <Link to="/signup" className="bg-[#39B5A8] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#2D8F85] transition-all shadow-md active:scale-95">Register</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="pt-32 pb-6 px-8 md:px-16 relative overflow-hidden bg-[#F0F9F8]"
      >
        <video
          className="absolute object-cover"
          style={{
            inset: "-5rem",
            height: "calc(100% + 10rem)",
            width: "calc(100% + 10rem)",
            filter: "blur(26px) saturate(1.08)",
            transform: "scale(1.12)"
          }}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/assets/landing-hero-background.mp4" type="video/mp4" />
        </video>
        <video
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, transparent 70%, rgba(0, 0, 0, .38) 80%, black 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 70%, rgba(0, 0, 0, .38) 80%, black 100%)"
          }}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/assets/landing-hero-background.mp4" type="video/mp4" />
        </video>
        <video
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: "blur(18px) saturate(1.06)",
            transform: "scale(1.04)",
            maskImage: "linear-gradient(to right, black 0%, black 24%, rgba(0, 0, 0, .82) 30%, transparent 42%)",
            WebkitMaskImage: "linear-gradient(to right, black 0%, black 24%, rgba(0, 0, 0, .82) 30%, transparent 42%)"
          }}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/assets/landing-hero-background.mp4" type="video/mp4" />
        </video>
        <video
          className="absolute inset-0 h-full w-full object-contain"
          style={{
            objectPosition: "right center",
            maskImage: "radial-gradient(ellipse 24% 78% at 70% 51%, black 0%, black 58%, rgba(0, 0, 0, .55) 72%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 24% 78% at 70% 51%, black 0%, black 58%, rgba(0, 0, 0, .55) 72%, transparent 100%)"
          }}
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/assets/landing-hero-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-white/20 z-0" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-flex items-center bg-white/30 border border-white/40 px-4 py-2 rounded-full shadow-sm backdrop-blur-sm">
              <span className="text-[10px] font-bold text-[#041614] uppercase tracking-widest">Philippines' #1 Smart Logistics Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#041614] leading-[1.1]">Hatid Agad,<br /><span className="text-[#39B5A8]">Walang Abala.</span></h1>
            <p className="text-xl md:text-2xl font-bold text-[#041614] italic">Your Smart Shipping Starts Here!</p>
            <p className="text-[#041614] max-w-xl mx-auto lg:mx-0 leading-relaxed text-base font-medium opacity-80">Experience the future of logistics in the Philippines. Fast, reliable, and affordable delivery services powered by technology.</p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
              <Link to="/signup" className="bg-[#041614] text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-[#123E3A] transition-all shadow-lg active:scale-95">Book a Delivery</Link>
              <Link to="/signup" className="bg-white/30 border-2 border-[#041614] text-[#041614] px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/50 transition-all active:scale-95 backdrop-blur-sm">Start Shipping Now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-10 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {/* Added Statistics Title */}
          <div className="text-center mt-9 mb-5">
            <h2 className="text-4xl md:text-5xl font-black text-[#041614] mb-4">Our Journey</h2>
            <p className="text-[#1A5D56] text-lg font-medium tracking-tight opacity-70">Connecting the Philippines, one delivery at a time</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard 
            value="10K+" 
            label="Deliveries Completed"  
            img={deliveriesImg}
          />
          <StatCard 
            value="150+" 
            label="Active Drivers" 
            img={driversImg}
          />
          <StatCard 
            value="2K+" 
            label="Happy Customers" 
            img="https://i.postimg.cc/GtWVmyDM/happycustomer.png"
          />
          <StatCard 
            value="4.8" 
            label="Star Rating" 
            img={ratingImg}
          />
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-8 md:px-16 bg-[#F0F9F8]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#041614] mb-4">Choose Your Service</h2>
            <p className="text-[#1A5D56] text-lg font-medium tracking-tight opacity-70">Flexible delivery options for every need</p>
          </div>
          <div className="group grid lg:grid-cols-3 gap-8 items-stretch">
            <ServiceCard
              title="PakiShare"
              subtitle="Budget-friendly shared delivery"
              price="As low as ₱50"
              description="Perfect for everyday needs and non-urgent shipments"
              features={["Shared delivery route", "Same-day delivery", "Up to 5kg parcels"]}
              icon={<Package className="w-8 h-8 text-white" />}
              iconBg="bg-sky-500"
            />
            <ServiceCard
              title="PakiExpress"
              subtitle="Priority delivery for urgent shipments"
              price="As low as ₱150"
              description="Fast and dedicated delivery when time matters"
              features={["Direct delivery", "Within 2 hours", "Real-time tracking"]}
              icon={<Zap className="w-8 h-8 text-white" />}
              iconBg="bg-orange-500"
              isPopular={true}
            />
            <ServiceCard
              title="PakiBusiness"
              subtitle="Bulk solutions for businesses"
              price="Custom pricing"
              description="Customized logistics for your business needs"
              features={["Volume discounts", "Dedicated support", "API integration"]}
              icon={<Briefcase className="w-8 h-8 text-white" />}
              iconBg="bg-indigo-600"
            />
          </div>
        </div>
      </section>

      {/* Why Choose PakiShip Section */}
      <section className="py-20 px-8 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-25">
            <h2 className="text-4xl md:text-5xl font-black text-[#041614] mb-4">Why Choose PakiShip?</h2>
            <p className="text-[#1A5D56] text-lg font-medium tracking-tight opacity-70">Built with cutting-edge technology for seamless logistics</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard img={fastDeliveryImg} title="Fast Delivery" description="Same-day delivery for Metro Manila and nearby areas" />
            <FeatureCard img={secureHandlingImg} title="Secure Handling" description="Your items are protected with our delivery guarantee" />
            <FeatureCard img={trackingImg} title="Real-time Tracking" description="Track your parcels with live GPS updates" />
            <FeatureCard img={trustedDriversImg} title="Trusted Drivers" description="Background-checked and trained delivery partners" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-8 md:px-16 bg-[#F0F9F8]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-[#041614] mb-4">How It Works</h2>
            <p className="text-[#1A5D56] text-lg font-medium tracking-tight opacity-70">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 lg:gap-8">
            <StepCard number="1" title="Book Your Delivery" description="Enter pickup and delivery details through our easy-to-use platform" icon={<Smartphone className="w-8 h-8 text-blue-500" />} />
            <StepCard number="2" title="Track in Real-Time" description="Watch your parcel's journey with live GPS tracking" icon={<Search className="w-8 h-8 text-orange-500" />} />
            <StepCard number="3" title="Receive Safely" description="Get your package delivered safely with proof of delivery" icon={<CheckCircle className="w-8 h-8 text-emerald-500" />} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#041614] text-white py-5 px-8 md:px-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <p className="text-[#39B5A8]/50 text-[11px] font-bold uppercase tracking-[0.2em]">© 2026 PakiSHIP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ value, label, img }: any) {
  return (
    <div className="group relative p-10 transition-all duration-500 flex flex-col items-center">
      {/* --- BACKGROUND PORCELAIN EFFECT --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-[#39B5A8]/5 rounded-[4rem] opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 -z-10" />

      <div className="flex flex-col items-center w-full">
        
        {/* --- BIGGER DYNAMIC IMAGE CONTAINER --- */}
        {/* Increased size to w-64 h-64 (256px) for a more commanding presence */}
        <div className="relative w-64 h-64 mb-10 flex justify-center items-center">
          
          {/* Decorative Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#39B5A8]/20 group-hover:rotate-45 transition-transform duration-1000" />
          
          {/* The "Porthole" Glass Circle - Removed 'overflow-hidden' to allow the image to "lagpas" (break out) */}
          <div className="absolute inset-4 rounded-full bg-white shadow-inner border border-white z-10">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#39B5A8]/10 to-transparent opacity-50 rounded-full" />
          </div>

          {/* THE BIGGER IMAGE: Increased scale to 125% and higher translate on hover */}
          <div className="absolute inset-0 z-20 transform transition-all duration-500 ease-out group-hover:scale-125 group-hover:-translate-y-8">
            <img 
              src={img} 
              alt={label} 
              className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_30px_40px_rgba(57,181,168,0.4)]" 
            />
          </div>

          {/* Floating Badge Accent */}
          <div className="absolute right-2 top-4 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center rotate-12 group-hover:rotate-0 transition-all duration-500 z-30 border border-[#F0F9F8]">
            <div className="w-8 h-8 rounded-lg bg-[#F0F9F8] flex items-center justify-center">
               <div className="w-2 h-2 bg-[#39B5A8] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* --- TEXT CONTENT --- */}
        <div className="flex flex-col items-center text-center gap-0 relative">
          <h3 className="text-5xl font-[800] text-[#041614] tracking-tighter leading-none transition-all duration-500 group-hover:text-[#39B5A8]">
            {value}
          </h3>
          
          <div className="mt-4 flex flex-col items-center">
             <p className="text-[12px] font-black text-[#1A5D56]/60 uppercase tracking-[0.3em] mb-2">
              {label}
            </p>
            <div className="h-1 w-12 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-0 group-hover:w-full bg-[#39B5A8] transition-all duration-700 ease-in-out" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ title, subtitle, price, description, features, icon, iconBg, isPopular = false }: any) {
  return (
    <div className={`relative p-10 rounded-[2.5rem] flex flex-col transition-all duration-300 cursor-default
      group-hover:opacity-50 hover:!opacity-100 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#39B5A8]/15 hover:border-[#39B5A8] hover:border-[3px]
      ${isPopular
        ? "bg-white border-[3px] border-[#39B5A8] shadow-2xl shadow-[#39B5A8]/10 scale-105 z-10"
        : "bg-white border border-[#39B5A8]/10 shadow-xl shadow-[#39B5A8]/5"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#39B5A8] text-white px-6 py-1.5 rounded-full flex items-center gap-2 shadow-lg whitespace-nowrap">
          <Star className="w-3 h-3 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest">Most Popular</span>
        </div>
      )}
      <div className={`${iconBg} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg`}>{icon}</div>
      <h3 className="text-2xl font-black text-[#041614] mb-1">{title}</h3>
      <p className="text-[11px] font-bold text-[#39B5A8] uppercase tracking-wide mb-4">{subtitle}</p>
      <p className="text-[#1A5D56]/70 text-sm leading-relaxed mb-6 font-medium">{description}</p>
      <div className="text-3xl font-black text-[#39B5A8] mb-8">{price}</div>
      <ul className="space-y-4 mt-auto">
        {features.map((f: string) => (
          <li key={f} className="flex items-center gap-3 text-sm font-semibold text-[#1A5D56]/80">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureCard({ img, title, description }: any) {
  return (
    <div className="relative p-10 pt-32 bg-white rounded-[2.5rem] flex flex-col items-center text-center shadow-xl shadow-[#39B5A8]/5 border border-[#39B5A8]/10 hover:shadow-2xl transition-all duration-300 overflow-visible">
      {/* Image that overflows/breaks out of the box */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-44 h-44 transition-transform duration-300 hover:scale-110 hover:-translate-y-2">
        <img 
          src={img} 
          alt={title} 
          className="w-full h-full object-contain drop-shadow-2xl"
        />
      </div>
      <h4 className="text-2xl font-black text-[#041614] mb-3">{title}</h4>
      <p className="text-[#1A5D56]/70 text-[15px] leading-relaxed font-medium">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description, icon }: any) {
  return (
    <div className="relative pt-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#39B5A8] text-white rounded-full flex items-center justify-center text-2xl font-black border-8 border-[#F0F9F8] shadow-lg z-20">{number}</div>
      <div className="bg-white p-10 pt-16 rounded-[2.5rem] shadow-xl shadow-[#39B5A8]/5 border border-[#39B5A8]/10 flex flex-col items-center text-center relative z-10 h-full hover:shadow-2xl transition-all duration-300">
        <div className="w-20 h-20 bg-[#F0F9F8] rounded-[1.5rem] flex items-center justify-center mb-8">{icon}</div>
        <h4 className="text-2xl font-black text-[#041614] mb-4">{title}</h4>
        <p className="text-[#1A5D56]/70 text-base leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}
