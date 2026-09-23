import React, { useEffect, useState, useRef, useCallback } from 'react';
import { monitorAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import MetricCard from '../components/ui/MetricCard';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { Radio, Play, Pause, RefreshCw, Activity, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ThreatMonitor() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monitoring, setMonitoring] = useState(false);
  const [offset, setOffset] = useState(0);
  const [intervalMs, setIntervalMs] = useState(4000);
  const intervalRef = useRef(null);

  const fetchInitial = async () => {
    setLoading(true); setError(null);
    try {
      const [evts, st] = await Promise.all([
        monitorAPI.getRecent({ limit: 50, offset: 0 }),
        monitorAPI.getStats(),
      ]);
      setEvents(evts); setStats(st); setOffset(50);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { fetchInitial(); return () => clearInterval(intervalRef.current); }, []);

  const poll = useCallback(async () => {
    try {
      const newEvents = await monitorAPI.getRecent({ limit: 10, offset });
      if (newEvents.length > 0) {
        setEvents(prev => [...newEvents, ...prev].slice(0, 200));
        setOffset(prev => prev + newEvents.length);
      }
      const st = await monitorAPI.getStats();
      setStats(st);
    } catch {}
  }, [offset]);

  const startMonitoring = () => {
    setMonitoring(true);
    intervalRef.current = setInterval(poll, intervalMs);
  };
  const stopMonitoring = () => {
    setMonitoring(false);
    clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (monitoring) {
      stopMonitoring();
      startMonitoring();
    }
  }, [intervalMs]);

  if (loading) return <LoadingSkeleton cards={3} rows={8} />;
  if (error) return <EmptyState isError title="Unable to load threat monitor" message={error} onRetry={fetchInitial} />;

  // Live Activity Vis data
  const activityVis = Array.from({ length: 40 }).map((_, i) => {
    const active = monitoring && Math.random() > 0.4;
    return active ? Math.floor(Math.random() * 100) : 5;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {monitoring ? (
            <button onClick={stopMonitoring} className="btn-secondary text-xs"><Pause size={14} />Pause</button>
          ) : (
            <button onClick={startMonitoring} className="btn-primary text-xs"><Play size={14} />Start Monitoring</button>
          )}
          <button onClick={fetchInitial} className="btn-secondary text-xs"><RefreshCw size={14} />Refresh</button>
          <select value={intervalMs} onChange={e => setIntervalMs(Number(e.target.value))} className="input w-auto text-xs py-1.5 ml-2">
            <option value={4000}>4 sec</option>
            <option value={10000}>10 sec</option>
            <option value={30000}>30 sec</option>
            <option value={60000}>60 sec</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {monitoring && (
            <span className="flex items-center gap-1.5 text-xs text-safe font-medium bg-safe/10 border border-safe/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-safe rounded-full animate-pulse-dot" />LIVE
            </span>
          )}
          <span className="badge badge-muted">UNSW-NB15 Dataset Replay</span>
        </div>
      </div>

      {/* Live Activity Vis */}
      {monitoring && (
        <div className="h-8 flex items-end gap-1 opacity-50 px-2">
          {activityVis.map((val, i) => (
            <div key={i} className="w-2 bg-primary rounded-t" style={{ height: `${val}%`, transition: 'height 0.3s ease' }} />
          ))}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <MetricCard label="Events Loaded" value={stats.total_events?.toLocaleString()} icon={Activity} />
          <MetricCard label="Threats Detected" value={stats.threats_detected?.toLocaleString()} icon={ShieldAlert} />
          <MetricCard label="Critical Events" value={stats.critical_events?.toLocaleString()} icon={AlertTriangle} accent />
        </div>
      )}

      {/* Feed */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Radio size={14} className="text-primary" />Threat Feed
          </h3>
          <span className="text-xs text-text-muted">{events.length} events</span>
        </div>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface z-10">
              <tr className="border-b border-border text-[11px] text-text-secondary uppercase tracking-wider">
                <th className="px-5 py-2.5 text-left font-medium">ID</th>
                <th className="px-5 py-2.5 text-left font-medium">Threat</th>
                <th className="px-5 py-2.5 text-left font-medium">Protocol</th>
                <th className="px-5 py-2.5 text-left font-medium">Service</th>
                <th className="px-5 py-2.5 text-right font-medium">Packets</th>
                <th className="px-5 py-2.5 text-right font-medium">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((ev, i) => (
                <tr key={`${ev.id}-${i}`} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-2 text-text-muted font-mono text-xs">{ev.id}</td>
                  <td className="px-5 py-2 text-text-primary font-medium">{ev.threat_type}</td>
                  <td className="px-5 py-2 text-text-secondary font-mono text-xs uppercase">{ev.protocol}</td>
                  <td className="px-5 py-2 text-text-secondary">{ev.service}</td>
                  <td className="px-5 py-2 text-text-secondary text-right">{ev.packets.toLocaleString()}</td>
                  <td className="px-5 py-2 text-right"><StatusBadge value={ev.severity} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
