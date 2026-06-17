import { useState } from 'react';
import { AlertTriangle, Zap, RotateCcw, CheckCircle2, Shield } from 'lucide-react';
import type { PrescriptiveInsight } from '../../lib/supabaseSchema';
import { executeSurgeAction } from '../../lib/supabaseSchema';

interface PrescriptiveActuationPanelProps {
  insights: PrescriptiveInsight[];
  isLoading: boolean;
  onActionExecuted?: () => void;
}

export default function PrescriptiveActuationPanel({
  insights,
  isLoading,
  onActionExecuted,
}: PrescriptiveActuationPanelProps) {
  const [executingIds, setExecutingIds] = useState<Set<string>>(new Set());
  const [executedIds, setExecutedIds] = useState<Set<string>>(new Set());

  const actionableInsights = insights.filter((i) => i.severity !== 'STABLE');

  const handleExecute = async (insight: PrescriptiveInsight) => {
    setExecutingIds((prev) => new Set(prev).add(insight.hub_id));
    try {
      const threat =
        insight.severity === 'CRITICAL'
          ? `${insight.hub_name}: 4h forecast at ${insight.forecast_4h_pct.toFixed(1)}% capacity — Bypass Lane Deadlock`
          : `${insight.hub_name}: Utilization at ${insight.util_pct.toFixed(1)}% — Hub Rebalance Required`;

      const result = await executeSurgeAction(
        insight.hub_id,
        threat,
        insight.prescriptive_action,
        'pakiship',
      );
      if (result) {
        setExecutedIds((prev) => new Set(prev).add(insight.hub_id));
        onActionExecuted?.();
      }
    } catch {
      // Error already logged in executeSurgeAction
    } finally {
      setExecutingIds((prev) => {
        const next = new Set(prev);
        next.delete(insight.hub_id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-[#39B5A8]/10 bg-white p-7 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-64 rounded-lg bg-gray-200" />
          <div className="h-4 w-96 rounded-lg bg-gray-100" />
          <div className="space-y-3 mt-6">
            <div className="h-32 rounded-2xl bg-gray-100" />
            <div className="h-32 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#39B5A8]/10 bg-white p-7 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#041614]">
            Automated Actuations
          </h3>
          <p className="text-xs font-medium text-gray-400 mt-1">
            Prescriptive action matrix from <span className="font-semibold text-[#39B5A8]">vw_pakiship_prescriptive</span>. Execute to log actuation and trigger driver incentives or hub rebalancing.
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-[#39B5A8]/20 bg-[#F0F9F8] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#39B5A8]">
          {actionableInsights.length} Action{actionableInsights.length === 1 ? '' : 's'} Required
        </div>
      </div>

      {actionableInsights.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <Shield className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-emerald-700">Stable (Near 75% Target)</p>
          <p className="mt-1 text-xs text-emerald-600/70">
            All hubs are operating within the 40–85% utilization band. No bypass alerts or rebalancing needed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {actionableInsights.map((insight) => {
            const isCritical = insight.severity === 'CRITICAL';
            const isExecuting = executingIds.has(insight.hub_id);
            const isExecuted = executedIds.has(insight.hub_id);

            return (
              <div
                key={insight.hub_id}
                className={`rounded-[1.75rem] border p-6 transition-all ${
                  isCritical
                    ? 'border-red-200 bg-red-50/60'
                    : 'border-amber-200 bg-amber-50/60'
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                        isCritical
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="h-6 w-6" />
                      ) : (
                        <RotateCcw className="h-6 w-6" />
                      )}
                    </div>

                    <div className="min-w-0">
                      {/* Hub name + severity badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#041614]">{insight.hub_name}</p>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                            isCritical
                              ? 'border-red-200 bg-red-100 text-red-700'
                              : 'border-amber-200 bg-amber-100 text-amber-700'
                          }`}
                        >
                          {insight.severity}
                        </span>
                      </div>

                      {/* Threat description */}
                      <p className="mt-1.5 text-sm text-gray-600">
                        <span className="font-semibold">Threat:</span>{' '}
                        {isCritical
                          ? `${insight.hub_name} projected to hit ${insight.forecast_4h_pct.toFixed(0)}% capacity within 4 hours — Bypass Lane Deadlock.`
                          : `Hub utilization at ${insight.util_pct.toFixed(1)}% — outside optimal 40–85% band. Rebalancing needed.`}
                      </p>

                      {/* Prescribed action */}
                      <p className="mt-1.5 text-sm font-semibold text-[#1A5D56]">
                        <span className="font-bold">Prescribed Action:</span>{' '}
                        {isCritical
                          ? '💰 Trigger +₱50 ALERT BONUS to Relay Drivers via Bypass Lane.'
                          : '🔄 Execute Hub Rebalance Recommendation.'}
                      </p>

                      {/* Metrics row */}
                      <div className="mt-3 flex flex-wrap gap-3">
                        <span className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          Util: {insight.util_pct.toFixed(1)}%
                        </span>
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                          4h: {insight.forecast_4h_pct.toFixed(0)}%
                        </span>
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                          24h: {insight.forecast_24h_pct.toFixed(0)}%
                        </span>
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                          Stored: {insight.current_stored}/{insight.capacity}
                        </span>
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                          SLA: {insight.sla_ok_pct.toFixed(0)}% OK
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="shrink-0">
                    {isExecuted ? (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-5 py-3 text-sm font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Action Logged
                      </div>
                    ) : (
                      <button
                        type="button"
                        id={`execute-action-${insight.hub_id}`}
                        disabled={isExecuting}
                        onClick={() => handleExecute(insight)}
                        className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-all ${
                          isExecuting
                            ? 'cursor-wait bg-gray-400'
                            : isCritical
                              ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20 hover:shadow-red-600/30'
                              : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 hover:shadow-amber-600/30'
                        }`}
                      >
                        <Zap className={`h-4 w-4 ${isExecuting ? 'animate-spin' : ''}`} />
                        {isExecuting
                          ? 'Executing…'
                          : isCritical
                            ? 'Trigger Surge Bonus'
                            : 'Execute Rebalance'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
