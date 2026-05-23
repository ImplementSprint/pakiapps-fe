import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";

const logo = "/assets/430f6b7df4e30a8a6fddb7fbea491ba629555e7c.png";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      setIsAtTop(window.scrollY <= 5);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, {
      passive: true,
    });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (pathname !== "/") {
      router.push("/");
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setIsOpen(false);
      }
    }
  };

  const handleLoginClick = () => {
    router.push("/login");
    setIsOpen(false);
  };

  const handleSignUpClick = () => {
    router.push("/signup");
    setIsOpen(false);
  };

  return (
    <nav
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isAtTop
          ? "bg-white shadow-sm"
          : "bg-white/80 backdrop-blur-md shadow-sm", // Increased opacity slightly for readability at smaller sizes
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Reduced py-6 to py-3 to make the bar thinner */}
        <div className="flex justify-between items-center py-3.5">
          {/* Left side: Logo and Navigation */}
          {/* Reduced gap-18 to gap-10 for a tighter feel */}
          <div className="flex items-center gap-10">
            {/* Logo - Reduced h-18 to h-10 */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center"
            >
              <img
                src={logo}
                alt="PakiPark"
                className="h-12 w-auto object-contain"
              />
            </button>

            {/* Desktop Navigation */}
            {/* Reduced gap-8 to gap-6 and text size to text-sm */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => scrollToSection("services")}
                className="text-[#1e3d5a] hover:text-[#ee6b20] transition-colors font-medium text-sm"
              >
                Services
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className="text-[#1e3d5a] hover:text-[#ee6b20] transition-colors font-medium text-sm"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("how-it-works")}
                className="text-[#1e3d5a] hover:text-[#ee6b20] transition-colors font-medium text-sm"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection("reviews")}
                className="text-[#1e3d5a] hover:text-[#ee6b20] transition-colors font-medium text-sm"
              >
                Reviews
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-[#1e3d5a] hover:text-[#ee6b20] transition-colors font-medium text-sm"
              >
                FAQ
              </button>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm" // Added size="sm" to match the smaller navbar
              className="text-[#1e3d5a] hover:text-[#ee6b20] px-5 py-6 text-sm rounded-xl"
              onClick={handleLoginClick}
            >
              Login
            </Button>
            <Button
              size="sm" // Added size="sm"
              className="bg-[#ee6b20] hover:bg-[#d45a15] text-white text-sm px-5 py-6 rounded-xl"
              onClick={handleSignUpClick}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-[#1e3d5a] hover:bg-gray-100"
          >
            {isOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => scrollToSection("services")}
              className="block w-full text-left px-3 py-2 text-sm text-[#1e3d5a] hover:bg-gray-100 rounded-md"
            >
              Services
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="block w-full text-left px-3 py-2 text-sm text-[#1e3d5a] hover:bg-gray-100 rounded-md"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="block w-full text-left px-3 py-2 text-sm text-[#1e3d5a] hover:bg-gray-100 rounded-md"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("reviews")}
              className="block w-full text-left px-3 py-2 text-sm text-[#1e3d5a] hover:bg-gray-100 rounded-md"
            >
              Reviews
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className="block w-full text-left px-3 py-2 text-sm text-[#1e3d5a] hover:bg-gray-100 rounded-md"
            >
              FAQ
            </button>
            <div className="pt-2 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#1e3d5a] text-[#1e3d5a]"
                onClick={handleLoginClick}
              >
                Login
              </Button>
              <Button
                size="sm"
                className="w-full bg-[#ee6b20] hover:bg-[#d45a15] text-white"
                onClick={handleSignUpClick}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
