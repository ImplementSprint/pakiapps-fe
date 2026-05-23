import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { HubBypassForecast } from '../../lib/supabaseSchema';

interface BypassForecastChartProps {
  data: HubBypassForecast[];
  isLoading: boolean;
}

export default function VolumeForecastChart({ data, isLoading }: BypassForecastChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) {
      return [
        { hub: 'Hub A', forecast_4h_pct: 0, forecast_24h_pct: 0 },
        { hub: 'Hub B', forecast_4h_pct: 0, forecast_24h_pct: 0 },
        { hub: 'Hub C', forecast_4h_pct: 0, forecast_24h_pct: 0 },
        { hub: 'Hub D', forecast_4h_pct: 0, forecast_24h_pct: 0 },
      ];
    }
    return data.map((d) => ({
      hub: d.hub_name.length > 18 ? d.hub_name.slice(0, 16) + '…' : d.hub_name,
      forecast_4h_pct: d.forecast_4h_pct,
      forecast_24h_pct: d.forecast_24h_pct,
      stored: d.current_stored,
      capacity: d.capacity,
      fullName: d.hub_name,
    }));
  }, [data]);

  const isEmpty = data.length === 0;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#39B5A8]/10 bg-white p-7 shadow-sm">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-[#041614]">Bypass Lane Forecast</h3>
          <p className="text-xs font-medium text-gray-400 mt-1">
            Predictive 4h deadlock &amp; 24h overflow risk vs. 75% target capacity
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-700">
          100% = Deadlock
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-64 rounded-2xl bg-gray-100" />
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <defs>
                {/* 4h forecast — amber fill */}
                <linearGradient id="gradient4h" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.05} />
                </linearGradient>
                {/* 24h forecast — teal fill */}
                <linearGradient id="gradient24h" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#39B5A8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#39B5A8" stopOpacity={0.05} />
                </linearGradient>
              </defs>
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
                domain={[0, 110]}
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
                formatter={(value: number, name: string) => {
                  if (name === 'forecast_4h_pct') return [`${value.toFixed(1)}%`, '4h Forecast'];
                  if (name === 'forecast_24h_pct') return [`${value.toFixed(1)}%`, '24h Forecast'];
                  return [value, name];
                }}
              />
              {/* 75% Target — solid green */}
              <ReferenceLine
                y={75}
                stroke="#22C55E"
                strokeWidth={2}
                label={{
                  value: '75% Target',
                  position: 'insideTopRight',
                  style: { fontSize: 10, fill: '#22C55E', fontWeight: 700 },
                }}
              />
              {/* 100% Capacity — solid red */}
              <ReferenceLine
                y={100}
                stroke="#DC2626"
                strokeWidth={2}
                label={{
                  value: '100% Capacity',
                  position: 'insideTopLeft',
                  style: { fontSize: 10, fill: '#DC2626', fontWeight: 700 },
                }}
              />
              {/* 24h forecast area (render first so 4h is on top) */}
              <Area
                type="monotone"
                dataKey="forecast_24h_pct"
                stroke={isEmpty ? '#E5E7EB' : '#39B5A8'}
                strokeWidth={1.5}
                strokeDasharray="6 3"
                fill={isEmpty ? 'none' : 'url(#gradient24h)'}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#39B5A8' }}
              />
              {/* 4h forecast area */}
              <Area
                type="monotone"
                dataKey="forecast_4h_pct"
                stroke={isEmpty ? '#E5E7EB' : '#F59E0B'}
                strokeWidth={2}
                fill={isEmpty ? 'none' : 'url(#gradient4h)'}
                dot={{ r: 4, fill: '#fff', stroke: isEmpty ? '#E5E7EB' : '#F59E0B', strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#F59E0B' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-bold text-gray-400">No bypass forecast data</p>
                <p className="mt-1 text-xs text-gray-300">Forecasts appear as hubs receive active shipments</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded border-t-2 border-[#F59E0B]" />4h Deadlock Risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded border-t-2 border-dashed border-[#39B5A8]" />24h Overflow Risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 border-t-2 border-[#22C55E]" />75% Target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 border-t-2 border-[#DC2626]" />100% Capacity
        </span>
      </div>
    </div>
  );
}
