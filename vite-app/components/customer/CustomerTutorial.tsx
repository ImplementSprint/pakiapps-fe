import { ChevronLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect } from "react";

interface TutorialStep {
  title: string;
  description: string;
  mascot: string;
  targetId: string | null;
}

interface CustomerTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  steps: TutorialStep[];
  coords: {
    top: string;
    left: string;
    transform: string;
  };
}

export function CustomerTutorial({
  isOpen,
  onClose,
  currentStep,
  onNext,
  onBack,
  steps,
  coords,
}: CustomerTutorialProps) {
  if (!isOpen) return null;

  const isLastStep = currentStep >= steps.length - 1;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[300] transition-opacity duration-500" />

      <div
        className="fixed z-[302] w-[340px] transition-all duration-500 ease-in-out"
        style={coords}
      >
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full animate-in fade-in zoom-in duration-300">
          <div
            key={currentStep}
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-28 h-28 z-[303] drop-shadow-2xl animate-in fade-in zoom-in duration-300"
          >
            <img
              src={steps[currentStep].mascot}
              alt="Mascot"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="bg-[#2a4665] pt-12 px-6 pb-4 rounded-t-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/10">
              <div
                className="h-full bg-[#ed6c23] transition-all duration-500 shadow-[0_0_8px_#ed6c23]"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>

            <h3 className="text-lg font-black text-white text-center uppercase tracking-tight">
              {steps[currentStep].title}
            </h3>
          </div>

          <div className="p-8 space-y-8">
            <p className="text-[#5a6b7c] text-base leading-relaxed text-center font-medium px-2">
              {steps[currentStep].description}
            </p>

            <div className="flex flex-col items-center gap-6 pt-2">
              <Button
                className="w-full h-14 bg-[#ed6c23] hover:bg-[#d45e1b] text-white rounded-2xl text-sm font-black shadow-xl shadow-orange-200 uppercase tracking-widest transition-all active:scale-95 hover:scale-[1.02]"
                onClick={isLastStep ? onClose : onNext}
              >
                {isLastStep ? "Get Started" : "Next Step"}
              </Button>

              <div className="flex items-center justify-center gap-8 w-full">
                {currentStep > 0 && (
                  <button
                    className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-[#1e3d5a] transition-colors"
                    onClick={onBack}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                >
                  Skip Tutorial
                </button>
              </div>
            </div>
          </div>

          {steps[currentStep].targetId && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2a4665] rotate-45 rounded-sm" />
          )}
        </div>
      </div>
    </>
  );
}
