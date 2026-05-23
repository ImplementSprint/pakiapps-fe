import React, { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Car,
  TrendingUp,
  Settings,
  List,
  CheckCircle,
} from "lucide-react";
import { Button } from "./ui/button";

// ── Official mascot image imports (must be ESM imports — cannot use as raw strings) ──
import mascotExcited   from '../../assets/7259599c331fe2220a1e67c176ecdd5a016523b9.png';
import mascotClipboard from '../../assets/a7af0671d7a8468052793b10420c4e4aa744c350.png';
import mascotParking   from '../../assets/2f36e075afb851770b0825e8580b43ef7b12efb3.png';
import mascotChecklist from '../../assets/6ba55cecd5b7106e37c71ca0e89f4f80eb706edd.png';
import mascotStarRating from '../../assets/49e0d16aae0cfb13df1b2acdc4fbd4b2ab68795e.png';
import mascotThumbsUp  from '../../assets/0084ccce0fa13239c14a85e550a3b1813304f544.png';

interface TutorialStep {
  title: string;
  description: string;
  icon: any;
  targetElement: string;
  targetTab?: string;
  position?: "top" | "bottom" | "left" | "right";
  mascot: string; // Add this line
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome, Admin!",
    description:
      "This guide will walk you through the PakiPark Admin System. Manage slots, bookings, and analytics all in one place.",
    icon: LayoutDashboard,
    targetElement: '[data-tutorial="logo"]',
    position: "bottom",
    mascot: mascotExcited,
  },
  {
    title: "Dashboard Overview",
    description:
      "Monitor real-time stats like total revenue, active users, and slot occupancy at a glance.",
    icon: LayoutDashboard,
    targetElement: '[data-tutorial="dashboard-tab"]',
    targetTab: "dashboard",
    position: "bottom",
    mascot: mascotClipboard,
  },
  {
    title: "Parking Management",
    description:
      "View your live parking grid. Assign, release, or monitor specific slots in real-time.",
    icon: Car,
    targetElement: '[data-tutorial="parking-tab"]',
    targetTab: "parking",
    position: "bottom",
    mascot: mascotParking,
  },
  {
    title: "Booking Management",
    description:
      "Handle customer reservations, approve pending requests, or track history here.",
    icon: List,
    targetElement: '[data-tutorial="bookings-tab"]',
    targetTab: "bookings",
    position: "bottom",
    mascot: mascotChecklist,
  },
  {
    title: "Analytics & Reports",
    description:
      "Deep dive into occupancy trends and financial patterns to make data-driven decisions.",
    icon: TrendingUp,
    targetElement: '[data-tutorial="analytics-tab"]',
    targetTab: "analytics",
    position: "bottom",
    mascot: mascotStarRating,
  },
  {
    title: "You're All Set!",
    description:
      'Access this guide anytime via the "Guide" button. Ready to manage PakiPark?',
    icon: CheckCircle,
    targetElement: '[data-tutorial="guide-button"]',
    targetTab: "dashboard",
    position: "bottom",
    mascot: mascotThumbsUp,
  },
];

export function AdminTutorial({
  isOpen,
  onClose,
  onNavigate,
  currentTab,
}: AdminTutorialProps) {
  // HOOKS
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(
    null,
  );

  // RESET LOGIC
  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  // NAVIGATION & HIGHLIGHT LOGIC
  useEffect(() => {
    if (isOpen && tutorialSteps[currentStep]) {
      const step = tutorialSteps[currentStep];
      if (step.targetTab && step.targetTab !== currentTab) {
        onNavigate(step.targetTab);
      }
      setTimeout(() => {
        const element = document.querySelector(
          step.targetElement,
        );
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else {
          setTargetRect(null);
        }
      }, 150);
    }
  }, [currentStep, isOpen, currentTab, onNavigate]);

  // HANDLERS
  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("adminTutorialCompleted", "true");
    setTargetRect(null);
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = tutorialSteps[currentStep];
  const Icon = currentStepData.icon;

  const getTutorialBoxStyle = () => {
    if (!targetRect)
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    const pos = currentStepData.position || "bottom";
    const spacing = 30;

    switch (pos) {
      case "bottom":
        return {
          top: `${targetRect.bottom + spacing}px`,
          left: `${Math.max(20, Math.min(targetRect.left, window.innerWidth - 420))}px`,
        };
      case "top":
        return {
          bottom: `${window.innerHeight - targetRect.top + spacing}px`,
          left: `${Math.max(20, Math.min(targetRect.left, window.innerWidth - 420))}px`,
        };
      default:
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  return (
    <>
      {/* SPOTLIGHT */}
      <div className="fixed inset-0 z-[300] pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="admin-spotlight">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 10}
                  y={targetRect.top - 10}
                  width={targetRect.width + 20}
                  height={targetRect.height + 20}
                  rx="16"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.65)"
            mask="url(#admin-spotlight)"
          />
        </svg>
      </div>

      {/* TUTORIAL CARD */}
      <div
        className="fixed z-[302] w-[380px] transition-all duration-500 ease-in-out"
        style={getTutorialBoxStyle() as any}
      >
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full animate-in zoom-in-95 duration-300">
          {/* --- DYNAMIC OVERFLOW MASCOT --- */}
          <div
            key={currentStep}
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-28 h-28 z-[303] drop-shadow-2xl animate-in fade-in zoom-in duration-500"
          >
            <img
              src={currentStepData.mascot} // Use the dynamic source from currentStepData
              alt="Mascot"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="bg-[#2a4665] pt-14 px-8 pb-5 rounded-t-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/10">
              <div
                className="h-full bg-[#ed6c23] transition-all duration-500 shadow-[0_0_10px_#ed6c23]"
                style={{
                  width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`,
                }}
              />
            </div>

            <div className="text-center">
              <span className="bg-[#ed6c23] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                Admin Step {currentStep + 1}
              </span>
              <h3 className="text-xl font-black text-white uppercase mt-3">
                {currentStepData.title}
              </h3>
            </div>
          </div>

          <div className="p-8">
            <div className="flex items-start gap-4 mb-8">
              <div className="size-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#ed6c23] shrink-0 border border-orange-100">
                <Icon size={24} />
              </div>
              <p className="text-[#5a6b7c] text-sm leading-relaxed font-medium">
                {currentStepData.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <Button
                variant="ghost"
                className={`h-10 w-10 p-0 rounded-xl text-gray-400 ${currentStep === 0 ? "invisible" : ""}`}
                onClick={handlePrevious}
              >
                <ChevronLeft size={24} />
              </Button>

              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
                >
                  Skip
                </button>
                <Button
                  onClick={
                    currentStep === tutorialSteps.length - 1
                      ? handleFinish
                      : handleNext
                  }
                  className={`h-10 px-8 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg ${
                    currentStep === tutorialSteps.length - 1
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-green-100"
                      : "bg-[#ed6c23] hover:bg-[#d45e1b] text-white shadow-orange-100"
                  }`}
                >
                  {currentStep === tutorialSteps.length - 1
                    ? "Finish"
                    : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
