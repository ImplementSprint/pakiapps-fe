import { useNavigate, useRouteError } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
const logoImg = "/assets/d0a94c34a139434e20f5cb9888d8909dd214b9e7.png";
const mascotImg = "/assets/873d403bd2add17b06645c58ef3cc7daba517b30.png";

export function NotFoundPage() {
  const navigate = useNavigate();
  const error = useRouteError() as any;

  return (
    <div className="min-h-screen bg-[#F0F9F8] flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <img src={logoImg} alt="PakiSHIP" className="h-10 mb-8" />
      
      {/* Mascot */}
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 bg-[#39B5A8]/10 rounded-full animate-pulse" />
        <img 
          src={mascotImg} 
          alt="Lost package" 
          className="relative z-10 w-full h-full object-contain opacity-80" 
        />
      </div>

      {/* Error Message */}
      <h1 className="text-4xl md:text-5xl font-black text-[#1A5D56] mb-4">
        Oops! Page Not Found
      </h1>
      <p className="text-lg text-[#1A5D56]/70 font-medium mb-8 max-w-md">
        {error?.statusText || error?.message || "The page you're looking for doesn't exist or has been moved."}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#39B5A8] text-[#1A5D56] rounded-2xl font-bold hover:bg-[#39B5A8]/5 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-6 py-3 bg-[#1A5D56] text-white rounded-2xl font-bold hover:bg-[#123E3A] transition-all shadow-lg"
        >
          <Home className="w-5 h-5" />
          Home
        </button>
      </div>
    </div>
  );
}
