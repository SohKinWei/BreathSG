import React from 'react';
import { RegionPSI, RegionKey } from '../types';
import { Wind, ShieldAlert, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface PsiStatusCardsProps {
  psiByRegion: Record<string, RegionPSI>;
  activeRegion: RegionKey;
  onSelectRegion: (region: RegionKey) => void;
  psiThreshold: number;
  lastUpdated: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const PsiStatusCards: React.FC<PsiStatusCardsProps> = ({
  psiByRegion,
  activeRegion,
  onSelectRegion,
  psiThreshold,
  lastUpdated,
  onRefresh,
  isRefreshing
}) => {
  const regions: RegionKey[] = ['central', 'east', 'west', 'north', 'south'];

  // Overall Singapore PSI highest reading
  const allValues = Object.values(psiByRegion).map((r) => r.psi);
  const maxPsi = allValues.length ? Math.max(...allValues) : 45;
  const isOverallUnhealthy = maxPsi > psiThreshold;

  const getStatusColor = (psi: number) => {
    if (psi <= 50) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Good' };
    if (psi <= 100) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Moderate' };
    if (psi <= 200) return { bg: 'bg-orange-500/15', border: 'border-orange-500/40', text: 'text-orange-400', label: 'Unhealthy' };
    return { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400', label: 'Very Unhealthy' };
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Banner: Real-time PSI Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden backdrop-blur-md">
        {/* Subtle decorative gradient */}
        <div
          className={`absolute -right-16 -top-16 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-25 ${
            isOverallUnhealthy ? 'bg-rose-500' : maxPsi > 50 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <span>National Environment Agency (NEA)</span>
              <span aria-hidden="true">·</span>
              <span>Real-Time 24-hr PSI</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Singapore Air Quality Index</span>
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg"
                title="Refresh PSI Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>
            </h2>
          </div>

          {/* National Peak PSI Gauge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Island Peak PSI</div>
              <div className="text-xs font-semibold text-slate-300">
                {maxPsi <= 50 ? 'Normal Outdoor Activities' : maxPsi <= 100 ? 'Safe for General Public' : 'Reduce Outdoor Exertion'}
              </div>
            </div>
            <div
              className={`flex items-center justify-center w-14 h-14 rounded-2xl border font-mono font-bold text-2xl tabular-nums ${getStatusColor(maxPsi).bg} ${getStatusColor(maxPsi).border} ${getStatusColor(maxPsi).text}`}
            >
              {maxPsi}
            </div>
          </div>
        </div>

        {/* 5-Region Interactive PSI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
          {regions.map((regionKey) => {
            const data = psiByRegion[regionKey];
            const psiVal = data ? data.psi : 45;
            const pm25Val = data ? data.pm25 : 18;
            const isSelected = activeRegion === regionKey;
            const status = getStatusColor(psiVal);
            const isAboveThreshold = psiVal > psiThreshold;

            return (
              <button
                key={regionKey}
                onClick={() => onSelectRegion(regionKey)}
                className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer min-h-[72px] ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold text-slate-300 capitalize">{regionKey}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-slate-500 font-medium">PSI</span>
                    <span className={`text-xl font-bold font-mono tabular-nums ${status.text}`}>
                      {psiVal}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                    PM2.5 {pm25Val}
                  </div>
                </div>

                {isAboveThreshold && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                    <span>&gt; Safe limit ({psiThreshold})</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
