import { useEffect, useState } from 'react';
import {
  fetchHubUtilization,
  fetchHubBypassForecast,
  fetchPrescriptiveInsights,
  type HubUtilization,
  type HubBypassForecast,
  type PrescriptiveInsight,
} from '../../lib/supabaseSchema';
import { useNavigate } from '../../lib/router';
import {
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PakiShipSidebar from '../../components/pakiship/PakiShipSidebar';
import NorthstarLogisticsCards from '../../components/pakiship/NorthstarLogisticsCards';
import DwellTimeChart from '../../components/pakiship/DwellTimeChart';
import VolumeForecastChart from '../../components/pakiship/VolumeForecastChart';
import PrescriptiveActuationPanel from '../../components/pakiship/PrescriptiveActuationPanel';
import { getDisplayNameForEmail } from '../../lib/sampleAccounts';

export default function DashboardPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // BI data state — wired to vw_pakiship_* views
  const [utilization, setUtilization] = useState<HubUtilization[]>([]);
  const [bypassForecast, setBypassForecast] = useState<HubBypassForecast[]>([]);
  const [insights, setInsights] = useState<PrescriptiveInsight[]>([]);

  const placeholderName = getDisplayNameForEmail(user?.email, 'Juan Dela Cruz');

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [util, forecast, prescriptive] = await Promise.allSettled([
        fetchHubUtilization(),
        fetchHubBypassForecast(),
        fetchPrescriptiveInsights(),
      ]);
      if (util.status === 'fulfilled') setUtilization(util.value);
      if (forecast.status === 'fulfilled') setBypassForecast(forecast.value);
      if (prescriptive.status === 'fulfilled') setInsights(prescriptive.value);
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[#F0F9F8] font-sans text-[#1A5D56]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #F0F9F8; }
        ::-webkit-scrollbar-thumb { background: #39B5A833; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #39B5A866; }
      `,
        }}
      />

      <PakiShipSidebar activeTab="dashboard" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#39B5A8]/10 px-10 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-[#F0F9F8] px-4 py-2 rounded-xl border border-[#39B5A8]/10 w-153">
              <Search className="w-4 h-4 text-[#39B5A8]/60" />
              <input
                type="text"
                placeholder="Search hubs, drivers, or routes..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#39B5A8]/40 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-[#39B5A8]/10" />
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 hover:bg-[#F0F9F8] px-3 py-2 rounded-xl transition-all"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#39B5A8] to-[#1A5D56] rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-[#39B5A8]/20">
                  {placeholderName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block min-w-max">
                  <p className="text-sm font-bold text-[#041614] leading-tight whitespace-nowrap">{placeholderName}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#1A5D56] transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#39B5A8]/10 overflow-hidden z-20">
                  <button
                    onClick={() => { setIsUserMenuOpen(false); navigate('/pakiship/profile'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-[#39B5A8]" />
                    <span className="font-semibold text-[#041614]">Profile</span>
                  </button>
                  <button
                    onClick={() => { setIsUserMenuOpen(false); navigate('/pakiship/settings'); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[#F0F9F8] transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-[#39B5A8]" />
                    <span className="font-semibold text-[#041614]">Settings</span>
                  </button>
                  <div className="border-t border-[#39B5A8]/10" />
                  <button
                    onClick={() => { setIsUserMenuOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span className="font-semibold text-red-500">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-10 space-y-8">
          {/* Title + Refresh */}
          <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#041614] tracking-tight">
                Prescriptive Logistics Command
              </h1>
              <p className="text-[#1A5D56] opacity-70 font-medium italic mt-1">
                Autonomous orchestration of driver incentives &amp; route modifications to prevent facility deadlocks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Last refreshed: {lastRefresh.toLocaleTimeString()}
              </span>
              <button
                type="button"
                id="refresh-dashboard-btn"
                onClick={loadAllData}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#41B5AB] px-5 py-3 font-bold text-white shadow-lg shadow-[#39B5A8]/20 transition-all hover:bg-[#2F9D91] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </section>

          {/* ── Top Row: Northstar Metrics ──────────────────────────── */}
          <NorthstarLogisticsCards
            utilization={utilization}
            bypassForecast={bypassForecast}
            isLoading={isLoading}
          />

          {/* ── Middle Row: Charts ──────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {/* Descriptive Bar Chart — Hub Utilization Rate */}
            <DwellTimeChart data={utilization} isLoading={isLoading} />
            {/* Predictive Area Chart — Bypass Lane Forecast */}
            <VolumeForecastChart data={bypassForecast} isLoading={isLoading} />
          </div>

          {/* ── Bottom Row: Prescriptive Actuations ─────────────────── */}
          <PrescriptiveActuationPanel
            insights={insights}
            isLoading={isLoading}
            onActionExecuted={loadAllData}
          />
        </main>
      </div>
    </div>
  );
}
