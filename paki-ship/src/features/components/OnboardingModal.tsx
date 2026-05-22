import { useState } from "react";
import { X, Package, MapPin, CreditCard, CheckCircle } from "lucide-react";

interface OnboardingModalProps {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <MapPin className="w-12 h-12 text-[#39B5A8]" />,
      title: "Choose Your Locations",
      description: "Select where we'll pick up and deliver your parcel. You can search or pin exact addresses.",
    },
    {
      icon: <Package className="w-12 h-12 text-[#39B5A8]" />,
      title: "Add Package Details",
      description: "Tell us about your parcel - size, weight, and what's inside so we can handle it with care.",
    },
    {
      icon: <CreditCard className="w-12 h-12 text-[#39B5A8]" />,
      title: "Select Service & Pay",
      description: "Choose your delivery speed and payment method. We accept cash, cards, and e-wallets!",
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("pakiship_onboarding_completed", "true");
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              localStorage.setItem("pakiship_onboarding_completed", "true");
              onComplete();
            }}
            className="text-gray-400 hover:text-[#041614] transition-colors p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-[#F0F9F8] flex items-center justify-center">
            {steps[step].icon}
          </div>
          <h2 className="text-2xl font-black text-[#041614] mb-3">{steps[step].title}</h2>
          <p className="text-gray-500 font-medium leading-relaxed">{steps[step].description}</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === step ? "w-8 bg-[#39B5A8]" : "w-2 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-[#39B5A8] hover:bg-[#2D8F85] text-white font-black py-4 rounded-xl transition-all active:scale-95 shadow-lg"
        >
          {step < steps.length - 1 ? "Next" : "Get Started!"}
        </button>
      </div>
    </div>
  );
}
