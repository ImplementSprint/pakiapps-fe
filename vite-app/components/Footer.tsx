import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="bg-[#0f2233] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-center gap-4 flex-wrap">
        <p className="text-white/40 text-xs tracking-widest uppercase font-semibold">
          &copy; {new Date().getFullYear()} PakiPark. All Rights Reserved.
        </p>
        <span className="text-white/20 text-xs">|</span>
        <Link to="/terms-of-use" className="text-white/40 text-xs tracking-widest uppercase font-semibold hover:text-[#ee6b20] transition-colors underline underline-offset-2">
          Terms of Use
        </Link>
        <span className="text-white/20 text-xs">|</span>
        <Link to="/privacy-policy" className="text-white/40 text-xs tracking-widest uppercase font-semibold hover:text-[#ee6b20] transition-colors underline underline-offset-2">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
