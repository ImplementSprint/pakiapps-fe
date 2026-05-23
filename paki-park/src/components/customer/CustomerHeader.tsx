import { User, Info, MapPin, Camera } from "lucide-react";
import { Button } from "../ui/button";

interface CustomerHeaderProps {
  userName: string;
  profilePicture: string | null;
  onProfilePicClick: () => void;
  onGuideClick: () => void;
  onReserveClick: () => void;
  reserveHighlightClass?: string;
}

export function CustomerHeader({
  userName,
  profilePicture,
  onProfilePicClick,
  onGuideClick,
  onReserveClick,
  reserveHighlightClass = "",
}: CustomerHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div
          onClick={onProfilePicClick}
          className="relative group size-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#ee6b20] flex items-center justify-center cursor-pointer"
        >
          {profilePicture ? (
            <img
              src={profilePicture}
              className="w-full h-full object-cover"
              alt="Profile"
            />
          ) : (
            <User className="size-8 text-white" />
          )}

          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Camera className="size-6 text-white" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-[#1e3d5a]">
            Hello, {userName}!
          </h1>
          <p className="text-m text-gray-500 font-medium">
            Ready to park your vehicle?
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={onGuideClick}
          variant="outline"
          className="h-12 px-4 rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-100 transition-all shadow-sm bg-white"
        >
          <Info className="size-4 mr-2 text-[#1e3d5a]" /> Guide
        </Button>
        <Button
          id="btn-reserve-now"
          onClick={onReserveClick}
          className={`bg-[#ee6b20] hover:bg-[#d55f1c] text-white h-12 px-6 rounded-xl font-bold shadow-md transition-all hover:scale-[1.02] ${reserveHighlightClass}`}
        >
          <MapPin className="size-4 mr-2" /> Reserve Now
        </Button>
      </div>
    </div>
  );
}
