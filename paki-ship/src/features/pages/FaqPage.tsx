import type React from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  BadgeHelp,
  Bell,
  CircleDollarSign,
  Clock,
  MapPin,
  Package,
  Route,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

type FaqRole = "customer" | "driver" | "operator";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSection = {
  title: string;
  icon: React.ReactNode;
  items: FaqItem[];
};

const roleContent: Record<
  FaqRole,
  {
    title: string;
    eyebrow: string;
    description: string;
    homePath: string;
    sections: FaqSection[];
  }
> = {
  customer: {
    title: "Sender FAQ",
    eyebrow: "Customer Help",
    description: "Quick answers for booking parcels, tracking deliveries, payments, and account support.",
    homePath: "/customer/home",
    sections: [
      {
        title: "Booking Parcels",
        icon: <Package className="w-5 h-5" />,
        items: [
          {
            question: "How do I know if my booking was created successfully?",
            answer:
              "After confirming the parcel details, the app shows a booking confirmation with your tracking number and next steps. You can also find the parcel in your history.",
          },
          {
            question: "Can I review my parcel details before paying?",
            answer:
              "Yes. The confirmation modal shows sender and receiver contacts, parcel type, size, price, delivery service, and drop-off location before the booking is finalized.",
          },
          {
            question: "What is the difference between urgent and relay delivery?",
            answer:
              "Urgent delivery is handled directly for faster movement. Relay delivery uses a drop-off point and gives you instructions for when and where to bring the parcel.",
          },
        ],
      },
      {
        title: "Tracking & Updates",
        icon: <Route className="w-5 h-5" />,
        items: [
          {
            question: "Where can I see my parcel status?",
            answer:
              "Open Track Package or your delivery history. Status updates are shown as the parcel moves from booking to pickup, transit, and completion.",
          },
          {
            question: "Will I receive notifications?",
            answer:
              "Yes, in-app notifications keep you updated when the parcel status changes. You can manage email and SMS preferences in Settings.",
          },
          {
            question: "Can I rate the driver after delivery?",
            answer:
              "Completed deliveries can be rated from the review page. Your rating helps keep driver performance data accurate.",
          },
        ],
      },
      {
        title: "Payments",
        icon: <CircleDollarSign className="w-5 h-5" />,
        items: [
          {
            question: "Which payment methods are supported?",
            answer:
              "Depending on the service, you can use cash options or online checkout methods such as GCash, Maya, and bank transfer through the payment gateway.",
          },
          {
            question: "What happens if online payment is cancelled?",
            answer:
              "If checkout is cancelled, return to the booking page and choose another method or try again. The booking will not be treated as paid until payment succeeds.",
          },
        ],
      },
    ],
  },
  driver: {
    title: "Driver FAQ",
    eyebrow: "Driver Help",
    description: "Answers about jobs, delivery status updates, documents, earnings, and mobile-only actions.",
    homePath: "/driver/home",
    sections: [
      {
        title: "Jobs",
        icon: <Truck className="w-5 h-5" />,
        items: [
          {
            question: "Why can I view jobs on web but not accept them?",
            answer:
              "Job acceptance is only available in the mobile app. The web dashboard lets you monitor availability and view details, while mobile handles live acceptance.",
          },
          {
            question: "Can I view the full details before accepting?",
            answer:
              "Yes. Job details include pickup and delivery areas, parcel information, expected earnings, and customer instructions when available.",
          },
          {
            question: "How often does the jobs list refresh?",
            answer:
              "The dashboard checks for new jobs regularly. You can also press Refresh when you want to manually pull the latest job list.",
          },
        ],
      },
      {
        title: "Delivery Progress",
        icon: <MapPin className="w-5 h-5" />,
        items: [
          {
            question: "How do I update a delivery status?",
            answer:
              "Open the active job and use the update status screen. Status changes notify customers and operators about your delivery progress.",
          },
          {
            question: "Where does my rating come from?",
            answer:
              "Your profile rating is calculated from actual customer reviews after completed deliveries, not from a fixed display value.",
          },
        ],
      },
      {
        title: "Account & Documents",
        icon: <ShieldCheck className="w-5 h-5" />,
        items: [
          {
            question: "Why do I need to upload documents?",
            answer:
              "Documents help verify your identity and vehicle eligibility. Uploaded files are saved for review and linked to your account verification status.",
          },
          {
            question: "Can I update my vehicle information?",
            answer:
              "Yes. Use your driver profile to keep your vehicle type, license number, and contact details accurate.",
          },
        ],
      },
    ],
  },
  operator: {
    title: "Operator FAQ",
    eyebrow: "Drop-off Point Help",
    description: "Help for managing relay parcels, hub information, QR receiving, alerts, and operator account settings.",
    homePath: "/operator/home",
    sections: [
      {
        title: "Relay Parcels",
        icon: <Package className="w-5 h-5" />,
        items: [
          {
            question: "How do I know when a relay parcel is assigned to my hub?",
            answer:
              "New relay bookings assigned to your drop-off point appear in the operator dashboard and can trigger alerts based on your notification settings.",
          },
          {
            question: "What is the QR generator for?",
            answer:
              "Relay Economy parcel IDs are converted into QR codes so operators can scan or verify incoming parcels more quickly at the drop-off point.",
          },
          {
            question: "Can I update parcel receiving status?",
            answer:
              "Yes. Use the receive parcel workflow to mark parcels as received, stored, or dispatched according to the current hub process.",
          },
        ],
      },
      {
        title: "Hub Profile",
        icon: <MapPin className="w-5 h-5" />,
        items: [
          {
            question: "Why should my drop-off point details stay updated?",
            answer:
              "Customers rely on your address, operating hours, and capacity information when choosing where to drop off relay parcels.",
          },
          {
            question: "What does geofence status affect?",
            answer:
              "Geofence status helps the platform validate hub availability and route parcel workflows around active drop-off locations.",
          },
        ],
      },
      {
        title: "Earnings & Alerts",
        icon: <Bell className="w-5 h-5" />,
        items: [
          {
            question: "Where do operator earnings come from?",
            answer:
              "Operator earnings are based on parcel hub records and incentive rules tracked by the platform for handled relay parcels.",
          },
          {
            question: "Can I control notification preferences?",
            answer:
              "Yes. Operator Settings lets you manage parcel alerts, email notifications, SMS alerts, and account security options.",
          },
        ],
      },
    ],
  },
};

function FaqPage({ role }: { role: FaqRole }) {
  const navigate = useNavigate();
  const content = roleContent[role];

  return (
    <div className="min-h-screen bg-[#F0F9F8] font-sans pb-12">
      <header className="h-20 bg-white border-b border-[#39B5A8]/10 sticky top-0 z-50 shadow-sm flex items-center justify-between px-6 md:px-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#39B5A8] font-bold text-sm hover:bg-[#39B5A8]/10 px-3 py-2 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-xl font-black text-[#041614]">FAQ</h1>
        </div>

        <img src={logoImg} alt="PakiSHIP" className="h-9" />
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <section className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-[#39B5A8]/10 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[#F0F9F8] rounded-2xl flex items-center justify-center text-[#39B5A8] shrink-0">
                <BadgeHelp className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#39B5A8] mb-2">
                  {content.eyebrow}
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-[#041614] tracking-normal">
                  {content.title}
                </h2>
                <p className="text-[#5f706e] font-semibold mt-3 max-w-2xl leading-relaxed">
                  {content.description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(content.homePath)}
              className="bg-[#041614] text-white rounded-2xl px-5 py-3 font-black hover:bg-[#1A5D56] transition-colors"
            >
              Dashboard
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="bg-white rounded-[2rem] p-5 border border-[#39B5A8]/10 shadow-sm h-fit">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8fa1b7] px-3 mb-3">
              Topics
            </p>
            <div className="space-y-2">
              {content.sections.map((section) => (
                <a
                  key={section.title}
                  href={`#${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-[#1A5D56] hover:bg-[#F0F9F8] transition-colors font-bold"
                >
                  <span className="w-9 h-9 bg-[#F0F9F8] rounded-xl flex items-center justify-center text-[#39B5A8]">
                    {section.icon}
                  </span>
                  {section.title}
                </a>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            {content.sections.map((section) => (
              <section
                key={section.title}
                id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-[#39B5A8]/10 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-[#F0F9F8] rounded-xl flex items-center justify-center text-[#39B5A8]">
                    {section.icon}
                  </div>
                  <h3 className="text-2xl font-black text-[#041614]">{section.title}</h3>
                </div>

                <div className="space-y-3">
                  {section.items.map((item) => (
                    <article
                      key={item.question}
                      className="rounded-2xl border border-[#39B5A8]/10 bg-white p-5"
                    >
                      <h4 className="font-black text-[#1A5D56] leading-snug">
                        {item.question}
                      </h4>
                      <div className="mt-4 rounded-xl bg-[#F0F9F8] px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8] mb-1">
                          Answer
                        </p>
                        <p
                          className="text-sm md:text-base font-semibold leading-relaxed"
                          style={{
                            color: "#46566b",
                            display: "block",
                            opacity: 1,
                            visibility: "visible",
                          }}
                        >
                        {item.answer}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            <section className="bg-[#041614] text-white rounded-[2rem] p-6 md:p-7 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <UserRound className="w-6 h-6 text-[#39B5A8] mt-1" />
                  <div>
                    <h3 className="text-xl font-black">Need account-specific help?</h3>
                    <p className="text-white/70 font-semibold mt-1">
                      Check your settings and profile details first, then contact support if the issue is tied to a live booking.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/${role}/settings`)}
                  className="bg-white text-[#041614] rounded-2xl px-5 py-3 font-black hover:bg-[#F0F9F8] transition-colors"
                >
                  Open Settings
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export function CustomerFaqPage() {
  return <FaqPage role="customer" />;
}

export function DriverFaqPage() {
  return <FaqPage role="driver" />;
}

export function OperatorFaqPage() {
  return <FaqPage role="operator" />;
}
