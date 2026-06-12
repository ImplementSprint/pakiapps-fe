'use client';
import { Settings } from 'lucide-react';

export default function AdminSettingsView() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
      <div className="size-16 bg-[#f4f7fa] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Settings className="size-8 text-[#1e3d5a]" />
      </div>
      <h2 className="text-xl font-bold text-[#1e3d5a] mb-2">System Settings</h2>
      <p className="text-gray-400 text-sm">Admin settings panel — configure parking rates, payment methods, and system preferences here.</p>
      <p className="text-[#ee6b20] text-xs font-bold mt-4 uppercase tracking-widest">Coming Soon</p>
    </div>
  );
}
