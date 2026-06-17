import { Target, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import type { HubUtilization, HubBypassForecast } from '../../lib/supabaseSchema';

interface NorthstarLogisticsCardsProps {
  utilization: HubUtilization[];
  bypassForecast: HubBypassForecast[];
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-[#39B5A8]/10 bg-white p-7 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-24 rounded-lg bg-gray-200" />
        <div className="h-10 w-32 rounded-lg bg-gray-200" />
        <div className="h-3 w-48 rounded-lg bg-gray-100" />
        <div className="h-2.5 w-full rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

export default function NorthstarLogisticsCards({
  utilization,
  bypassForecast,
  isLoading,
}: NorthstarLogisticsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // ── Card 1: Hub Utilization Rate ─────────────────────────────────────────
  const avgUtil =
    utilization.length > 0
      ? utilization[0].avg_network_util_pct
      : 0;
  const utilSeverity =
    avgUtil > 85 ? 'critical' : avgUtil < 40 ? 'warning' : 'healthy';
  const utilLabel =
    avgUtil > 85 ? 'OVERCAPACITY' : avgUtil < 40 ? 'UNDERUTILIZED' : 'ON TARGET';

  // ── Card 2: Real-Time Bypass Alerts ─────────────────────────────────────
  const worstBypass =
    bypassForecast.length > 0
      ? bypassForecast.reduce((a, b) =>
          a.forecast_4h_pct > b.forecast_4h_pct ? a : b,
        )
      : null;
  const deadlock4h = worstBypass?.forecast_4h_pct ?? 0;
  const bypassSeverity =
    deadlock4h > 90 ? 'critical' : deadlock4h > 70 ? 'warning' : 'healthy';

  // ── Card 3: Delivery Mode Split ──────────────────────────────────────────
  const relayPct =
    utilization.length > 0 ? utilization[0].relay_pct : 0;
  const directPct =
    utilization.length > 0 ? utilization[0].direct_pct : 0;
  const splitSeverity = relayPct > 0 || directPct > 0 ? 'healthy' : 'warning';

  const severityStyles = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'bg-red-100 text-red-600',
      badge: 'bg-red-100 text-red-700 border-red-200',
      value: 'text-red-700',
      bar: 'bg-red-500',
      track: 'bg-red-100',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'bg-amber-100 text-amber-600',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      value: 'text-amber-700',
      bar: 'bg-amber-500',
      track: 'bg-amber-100',
    },
    healthy: {
      bg: 'bg-[#F0F9F8]',
      border: 'border-[#39B5A8]/20',
      icon: 'bg-[#E8F6F4] text-[#39B5A8]',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      value: 'text-[#1A5D56]',
      bar: 'bg-[#39B5A8]',
      track: 'bg-[#39B5A8]/10',
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* ── Card 1: Hub Utilization Rate ─────────────────────────────── */}
      {(() => {
        const s = severityStyles[utilSeverity];
        return (
          <div className={`group relative overflow-hidden rounded-[2rem] border ${s.border} ${s.bg} p-7 shadow-sm transition-all hover:shadow-md`}>
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-2xl p-3 transition-transform group-hover:scale-110 ${s.icon}`}>
                <Target className="w-6 h-6" />
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${s.badge}`}>
                {utilLabel}
              </span>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#39B5A8]">
                Hub Utilization Rate
              </p>
              <p className={`text-4xl font-black ${s.value}`}>
                {avgUtil > 0 ? `${avgUtil.toFixed(1)}%` : '—'}
              </p>
              <p className="text-sm font-semibold text-[#041614]/70">
                Target: 75% Optimal Capacity
              </p>
              {/* Progress bar */}
              <div className={`relative h-2.5 w-full overflow-hidden rounded-full ${s.track}`}>
                <div
                  className={`h-full rounded-full transition-all duration-700 ${s.bar}`}
                  style={{ width: `${Math.min(avgUtil, 100)}%` }}
                />
                {/* 75% target marker */}
                <div
                  className="absolute top-0 h-full w-0.5 bg-[#39B5A8] opacity-60"
                  style={{ left: '75%' }}
                />
              </div>
              <p className="text-[10px] font-bold text-gray-400">
                {utilization.length} hub{utilization.length !== 1 ? 's' : ''} monitored
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── Card 2: Real-Time Bypass Alerts ──────────────────────────── */}
      {(() => {
        const s = severityStyles[bypassSeverity];
        return (
          <div className={`group relative overflow-hidden rounded-[2rem] border ${s.border} ${s.bg} p-7 shadow-sm transition-all hover:shadow-md`}>
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-2xl p-3 transition-transform group-hover:scale-110 ${s.icon}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${s.badge}`}>
                {bypassSeverity === 'critical' ? 'DEADLOCK RISK' : bypassSeverity === 'warning' ? 'MONITOR' : 'CLEAR'}
              </span>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#39B5A8]">
                Real-Time Bypass Alerts
              </p>
              <p className={`text-4xl font-black ${s.value}`}>
                {deadlock4h > 0 ? `${deadlock4h.toFixed(1)}%` : '—'}
              </p>
              <p className="text-sm font-semibold text-[#041614]/70">
                {worstBypass ? worstBypass.hub_name : 'No hub data'}
              </p>
              {/* 4h vs 24h sub-row */}
              {worstBypass && (
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                  <span className={`rounded-lg px-2 py-1 ${deadlock4h > 90 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    4H: {worstBypass.forecast_4h_pct.toFixed(0)}%
                  </span>
                  <span className={`rounded-lg px-2 py-1 ${worstBypass.forecast_24h_pct > 90 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                    24H: {worstBypass.forecast_24h_pct.toFixed(0)}%
                  </span>
                </div>
              )}
              <p className="text-[10px] font-bold text-gray-400">
                4h Deadlock / 24h Overflow Forecast
              </p>
            </div>
          </div>
        );
      })()}

      {/* ── Card 3: Delivery Mode Split ───────────────────────────────── */}
      {(() => {
        const s = severityStyles[splitSeverity];
        return (
          <div className={`group relative overflow-hidden rounded-[2rem] border ${s.border} ${s.bg} p-7 shadow-sm transition-all hover:shadow-md`}>
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-2xl p-3 transition-transform group-hover:scale-110 ${s.icon}`}>
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${s.badge}`}>
                {relayPct > 0 || directPct > 0 ? 'LIVE SPLIT' : 'NO DATA'}
              </span>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#39B5A8]">
                Delivery Mode Split
              </p>
              <div className="flex items-baseline gap-2">
                <p className={`text-4xl font-black ${s.value}`}>
                  {relayPct > 0 ? `${relayPct.toFixed(0)}%` : '—'}
                </p>
                <p className="text-sm font-semibold text-gray-400">Relay</p>
              </div>
              <p className="text-sm font-semibold text-[#041614]/70">
                {directPct > 0 ? `${directPct.toFixed(0)}%` : '—'} Direct Delivery
              </p>
              {/* Split bar */}
              {(relayPct > 0 || directPct > 0) && (
                <div className="relative flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full bg-[#39B5A8] transition-all duration-700"
                    style={{ width: `${relayPct}%` }}
                  />
                  <div
                    className="h-full bg-gray-300 transition-all duration-700"
                    style={{ width: `${directPct}%` }}
                  />
                </div>
              )}
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#39B5A8]" />Relay
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gray-300" />Direct
                </span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
