'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronDown, Search, ArrowLeft, MessageCircle, HelpCircle, Car, CreditCard, Clock, Shield, Star } from 'lucide-react';

const LOGO_SRC = '/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png';

// ── FAQ Data ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'booking',
    label: 'Booking',
    icon: Car,
    color: '#1e3d5a',
    bg: '#f0f4f8',
    faqs: [
      {
        q: 'How do I make a parking reservation?',
        a: "Log in to your PakiPark account, navigate to 'Find Parking', choose your preferred location and time slot, select your vehicle, then confirm the reservation. You'll receive an in-app notification and email confirmation with your booking reference.",
      },
      {
        q: 'Can I cancel or modify my reservation?',
        a: 'You can cancel an upcoming reservation from the My Bookings section before the reservation start time. Once the grace period begins (15 minutes before the slot) or the slot has started, cancellation is no longer available.',
      },
      {
        q: 'What is the 15-minute grace period?',
        a: 'You have a 15-minute window before your reserved time slot to check in. If you do not check in within this window, your reservation will be automatically forfeited and the spot will be released for other customers.',
      },
      {
        q: 'How far in advance can I book?',
        a: 'You can make reservations for any available slot up to 7 days in advance. Same-day reservations are also accepted, subject to availability.',
      },
      {
        q: 'What is the booking reference / QR code for?',
        a: "Your booking reference (e.g. PKP-00000001) and QR code are used by our tellers at check-in to quickly locate your reservation. Keep it accessible on your phone when you arrive at the parking facility.",
      },
    ],
  },
  {
    id: 'payment',
    label: 'Payments',
    icon: CreditCard,
    color: '#059669',
    bg: '#f0fdf4',
    faqs: [
      {
        q: 'How much does parking cost?',
        a: `The first 2 hours of every session are FREE. Overtime is billed at ₱15 per hour, rounded up to the next full hour (ceiling billing). Customers with an approved PWD or Senior Citizen discount receive 20% off all applicable charges.`,
      },
      {
        q: 'How is overtime calculated?',
        a: 'Overtime starts after the free 2-hour window. Each additional hour (or fraction thereof) is billed as one full hour at ₱15. For example, 2 hours 30 minutes of parking is billed as 1 overtime hour = ₱15.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'Payment is processed at check-out via the teller terminal. Cash payments are currently the standard method. GCash and PayMaya integration is under development and will be available soon.',
      },
      {
        q: 'Can I get a receipt?',
        a: 'A digital receipt summary is shown at the time of check-out through the teller terminal. Email receipts are a planned feature coming in a future update.',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    icon: Shield,
    color: '#7c3aed',
    bg: '#f5f3ff',
    faqs: [
      {
        q: 'How do I become a verified customer?',
        a: 'Your account is automatically verified once you fill in a valid Philippine mobile number (+63 format), your date of birth, and a home address in your profile. Verified accounts display a blue checkmark badge.',
      },
      {
        q: 'How do I apply for a PWD or Senior Citizen discount?',
        a: "Go to your Profile page and locate the 'Special Discount' section. Upload a clear photo of your PWD ID or Senior Citizen ID. An admin will review your request. Once approved, your account will receive a permanent 20% discount on all future parking charges.",
      },
      {
        q: 'How do I enable Two-Factor Authentication (2FA)?',
        a: "In your Profile → Security section, click 'Enable 2FA'. Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code to confirm. 2FA will be required for every future login.",
      },
      {
        q: 'What happens if I delete my account?',
        a: 'Account deletion is a soft-delete — your data is marked for removal and you are immediately logged out. You will no longer be able to log in. If you believe this was a mistake, contact our support team within 30 days.',
      },
      {
        q: 'How do I change my password?',
        a: "Go to Profile → Security and click 'Change Password'. Enter your current password, then your new password twice to confirm. The new password must be at least 8 characters long.",
      },
    ],
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    icon: Car,
    color: '#d97706',
    bg: '#fffbeb',
    faqs: [
      {
        q: 'How do I add a vehicle to my account?',
        a: "Navigate to the 'My Vehicles' page from the customer home. Click '+ Add New', fill in the vehicle type, brand, model, plate number, and color. Optionally upload the OR/CR documents. Save — your vehicle will be immediately available for bookings.",
      },
      {
        q: 'Can I have multiple vehicles? Which is used for bookings?',
        a: "Yes, you can add multiple vehicles. The one marked as Default (shown with a ⭐ star) is pre-selected when making a new reservation. You can change the default at any time by clicking the star icon next to any vehicle in your list.",
      },
      {
        q: 'Can I remove a vehicle?',
        a: 'Yes. On the Vehicles page, select a vehicle and click the trash icon to delete it. You must always have at least one vehicle on your account, so the last remaining vehicle cannot be deleted.',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Clock,
    color: '#ee6b20',
    bg: '#fff7ed',
    faqs: [
      {
        q: 'What are the parking facility operating hours?',
        a: 'Operating hours are set per location and can vary by day of the week. You can see the current hours for each location on the Find Parking page. Standard hours are 6:00 AM – 11:00 PM daily, but specific facilities may differ.',
      },
      {
        q: 'What if I arrive before the facility opens?',
        a: 'Check-in is only available during facility operating hours and within your reserved time slot. Arriving before opening time will not allow you to check in, but your reservation will still be valid once the facility opens.',
      },
      {
        q: 'What happens if no teller is available for check-in?',
        a: "Contact the facility directly or use the PakiPark in-app support. Your check-in time will be logged by the teller system and the grace period applies from your booking start time, not your physical arrival time.",
      },
    ],
  },
];

// ── Accordion Item ─────────────────────────────────────────────────────────────
function FaqItem({ q, a, accentColor }: { q: string; a: string; accentColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${open ? 'border-transparent shadow-lg bg-white ring-1 ring-black/5' : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md'
        }`}
    >
      <button
        className="w-full flex items-start justify-between gap-4 p-5 text-left group"
        onClick={() => setOpen(o => !o)}
      >
        <span className={`font-bold text-sm leading-relaxed flex-1 transition-colors ${open ? 'text-[#ee6b20]' : 'text-[#1e3d5a] group-hover:text-[#1e3d5a]/80'}`}>{q}</span>
        <div
          className={`size-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${open ? 'bg-[#ee6b20]/10' : 'bg-gray-100 group-hover:bg-gray-200'}`}
        >
          <ChevronDown
            className={`size-4 transition-transform duration-300`}
            style={{ color: open ? '#ee6b20' : '#9ca3af', transform: open ? 'rotate(180deg)' : undefined }}
          />
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="h-px bg-gradient-to-r from-gray-100 via-gray-200 to-transparent mb-4" />
          <p className="text-sm text-gray-600 leading-relaxed pr-8">{a}</p>
        </div>
      )}
    </div>
  );
}

// ── Main FAQ Page ──────────────────────────────────────────────────────────────
export default function FAQPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = CATEGORIES.flatMap(cat =>
    cat.faqs
      .filter(f =>
        (!query || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()))
        && (activeCategory === 'all' || cat.id === activeCategory)
      )
      .map(f => ({ ...f, cat }))
  );

  return (
    <div className="min-h-screen bg-[#f4f7fa]">
      <style>{`
        @keyframes mascotIdeaFloat {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
      `}</style>
      {/* Header */}
      <header className="bg-gradient-to-b from-[#1e3d5a] to-[#2a5373] text-white relative overflow-hidden shadow-lg border-b border-white/10">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#ee6b20]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm bg-white/10 border border-white/10 shadow-sm">
              <ArrowLeft className="size-5" />
            </button>
            <Image src={LOGO_SRC} alt="PakiPark" width={110} height={30} className="h-8 object-contain brightness-0 invert drop-shadow-md" unoptimized />
          </div>
          <div className="flex items-center gap-2 text-white/90 bg-white/10 px-4 py-2.5 rounded-full backdrop-blur-sm border border-white/10 shadow-sm">
            <HelpCircle className="size-4" />
            <span className="font-bold text-sm tracking-wide">Help Center</span>
          </div>
        </div>

        {/* Hero */}
        <div className="max-w-5xl mx-auto px-6 pb-12 pt-4 text-center relative z-20">
          {/* Animated Mascot Idea on Top Left */}
          <div 
            className="hidden lg:block absolute left-0 xl:-left-12 -top-6 w-56 h-56 xl:w-64 xl:h-64 pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-30" 
            style={{ animation: 'mascotIdeaFloat 4.5s ease-in-out infinite' }}
          >
            <img 
              src="/assets/mascot-idea.png" 
              alt="Mascot with a question" 
              className="w-full h-full object-contain" 
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight drop-shadow-sm">Frequently Asked Questions</h1>
          <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto">Find answers to common questions about PakiPark reservations, payments, and account management.</p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search questions…"
              className="w-full h-13 py-4 pl-12 pr-4 rounded-2xl text-[#1e3d5a] font-medium text-sm outline-none shadow-lg focus:ring-2 focus:ring-[#ee6b20]/40"
            />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Category filter pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${activeCategory === 'all'
              ? 'bg-[#1e3d5a] text-white border-[#1e3d5a] shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#1e3d5a]/40'
              }`}
          >
            All Topics
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-1.5 ${activeCategory === cat.id
                ? 'text-white border-transparent shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              style={activeCategory === cat.id ? { background: cat.color, borderColor: cat.color } : {}}
            >
              <cat.icon className="size-3.5" /> {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ sections */}
        {query || activeCategory !== 'all' ? (
          /* Search / filtered results */
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                <HelpCircle className="size-12 text-gray-200 mx-auto mb-4" />
                <p className="font-bold text-gray-500">No questions found</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term or browse all topics</p>
                <button onClick={() => { setQuery(''); setActiveCategory('all'); }}
                  className="mt-4 px-5 py-2 bg-[#1e3d5a] text-white text-sm font-bold rounded-xl hover:bg-[#2a5373] transition-colors">
                  Clear filter
                </button>
              </div>
            ) : filtered.map((f, i) => (
              <div key={i}>
                {i === 0 || filtered[i - 1].cat.id !== f.cat.id ? (
                  <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
                    <div className="size-6 rounded-lg flex items-center justify-center" style={{ background: f.cat.bg }}>
                      <f.cat.icon className="size-3.5" style={{ color: f.cat.color }} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: f.cat.color }}>{f.cat.label}</span>
                  </div>
                ) : null}
                <FaqItem q={f.q} a={f.a} accentColor={f.cat.color} />
              </div>
            ))}
          </div>
        ) : (
          /* Full category sections */
          <div className="space-y-10">
            {CATEGORIES.map(cat => (
              <section key={cat.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-10 rounded-2xl flex items-center justify-center" style={{ background: cat.bg }}>
                    <cat.icon className="size-5" style={{ color: cat.color }} />
                  </div>
                  <h2 className="text-lg font-black text-[#1e3d5a]">{cat.label}</h2>
                  <span className="text-xs font-bold text-gray-400 ml-1">({cat.faqs.length})</span>
                </div>
                <div className="space-y-3">
                  {cat.faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} accentColor={cat.color} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Still need help CTA */}
        <div className="bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 text-white relative overflow-visible mt-24 shadow-2xl">

          {/* Popping Mascot Image - Reduced size here */}
          <div className="hidden md:block absolute bottom-0 left-8 w-48 h-48 lg:w-56 lg:h-56 z-10 pointer-events-none drop-shadow-2xl">
            <img
              src="/assets/mascot-transparent.png"
              alt="PakiPark Mascot"
              className="w-full h-full object-contain object-bottom"
            />
          </div>

          {/* Adjusted padding to match the smaller mascot */}
          <div className="md:pl-56 lg:pl-64 text-center md:text-left flex-1 relative z-20">
            <h3 className="font-black text-2xl mb-2">Still have questions?</h3>
            <p className="text-white/80 text-sm max-w-md">Our support team is available during operating hours. You can also reach us via the contact details at the bottom of the home page.</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="shrink-0 px-8 py-3.5 bg-[#ee6b20] hover:bg-[#d95a10] text-white font-bold rounded-xl transition-all shadow-xl hover:shadow-[#ee6b20]/30 hover:-translate-y-0.5 relative z-20"
          >
            Contact Us
          </button>
        </div>
      </main>
    </div>
  );
}