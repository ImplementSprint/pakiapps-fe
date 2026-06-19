import type { ReactNode } from 'react';
import { AppWindow, Activity, Workflow } from 'lucide-react';

/** A single PakiAdmin auth-screen highlight card (icon tile + title + description). */
export function AuthFeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/80 border border-[#dec0f1] rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <div className="w-11 h-11 bg-[#dec0f1]/40 rounded-xl shrink-0 flex items-center justify-center text-[#2c0735] transition-colors group-hover:bg-[#2c0735] group-hover:text-white">
        {icon}
      </div>
      <div className="flex flex-col text-left">
        <h4 className="font-black text-[#2c0735] text-base leading-tight">{title}</h4>
        <p className="text-[#2c0735]/50 text-xs font-bold leading-tight mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

/** The three PakiAdmin auth-screen highlight cards shared by the login/signup hero column. */
export function AdminFeatureCards() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-lg">
      <AuthFeatureCard
        icon={<AppWindow className="w-5 h-5" />}
        title="Centralized Management"
        desc="Monitor and manage both Pakiship and Pakipark operations in one centralized admin platform."
      />
      <AuthFeatureCard
        icon={<Activity className="w-5 h-5" />}
        title="Real-Time Visibility"
        desc="Track real-time updates, statuses, and activity for faster and more accurate decision-making."
      />
      <AuthFeatureCard
        icon={<Workflow className="w-5 h-5" />}
        title="Improved Efficiency"
        desc="Improve workflow efficiency with easier oversight, better organization, and quicker response to issues."
      />
    </div>
  );
}
