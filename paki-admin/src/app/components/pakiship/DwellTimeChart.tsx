import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import type { HubUtilization } from '../../lib/supabaseSchema';

interface HubUtilizationChartProps {
  data: HubUtilization[];
  isLoading: boolean;
}

const TARGET = 75;
const OVERFLOW_THRESHOLD = 85;
const UNDERUTIL_THRESHOLD = 40;

function getBarColor(util: number, isEmpty: boolean) {
  if (isEmpty) return '#E5E7EB';
  if (util > OVERFLOW_THRESHOLD) return '#DC2626'; // red — overcapacity
  if (util < UNDERUTIL_THRESHOLD) return '#F59E0B'; // yellow — underutilized
  return '#39B5A8'; // teal — near 75% target
}

export default function HubUtilizationChart({ data, isLoading }: HubUtilizationChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return [
        { hub: 'Hub A', util: 0 },
        { hub: 'Hub B', util: 0 },
        { hub: 'Hub C', util: 0 },
        { hub: 'Hub D', util: 0 },
      ];
    }
    return data.map((d) => ({
      hub: d.hub_name.length > 18 ? d.hub_name.slice(0, 16) + '…' : d.hub_name,
      util: d.util_pct,
      stored: d.current_stored,
      capacity: d.capacity,
      sla: d.sla_ok_pct,
      fullName: d.hub_name,
    }));
  }, [data]);

  const isEmpty = data.length === 0;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#39B5A8]/10 bg-white p-7 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#041614]">Hub Utilization Rate</h3>
          <p className="text-xs font-medium text-gray-400 mt-1">
            Current stored parcels vs. hub capacity — target: 75%
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-[#39B5A8]/30 bg-[#F0F9F8] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#39B5A8]">
          75% Target
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-64 rounded-2xl bg-gray-100" />
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#39B5A810" vertical={false} />
              <XAxis
                dataKey="hub"
                tick={{ fontSize: 11, fontWeight: 600, fill: '#1A5D56' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#1A5D5680' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #39B5A820',
                  borderRadius: '16px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
                formatter={(value: any, name: any, props: any) => {
                  if (name === 'util' && typeof value === 'number') return [`${value.toFixed(1)}%`, 'Utilization'];
                  return [value, name];
                }}
                labelFormatter={(label) => label}
              />
              {/* 75% Target line — solid green */}
              <ReferenceLine
                y={TARGET}
                stroke="#22C55E"
                strokeWidth={2}
                label={{
                  value: '75% Target',
                  position: 'insideTopRight',
                  style: { fontSize: 10, fill: '#22C55E', fontWeight: 700 },
                }}
              />
              {/* 85% Overflow line — dashed red */}
              <ReferenceLine
                y={OVERFLOW_THRESHOLD}
                stroke="#DC2626"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                label={{
                  value: '85% Overflow',
                  position: 'insideTopLeft',
                  style: { fontSize: 9, fill: '#DC262680', fontWeight: 600 },
                }}
              />
              <Bar dataKey="util" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={getBarColor(entry.util, isEmpty)}
                    opacity={isEmpty ? 0.3 : 0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-bold text-gray-400">No utilization data</p>
                <p className="mt-1 text-xs text-gray-300">Hub records will appear once parcels are processed</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#39B5A8]" />Near 75% Target</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />Underutilized (&lt;40%)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" />Overcapacity (&gt;85%)</span>
      </div>
    </div>
  );
}
