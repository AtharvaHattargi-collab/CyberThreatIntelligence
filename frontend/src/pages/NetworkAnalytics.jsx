import React, { useEffect, useState } from 'react';
import { analyticsAPI } from '../api/client';
import MetricCard from '../components/ui/MetricCard';
import ChartCard from '../components/ui/ChartCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { Activity, Wifi, Network, Server, ArrowRightLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const COLORS = ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#F97316','#06B6D4','#EF4444'];
const tooltipStyle = { backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12px', padding: '8px 12px' };

export default function NetworkAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [services, setServices] = useState([]);
  const [protocols, setProtocols] = useState([]);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const [t,s,p] = await Promise.all([
        analyticsAPI.getTraffic(), analyticsAPI.getServiceDistribution(), analyticsAPI.getProtocolDistribution(),
      ]);
      setTraffic(t); setServices(s); setProtocols(p);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSkeleton cards={4} chart rows={3} />;
  if (error) return <EmptyState isError title="Failed to load network analytics" message={error} onRetry={fetchData} />;

  const byteData = [
    { name: 'Source', value: traffic.source_bytes },
    { name: 'Destination', value: traffic.destination_bytes },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <p className="text-xs text-text-muted italic">Note: The UNSW-NB15 Kaggle partition does not expose endpoint IP addresses.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <MetricCard label="Avg Traffic Rate" value={(traffic.average_rate/1000).toFixed(2)} suffix="kbps" icon={Activity} />
        <MetricCard label="Avg Connection" value={traffic.average_duration.toFixed(3)} suffix="sec" icon={Wifi} />
        <MetricCard label="Avg Src Load" value={(traffic.average_source_load/1e6).toFixed(2)} suffix="Mbps" icon={Network} />
        <MetricCard label="Avg Dest Load" value={(traffic.average_destination_load/1e6).toFixed(2)} suffix="Mbps" icon={Server} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full min-w-0">
        <ChartCard title="Service Distribution" subtitle="Application layer protocol breakdown" icon={Server} className="min-h-[380px]">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={services} margin={{ top:10,right:10,left:0,bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1D2733" vertical={false} />
              <XAxis dataKey="service" stroke="#64748B" angle={-45} textAnchor="end" interval={0} fontSize={11} tickMargin={5} />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={v=>v>1000?`${(v/1000).toFixed(0)}k`:v} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} cursor={{fill:'var(--surface-hover)'}} formatter={v=>[v.toLocaleString(),'Flows']} />
              <Bar dataKey="count" radius={[4,4,0,0]} maxBarSize={45}>
                {services.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Directional Traffic Flow" subtitle="Total bytes by origin" icon={ArrowRightLeft} className="min-h-[380px]">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={byteData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={2} dataKey="value" stroke="none">
                <Cell fill="#3B82F6" /><Cell fill="#10B981" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text-primary)' }} formatter={v => [(v/1024/1024/1024).toFixed(2)+' GB','Volume']} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize:'12px', color:'#94A3B8' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
