import { ArrowLeft, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";

interface CustomerPageHeaderProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  backPath?: string;
  onBack?: () => void;
  logo?: string;
  stepTitles?: string[];
  currentStep?: number;
}

export function CustomerPageHeader({
  title,
  subtitle,
  icon: Icon,
  backPath = "/customer/home",
  onBack,
  logo,
  stepTitles,
  currentStep,
}: CustomerPageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(backPath);
    }
  };

  // Determine title and subtitle based on props
  const displayTitle = stepTitles && currentStep ? stepTitles[currentStep - 1] : title;
  const displaySubtitle = stepTitles && currentStep 
    ? `Step ${currentStep} of ${stepTitles.length}` 
    : subtitle;

  return (
    <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-[#39B5A8]/10 px-6 py-5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Left Section: Back Button + Titles */}
        <div className="flex items-center gap-5">
          <button
            onClick={handleBack}
            className="p-2.5 bg-white shadow-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 group"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-[#39B5A8]" />
          </button>
          
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1A5D56]">
              {displayTitle}
            </h1>
            {displaySubtitle && (
              <p className="text-[10px] font-extrabold text-[#39B5A8] uppercase tracking-[0.15em]">
                {displaySubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Icon + Logo */}
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="hidden sm:flex w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-[#39B5A8]/10 items-center justify-center border border-[#39B5A8]/20">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#39B5A8]" />
            </div>
          )}
          <div className="h-8 md:h-10 w-[1px] bg-slate-200/60 mx-1 hidden md:block" />
          <img 
            src={logo || logoImg} 
            alt="PakiSHIP" 
            className="h-8 md:h-9 object-contain" 
          />
        </div>
      </div>
    </header>
  );
}
