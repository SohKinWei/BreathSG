import React, { useState, useEffect } from 'react';
import { KeyRound, Lock, Mail, CheckCircle2, AlertCircle, RefreshCw, X, ExternalLink, ShieldCheck } from 'lucide-react';

interface OneMapTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenUpdated?: () => void;
}

export const OneMapTokenModal: React.FC<OneMapTokenModalProps> = ({ isOpen, onClose, onTokenUpdated }) => {
  const [tokenStatus, setTokenStatus] = useState<{ hasToken: boolean; source: string; preview: string | null } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const checkStatus = async () => {
    try {
      const stored = localStorage.getItem('onemap_custom_token') || '';
      const headers: Record<string, string> = {};
      if (stored) headers['x-onemap-token'] = stored;

      const res = await fetch('/api/auth/token', { headers });
      const data = await res.json();
      setTokenStatus(data);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      const savedToken = localStorage.getItem('onemap_custom_token') || '';
      if (savedToken) setManualToken(savedToken);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage({ text: 'Please enter your OneMap developer account email and password.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to authenticate with OneMap');
      }

      if (data.access_token) {
        localStorage.setItem('onemap_custom_token', data.access_token);
      }

      setMessage({ text: 'Successfully authenticated with OneMap! Token is now active.', type: 'success' });
      await checkStatus();
      onTokenUpdated?.();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveManualToken = async () => {
    if (!manualToken.trim()) {
      localStorage.removeItem('onemap_custom_token');
      setMessage({ text: 'Custom token cleared.', type: 'success' });
      await checkStatus();
      onTokenUpdated?.();
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const cleanToken = manualToken.replace(/^Bearer\s+/i, '').trim();
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to set token');

      localStorage.setItem('onemap_custom_token', cleanToken);
      setMessage({ text: 'Token saved and verified with backend!', type: 'success' });
      await checkStatus();
      onTokenUpdated?.();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">OneMap Developer API Authentication</h3>
              <p className="text-xs text-slate-400">Endpoint: https://www.onemap.gov.sg/api/auth/post/getToken</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Pill */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-slate-400 font-medium">Authentication Status</div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                {tokenStatus?.hasToken ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Token Active ({tokenStatus.source})</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400">Fallback Mode (No Token Configured)</span>
                  </>
                )}
              </div>
            </div>

            {tokenStatus?.preview && (
              <span className="font-mono bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-800">
                {tokenStatus.preview}
              </span>
            )}
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Option A: Paste existing Token */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
            <div className="font-bold text-slate-200">Option 1: Paste OneMap Bearer Token</div>
            <p className="text-slate-400">
              If you already have a token from developers.onemap.sg, paste it below to enable live search, reverse geocoding, and routing:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleSaveManualToken}
                disabled={isLoading}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                Save Token
              </button>
            </div>
          </div>

          {/* Option B: Generate Token via Email & Password */}
          <form onSubmit={handleGenerateToken} className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
            <div className="font-bold text-slate-200">Option 2: Generate Token via Email & Password</div>
            <p className="text-slate-400">
              Directly call OneMap token endpoint (<code className="text-cyan-300 font-mono">/api/auth/post/getToken</code>):
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-slate-400 mb-1 block">OneMap Registered Email</label>
                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isLoading ? 'Requesting Token...' : 'Generate & Save OneMap Token'}</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-slate-400 pt-1">
            <span>Don't have a free OneMap developer account?</span>
            <a
              href="https://www.onemap.gov.sg/docs/api/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Register at OneMap.gov.sg</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
