import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../api/client';
import ChartCard from '../components/ui/ChartCard';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { ShieldAlert, Layers, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const THREAT_COLORS = { Generic:'#3B82F6', Analysis:'#6366F1', Fuzzers:'#8B5CF6', DoS:'#F59E0B', Reconnaissance:'#F97316', Exploits:'#EF4444', Backdoor:'#DC2626', Shellcode:'#B91C1C', Worms:'#991B1B' };
const SEVERITY_COLORS = { LOW:'#10B981', MEDIUM:'#3B82F6', HIGH:'#F59E0B', CRITICAL:'#EF4444' };
const tooltipStyle = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12px', padding: '8px 12px' };

export default function ThreatAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [threats, setThreats] = useState([]);
  const [severity, setSeverity] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [ranking, setRanking] = useState([]);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [th, sv, mx, rk] = await Promise.all([
        analyticsAPI.getThreatDistribution(), analyticsAPI.getSeverity(),
        analyticsAPI.getThreatProtocolMatrix(), analyticsAPI.getAttackRanking(),
      ]);
      setThreats(th); setSeverity(sv); setMatrix(mx); setRanking(rk);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSkeleton cards={4} chart rows={5} />;
  if (error) return <EmptyState isError title="Failed to load analytics" message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full min-w-0">
        <ChartCard title="Threat Category Volumes" subtitle="Attack signatures by family" icon={ShieldAlert} className="min-h-[380px]">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={threats} margin={{ top:10,right:10,left:0,bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1D2733" vertical={false} />
              <XAxis dataKey="category" stroke="#64748B" angle={-45} textAnchor="end" interval={0} fontSize={11} tickMargin={5} />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={v => v>1000?`${(v/1000).toFixed(0)}k`:v} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} cursor={{fill:'var(--surface-hover)'}} formatter={v=>[v.toLocaleString(),'Count']} />
              <Bar dataKey="count" radius={[4,4,0,0]} maxBarSize={50}>
                {threats.map((e,i) => <Cell key={i} fill={THREAT_COLORS[e.category]||'#64748B'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Severity Distribution" subtitle="Risk level classification" icon={Layers} className="min-h-[380px]">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={severity} layout="vertical" margin={{ top:10,right:20,left:10,bottom:10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1D2733" horizontal={false} />
              <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={v=>v>1000?`${(v/1000).toFixed(0)}k`:v} />
              <YAxis dataKey="severity" type="category" stroke="#64748B" width={65} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} cursor={{fill:'var(--surface-hover)'}} formatter={v=>[v.toLocaleString(),'Events']} />
              <Bar dataKey="count" radius={[0,4,4,0]} barSize={30}>
                {severity.map((e,i) => <Cell key={i} fill={SEVERITY_COLORS[e.severity]||'#64748B'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Threat × Protocol Matrix */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface-hover/30">
          <h3 className="text-sm font-semibold text-text-primary">Threat × Protocol Analysis</h3>
          <p className="text-xs text-text-secondary mt-0.5">Cross-tabulation of attack categories and network protocols</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-[11px] text-text-secondary uppercase tracking-wider bg-surface/50">
              <th className="px-5 py-3 text-left font-medium">Threat</th>
              <th className="px-5 py-3 text-left font-medium">Protocol</th>
              <th className="px-5 py-3 text-right font-medium">Count</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {matrix.slice(0,20).map((r,i) => (
                <tr key={i} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-2.5 text-text-primary font-medium">{r.threat}</td>
                  <td className="px-5 py-2.5 text-text-secondary font-mono text-xs uppercase bg-background/50">{r.protocol}</td>
                  <td className="px-5 py-2.5 text-text-secondary text-right">{r.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attack Ranking */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-surface-hover/30">
          <h3 className="text-sm font-semibold text-text-primary">Attack Category Ranking</h3>
          <p className="text-xs text-text-secondary mt-0.5">Top threat categories by volume and impact</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-[11px] text-text-secondary uppercase tracking-wider bg-surface/50">
              <th className="px-5 py-3 text-left font-medium">Category</th>
              <th className="px-5 py-3 text-right font-medium">Events</th>
              <th className="px-5 py-3 text-right font-medium">Packets</th>
              <th className="px-5 py-3 text-right font-medium">Bytes</th>
              <th className="px-5 py-3 text-right font-medium">Avg Rate</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {ranking.map((r,i) => (
                <tr key={i} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-2.5 text-text-primary font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:THREAT_COLORS[r.category]||'#64748B'}} />{r.category}
                  </td>
                  <td className="px-5 py-2.5 text-text-secondary text-right">{r.event_count.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-text-secondary text-right">{r.total_packets.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-text-secondary text-right bg-background/50">{(r.total_bytes/1024/1024).toFixed(1)} MB</td>
                  <td className="px-5 py-2.5 text-text-secondary text-right font-mono text-xs">{r.avg_rate.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
