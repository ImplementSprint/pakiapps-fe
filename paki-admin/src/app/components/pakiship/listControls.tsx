import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function SummaryCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: 'emerald' | 'blue' | 'amber';
  value: string | number;
}) {
  const tones = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-[#39B5A8]/10 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-2xl ${tones[tone]}`}>{icon}</div>
        <span className="text-3xl font-black text-[#041614]">{value}</span>
      </div>
      <p className="text-[10px] font-bold text-[#39B5A8] uppercase tracking-[0.15em]">{label}</p>
    </div>
  );
}

export function FilterSelect({
  icon,
  label,
  onChange,
  options,
  value,
}: {
  icon: ReactNode;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <div className="min-w-[190px]">
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-[#39B5A8]">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#39B5A8]/70">{icon}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-[#39B5A8]/10 bg-[#F0F9F8] pl-11 pr-10 text-sm font-bold text-[#1A5D56] outline-none transition-all focus:border-[#39B5A8]/30 focus:ring-4 focus:ring-[#39B5A8]/15"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#39B5A8]/70" />
      </div>
    </div>
  );
}

export function TableHead({ align, children }: { align?: 'right'; children: ReactNode }) {
  return (
    <th className={`px-6 py-4 text-[10px] font-bold text-[#39B5A8] uppercase tracking-widest ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </th>
  );
}
