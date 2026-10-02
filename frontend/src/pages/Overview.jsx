import React, { useEffect, useState } from 'react';
import { analyticsAPI, monitorAPI, mlAPI, healthAPI } from '../api/client';
import MetricCard from '../components/ui/MetricCard';
import ChartCard from '../components/ui/ChartCard';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import GlobalFilters from '../components/ui/GlobalFilters';
import { Activity, ShieldAlert, Target, Database, Zap, Layers, ShieldCheck, Network, Cpu, Wifi, RefreshCw, Server, AlertTriangle, CheckCircle, BrainCircuit } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const THREAT_COLORS = { Generic:'#3B82F6', Analysis:'#6366F1', Fuzzers:'#8B5CF6', DoS:'#F59E0B', Reconnaissance:'#F97316', Exploits:'#EF4444', Backdoor:'#DC2626', Shellcode:'#B91C1C', Worms:'#991B1B' };
const SEVERITY_COLORS = { LOW:'#10B981', MEDIUM:'#3B82F6', HIGH:'#F59E0B', CRITICAL:'#EF4444' };
const tooltipStyle = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12px', padding: '8px 12px' };

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [overview, setOverview] = useState(null);
  const [threats, setThreats] = useState([]);
  const [severity, setSeverity] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [services, setServices] = useState([]);
  const [attackRanking, setAttackRanking] = useState([]);
  const [traffic, setTraffic] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [filters, setFilters] = useState({});
  const [mlPerformance, setMlPerformance] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [sysHealth, setSysHealth] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [ov, th, sv, pr, sr, ar, tr, recent, mlPerf, mlFeat, sys, db] = await Promise.all([
        analyticsAPI.getOverview(filters),
        analyticsAPI.getThreatDistribution(filters),
        analyticsAPI.getSeverity(filters),
        analyticsAPI.getProtocolDistribution(filters),
        analyticsAPI.getServiceDistribution(filters),
        analyticsAPI.getAttackRanking(filters),
        analyticsAPI.getTraffic(filters),
        monitorAPI.getRecent({ limit: 10, ...filters }),
        mlAPI.getPerformance().catch(() => null),
        mlAPI.getFeatureImportance().catch(() => null),
        healthAPI.check().catch(() => null),
        healthAPI.database().catch(() => null),
      ]);
      setOverview(ov); setThreats(th); setSeverity(sv); 
      setProtocols(pr); setServices(sr); setAttackRanking(ar.slice(0, 5)); 
      setTraffic(tr); setRecentEvents(recent);
      setMlPerformance(mlPerf); setFeatureImportance(mlFeat);
      setSysHealth(sys); setDbHealth(db);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };
  
  useEffect(() => { fetchData(); }, [filters]);

  if (loading && !overview) return <LoadingSkeleton cards={4} chart rows={5} />;
  if (error) return <EmptyState isError title="Failed to load dashboard" message={error} onRetry={fetchData} />;

  // Calculate Normal vs Attack for chart
  const normalVsAttack = [
    { name: 'Normal', value: overview.total_normal, color: '#10B981' },
    { name: 'Attack', value: overview.total_attacks, color: '#EF4444' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Security Operations Center</h1>
          <p className="text-sm text-text-secondary mt-1">Monitoring real-time network threats and ML-driven anomalies.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${sysHealth?.status === 'ok' ? 'bg-safe' : 'bg-danger'}`} />
            <span className="text-xs font-medium text-text-secondary">API</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dbHealth?.status === 'ok' ? 'bg-safe' : 'bg-danger'}`} />
            <span className="text-xs font-medium text-text-secondary">DB</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${mlPerformance?.accuracy ? 'bg-safe' : 'bg-danger'}`} />
            <span className="text-xs font-medium text-text-secondary">ML</span>
          </div>
          <button onClick={fetchData} className="ml-2 text-text-muted hover:text-primary transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <GlobalFilters currentFilters={filters} onFilterChange={setFilters} />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full min-w-0">
        <MetricCard label="Total Events" value={overview.total_events?.toLocaleString()} icon={Activity} />
        <MetricCard label="Threats Detected" value={overview.total_attacks?.toLocaleString()} icon={ShieldAlert} />
        <MetricCard label="High Risk" value={overview.high_risk_events?.toLocaleString()} icon={Zap} accent />
        <MetricCard label="Attack Rate" value={`${overview.attack_percentage}%`} icon={Target} />
        <MetricCard label="Normal Traffic" value={overview.total_normal?.toLocaleString()} icon={ShieldCheck} />
        <MetricCard label="Anomalies" value={overview.total_attacks?.toLocaleString()} icon={AlertTriangle} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0">
        <ChartCard title="Threat Distribution" subtitle="Attack categories by volume" icon={ShieldAlert} className="min-h-[300px]">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={threats} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="count" nameKey="category" stroke="none">
                {threats.map((e, i) => <Cell key={i} fill={THREAT_COLORS[e.category] || '#64748B'} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} formatter={(v, n) => [v.toLocaleString(), n]} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Protocol Distribution" subtitle="Top network protocols" icon={Network} className="min-h-[300px]">
           <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={protocols} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="count" nameKey="protocol" stroke="none">
                {protocols.map((e, i) => <Cell key={i} fill={['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899', '#6366F1'][i % 6]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} formatter={(v, n) => [v.toLocaleString(), n]} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Normal vs Attack" subtitle="Traffic classification" icon={Cpu} className="min-h-[300px]">
           <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={normalVsAttack} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" nameKey="name" stroke="none">
                {normalVsAttack.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                <tspan x="50%" dy="-5" fontSize="16" fontWeight="bold" fill="var(--text-primary)">
                  {overview.attack_percentage}%
                </tspan>
                <tspan x="50%" dy="20" fontSize="10" fill="var(--text-secondary)">
                  Attack Rate
                </tspan>
              </text>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} formatter={(v, n) => [v.toLocaleString(), n]} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full min-w-0">
        <ChartCard title="Risk Overview" subtitle="Events by severity level" icon={AlertTriangle} className="min-h-[320px]">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={severity} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickFormatter={v => v > 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <YAxis dataKey="level" type="category" stroke="var(--text-muted)" width={70} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} formatter={v => [v.toLocaleString(), 'Events']} cursor={{ fill:'var(--surface-hover)' }} />
              <Bar dataKey="count" radius={[0,4,4,0]} barSize={24}>
                {severity.map((e, i) => <Cell key={i} fill={SEVERITY_COLORS[e.level?.toUpperCase()] || '#64748B'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Threat Categories" subtitle="By event count" icon={Layers} className="min-h-[320px]">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attackRanking} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickFormatter={v => v > 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <YAxis dataKey="category" type="category" stroke="var(--text-muted)" width={100} fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} formatter={v => [v.toLocaleString(), 'Events']} cursor={{ fill:'var(--surface-hover)' }} />
              <Bar dataKey="event_count" radius={[0,4,4,0]} barSize={24}>
                {attackRanking.map((e, i) => <Cell key={i} fill={THREAT_COLORS[e.category] || '#64748B'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full min-w-0">
        <ChartCard title="Network Activity" subtitle="Volume and throughput" icon={Wifi} className="min-w-0">
           <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Total Bytes</p>
                <p className="text-xl font-bold text-text-primary">{(traffic?.total_bytes / 1024 / 1024).toFixed(2)} <span className="text-sm font-normal text-text-muted">MB</span></p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Total Packets</p>
                <p className="text-xl font-bold text-text-primary">{traffic?.total_packets?.toLocaleString()}</p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Avg Rate</p>
                <p className="text-xl font-bold text-text-primary">{traffic?.average_rate?.toFixed(2)} <span className="text-sm font-normal text-text-muted">pkts/s</span></p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Avg Duration</p>
                <p className="text-xl font-bold text-text-primary">{traffic?.average_duration?.toFixed(4)} <span className="text-sm font-normal text-text-muted">s</span></p>
              </div>
           </div>
        </ChartCard>
        
        <ChartCard title="ML Detection Summary" subtitle="Random Forest Classification" icon={BrainCircuit} className="min-w-0">
           <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Accuracy</p>
                <p className="text-xl font-bold text-text-primary">{mlPerformance?.accuracy ? mlPerformance.accuracy.toFixed(2) : '--'}%</p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold mb-1">F1 Score</p>
                <p className="text-xl font-bold text-text-primary">{mlPerformance?.f1 ? mlPerformance.f1.toFixed(2) : '--'}%</p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Training Records</p>
                <p className="text-xl font-bold text-text-primary">{mlPerformance?.total_training?.toLocaleString() || '175,341'}</p>
              </div>
              <div className="bg-background/50 p-4 rounded-lg border border-border">
                <p className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Testing Records</p>
                <p className="text-xl font-bold text-text-primary">{mlPerformance?.total_testing?.toLocaleString() || '82,332'}</p>
              </div>
           </div>
        </ChartCard>

        <ChartCard title="Top ML Features" subtitle="Feature importance" icon={Cpu} className="min-h-[280px]">
          {featureImportance && featureImportance.features ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={featureImportance.features.slice(0, 5)} layout="vertical" margin={{ left: 20, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} hide />
                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={80} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} formatter={v => [`${(v*100).toFixed(2)}%`, 'Importance']} cursor={{ fill:'var(--surface-hover)' }} />
                <Bar dataKey="importance" fill="var(--primary)" radius={[0,4,4,0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-text-muted text-sm">No feature data available</div>
          )}
        </ChartCard>
      </div>

      {/* Row 4: Recent Events */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-text-primary">Recent Security Events</h3>
            <p className="text-xs text-text-secondary mt-1">Latest logged network events</p>
          </div>
          <button className="text-sm font-medium text-primary hover:text-primary-hover">View all</button>
        </div>
        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-background border-y border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Event ID</th>
                <th className="px-4 py-3 font-medium">Source IP</th>
                <th className="px-4 py-3 font-medium">Dest IP</th>
                <th className="px-4 py-3 font-medium">Protocol</th>
                <th className="px-4 py-3 font-medium">Threat</th>
                <th className="px-4 py-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((evt, i) => (
                <tr key={evt.id || i} className="border-b border-border/50 hover:bg-surface-hover transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs text-text-muted">#{evt.id?.toString().padStart(6, '0')}</td>
                  <td className="px-4 py-3">{evt.srcip}</td>
                  <td className="px-4 py-3">{evt.dstip}</td>
                  <td className="px-4 py-3 text-text-muted">{evt.proto}</td>
                  <td className="px-4 py-3">{evt.attack_cat || 'Normal'}</td>
                  <td className="px-4 py-3">
                    {evt.attack_cat ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20">HIGH</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-safe/10 text-safe border border-safe/20">LOW</span>
                    )}
                  </td>
                </tr>
              ))}
              {recentEvents.length === 0 && (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-text-muted">No recent events found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
