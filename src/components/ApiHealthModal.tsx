import React, { useEffect, useState } from 'react';
import { ApiHealthReport } from '../types';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap
} from 'lucide-react';

interface ApiHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiHealthModal: React.FC<ApiHealthModalProps> = ({ isOpen, onClose }) => {
  const [healthData, setHealthData] = useState<ApiHealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`Health check returned HTTP ${res.status}`);
      const data = await res.json();
      setHealthData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderStatusBadge = (status: string) => {
    if (status === 'operational') {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3" />
          Operational
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          Degraded
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" />
        Offline
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">PSI API Health Monitor</h3>
              <p className="text-xs text-slate-400">Endpoint: /api/health</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Re-run diagnostic"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {error ? (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              Health check failed: {error}
            </div>
          ) : !healthData ? (
            <div className="py-8 text-center text-xs text-slate-400">Pinging Singapore PSI API...</div>
          ) : (
            <>
              {/* Overall Banner */}
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">API Gateway Status</div>
                  <div className="text-sm font-bold text-white capitalize">{healthData.status}</div>
                </div>
                <div className="text-right text-xs text-slate-400 font-mono tabular-nums">
                  Uptime: {healthData.uptimeSeconds}s · {healthData.environment}
                </div>
              </div>

              {/* Service Details */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/90 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">data.gov.sg Real-Time PSI API</span>
                  {renderStatusBadge(healthData.services.psi_api.status)}
                </div>
                <div className="text-xs text-slate-400 break-all font-mono">
                  {healthData.services.psi_api.endpoint}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-900">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    Response Latency: <strong className="text-slate-200 font-mono tabular-nums">{healthData.services.psi_api.latencyMs}ms</strong>
                  </span>
                  <span className="font-mono">
                    HTTP: <strong className="text-slate-200">{healthData.services.psi_api.httpStatus || 200}</strong>
                  </span>
                </div>
              </div>

              {/* System Info */}
              {healthData.system && (
                <div className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs text-slate-400">
                  <span>Node.js: <strong className="text-slate-300 font-mono">{healthData.system.nodeVersion}</strong></span>
                  <span>Heap Used: <strong className="text-slate-300 font-mono">{healthData.system.heapUsedMB} MB</strong></span>
                  <span>RSS: <strong className="text-slate-300 font-mono">{healthData.system.rssMB} MB</strong></span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>Raw JSON Endpoint</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors min-h-[40px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
