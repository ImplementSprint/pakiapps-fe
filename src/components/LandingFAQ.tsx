"use client";

import { useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { useRouter } from "next/navigation";
import { HelpCircle } from "lucide-react";

const FAQ_DATA = [
  {
    category: "Driver",
    items: [
      {
        q: "How do I make a parking reservation?",
        a: "Log in to your PakiPark account, navigate to 'Find Parking', choose your preferred location and time slot, select your vehicle, then confirm the reservation.",
      },
      {
        q: "How much does parking cost?",
        a: "The first 2 hours of every session are FREE. Overtime is billed at ₱15 per hour, rounded up to the next full hour (ceiling billing).",
      },
      {
        q: "Can I cancel or modify my reservation?",
        a: "You can cancel an upcoming reservation from the My Bookings section before the reservation start time. Once the grace period begins, cancellation is no longer available.",
      },
      {
        q: "What payment methods are accepted?",
        a: "Payment is processed at check-out via the teller terminal. Cash payments are currently the standard method.",
      },
      {
        q: "What is the 15-minute grace period?",
        a: "You have a 15-minute window before your reserved time slot to check in. If you do not check in, your reservation will be automatically forfeited.",
      },
    ],
  },
  {
    category: "Operator",
    items: [
      {
        q: "How do I manage incoming reservations?",
        a: "As an admin, you can view real-time reservation statuses, check-in customers, and process check-outs through the Smart Parking Dashboard.",
      },
      {
        q: "How do I update facility hours?",
        a: "Administrators can configure the operating hours for each specific location in the 'Advanced Parking Layout Config', setting separate schedules for each day of the week.",
      },
      {
        q: "How do I handle a no-show customer?",
        a: "If a customer doesn't arrive within the 15-minute grace period after their reservation starts, the system will automatically mark them as 'no-show' and free up the slot.",
      },
      {
        q: "Is there an audit log of transactions?",
        a: "Yes, all successful payments, check-ins, and check-outs are recorded permanently in the Transaction and Activity Logs for security and dispute resolution.",
      },
      {
        q: "Can I add custom parking slots?",
        a: "Yes, you can add VIP, PWD, or Standard slots, assign them to specific floors and rows, and toggle their active status via the configuration dashboard.",
      },
    ],
  },
];

export function LandingFAQ() {
  const [activeTab, setActiveTab] = useState<"Driver" | "Operator">("Driver");
  const router = useRouter();

  const activeQuestions = FAQ_DATA.find((d) => d.category === activeTab)?.items || [];

  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-[#1e3d5a] to-[#152a40] text-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#ee6b20]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Text & Tabs */}
          <div className="lg:col-span-5 flex flex-col relative h-full justify-center">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-white leading-tight">
              Got Questions? <br className="hidden lg:block" />
              <span className="text-[#ee6b20]">We've got answers.</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-md">
              Everything you need to know about parking with PakiPark. Can't find the answer you're looking for? Check out our full help center.
            </p>

            {/* Toggle Pills */}
            <div className="flex bg-[#2a5373]/80 p-1.5 rounded-full self-start mb-8 shadow-inner border border-white/5 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("Driver")}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === "Driver"
                  ? "bg-white text-[#1e3d5a] shadow-md"
                  : "text-white/70 hover:text-white"
                  }`}
              >
                For Drivers
              </button>
              <button
                onClick={() => setActiveTab("Operator")}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === "Operator"
                  ? "bg-white text-[#1e3d5a] shadow-md"
                  : "text-white/70 hover:text-white"
                  }`}
              >
                For Operators
              </button>
            </div>

            <button
              onClick={() => router.push('/help')}
              className="group flex items-center gap-2 text-[#ee6b20] font-bold text-sm bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl w-max transition-all border border-[#ee6b20]/20"
            >
              <HelpCircle className="size-5" />
              Visit full Help Center
            </button>

            {/* Mobile Mascot Image */}
            <div className="lg:hidden mt-8 flex justify-center pointer-events-none drop-shadow-2xl">
              <img
                src="/assets/mascot-transparent.png"
                alt="PakiPark Mascot"
                className="w-72 h-72 object-contain"
              />
            </div>
          </div>

          {/* Right Column: Accordion */}
          <div className="lg:col-span-7 relative z-30">

            {/* Desktop Mascot Image (Floating near FAQ) - Adjusted smaller and lower */}
            <div className="hidden lg:block absolute -bottom-24 -left-48 lg:-left-60 xl:-left-72 w-[320px] h-[320px] z-40 pointer-events-none drop-shadow-2xl">
              <img
                src="/assets/mascot-transparent.png"
                alt="PakiPark Mascot"
                className="w-full h-full object-contain drop-shadow-[-10px_10px_30px_rgba(0,0,0,0.5)]"
              />
            </div>

            <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl backdrop-blur-md shadow-2xl relative z-30">
              <Accordion type="single" collapsible className="w-full space-y-3">
                {activeQuestions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border border-white/10 bg-[#2a5373]/30 rounded-2xl overflow-hidden data-[state=open]:bg-[#2a5373]/60 transition-colors"
                  >
                    <AccordionTrigger className="text-left font-bold text-white hover:text-[#ee6b20] hover:no-underline px-6 py-5 group transition-colors data-[state=open]:text-[#ee6b20]">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-white/70 leading-relaxed px-6 pb-6 text-sm">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}