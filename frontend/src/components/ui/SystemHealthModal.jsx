import React, { useEffect, useState } from 'react';
import { X, Activity, Server, Database, Brain, Wifi } from 'lucide-react';
import { healthAPI } from '../../api/client';

export default function SystemHealthModal({ open, onClose }) {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState({ api: null, db: null, ml: null });

  useEffect(() => {
    if (open) {
      checkHealth();
    }
  }, [open]);

  const checkHealth = async () => {
    setLoading(true);
    const result = { api: false, db: false, ml: false };
    try {
      await healthAPI.check();
      result.api = true;
      result.ml = true; // ML runs in the same API process
    } catch {}
    try {
      await healthAPI.database();
      result.db = true;
    } catch {}
    setHealth(result);
    setLoading(false);
  };

  if (!open) return null;

  const getStatusColor = (status) => status ? 'text-safe bg-safe/10 border-safe/20' : 'text-danger bg-danger/10 border-danger/20';
  const getStatusText = (status) => status ? 'Operational' : 'Offline';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border shadow-2xl rounded-xl overflow-hidden animate-fade-in flex flex-col">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-text-primary" />
            <h2 className="text-base font-bold text-text-primary">System Health</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-background p-4 rounded-lg border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi size={18} className="text-text-muted" />
              <div>
                <p className="text-sm font-semibold text-text-primary">API Gateway</p>
                <p className="text-[10px] text-text-secondary mt-0.5">FastAPI Backend Service</p>
              </div>
            </div>
            {loading ? <span className="text-xs text-text-muted">Checking...</span> : (
              <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${getStatusColor(health.api)}`}>
                {getStatusText(health.api)}
              </span>
            )}
          </div>

          <div className="bg-background p-4 rounded-lg border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database size={18} className="text-text-muted" />
              <div>
                <p className="text-sm font-semibold text-text-primary">PostgreSQL</p>
                <p className="text-[10px] text-text-secondary mt-0.5">cyber_threat_intel database</p>
              </div>
            </div>
            {loading ? <span className="text-xs text-text-muted">Checking...</span> : (
              <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${getStatusColor(health.db)}`}>
                {getStatusText(health.db)}
              </span>
            )}
          </div>

          <div className="bg-background p-4 rounded-lg border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain size={18} className="text-text-muted" />
              <div>
                <p className="text-sm font-semibold text-text-primary">ML Engine</p>
                <p className="text-[10px] text-text-secondary mt-0.5">Random Forest Pipeline</p>
              </div>
            </div>
            {loading ? <span className="text-xs text-text-muted">Checking...</span> : (
              <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${getStatusColor(health.ml)}`}>
                {getStatusText(health.ml)}
              </span>
            )}
          </div>
          
          <div className="pt-2 text-center">
            <button onClick={checkHealth} disabled={loading} className="text-xs text-primary hover:underline">
              {loading ? 'Running diagnostics...' : 'Run Diagnostics'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
