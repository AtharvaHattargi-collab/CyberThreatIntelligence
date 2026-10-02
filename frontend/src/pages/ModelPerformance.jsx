import React, { useEffect, useState } from 'react';
import { mlAPI } from '../api/client';
import MetricCard from '../components/ui/MetricCard';
import ChartCard from '../components/ui/ChartCard';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { BarChart3, Crosshair, Target, ShieldCheck, Database, BrainCircuit, Activity, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export default function ModelPerformance() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [perf, setPerf] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);

  useEffect(() => {
    Promise.all([
      mlAPI.getPerformance(),
      mlAPI.getFeatureImportance().catch(() => null)
    ])
      .then(([perfData, featData]) => { 
        setPerf(perfData); 
        if (featData) {
          // Process features for chart
          const formattedFeats = featData.features.slice(0, 10).map(f => ({
            name: f.name,
            importance: f.importance * 100
          }));
          setFeatureImportance(formattedFeats);
        }
        setLoading(false); 
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingSkeleton cards={4} chart rows={3} />;
  if (error) return <EmptyState isError title="Unable to load model performance" message={error} />;

  // Format Classification Report for Bar Chart
  const classReport = Object.entries(perf.classification_report)
    .filter(([key]) => key !== 'accuracy' && key !== 'macro avg' && key !== 'weighted avg')
    .map(([cls, metrics]) => ({
      name: cls === '0' ? 'Normal' : 'Anomaly',
      precision: metrics.precision * 100,
      recall: metrics.recall * 100,
      f1: ((metrics['f1-score'] ?? metrics.f1_score) || 0) * 100
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Model Performance</h2>
          <p className="text-xs text-text-secondary mt-1">Evaluation metrics from the held-out UNSW-NB15 testing partition</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
        <MetricCard label="Accuracy" value={(perf.accuracy * 100).toFixed(2)} suffix="%" icon={Target} />
        <MetricCard label="Precision (Macro)" value={(perf.classification_report['macro avg'].precision * 100).toFixed(2)} suffix="%" icon={Crosshair} />
        <MetricCard label="Recall (Macro)" value={(perf.classification_report['macro avg'].recall * 100).toFixed(2)} suffix="%" icon={Activity} />
        <MetricCard label="F1 Score (Macro)" value={(((perf.classification_report['macro avg']['f1-score'] ?? perf.classification_report['macro avg'].f1_score) || 0) * 100).toFixed(2)} suffix="%" icon={BarChart3} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        {/* Confusion Matrix */}
        <div className="glass-panel lg:col-span-1 p-0 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-border bg-surface-hover/30 flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Confusion Matrix</h3>
          </div>
          <div className="p-5 flex-1 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-1 w-full max-w-[280px] text-center text-[11px]">
              <div />
              <div className="text-text-secondary font-medium pb-2 border-b border-border uppercase tracking-wider">Pred Normal</div>
              <div className="text-text-secondary font-medium pb-2 border-b border-border uppercase tracking-wider">Pred Anomaly</div>
              
              <div className="text-text-secondary font-medium pr-3 border-r border-border flex items-center justify-end uppercase tracking-wider text-right">True<br/>Normal</div>
              <div className="bg-safe/10 text-safe p-4 rounded-lg font-mono font-bold border border-safe/20 text-sm shadow-inner">{perf.confusion_matrix[0][0].toLocaleString()}</div>
              <div className="bg-danger/5 text-danger p-4 rounded-lg font-mono border border-danger/10 shadow-inner">{perf.confusion_matrix[0][1].toLocaleString()}</div>
              
              <div className="text-text-secondary font-medium pr-3 border-r border-border flex items-center justify-end uppercase tracking-wider text-right">True<br/>Anomaly</div>
              <div className="bg-warning/5 text-warning p-4 rounded-lg font-mono border border-warning/10 shadow-inner">{perf.confusion_matrix[1][0].toLocaleString()}</div>
              <div className="bg-safe/10 text-safe p-4 rounded-lg font-mono font-bold border border-safe/20 text-sm shadow-inner">{perf.confusion_matrix[1][1].toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Per-Class Metrics */}
        <ChartCard title="Per-Class Performance" subtitle="Precision, Recall, and F1 by class" icon={BarChart3} className="lg:col-span-2 min-h-[300px]">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={classReport} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1D2733" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickMargin={10} />
              <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12px', padding: '8px 12px' }} 
                itemStyle={{ color: 'var(--text-primary)' }}
                cursor={{ fill: 'var(--surface-hover)' }}
                formatter={v => [`${v.toFixed(2)}%`]}
              />
              <Bar dataKey="precision" name="Precision" fill="#3B82F6" radius={[4,4,0,0]} barSize={40} />
              <Bar dataKey="recall" name="Recall" fill="#10B981" radius={[4,4,0,0]} barSize={40} />
              <Bar dataKey="f1" name="F1 Score" fill="#F59E0B" radius={[4,4,0,0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      
      {featureImportance && (
        <ChartCard title="Global Feature Importance" subtitle="Top 10 features influencing the Random Forest model" icon={BarChart2} className="min-h-[360px]">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureImportance} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1D2733" horizontal={false} />
              <XAxis type="number" stroke="#64748B" fontSize={11} domain={[0, 'auto']} tickFormatter={v => `${v}%`} />
              <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} width={120} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12px', padding: '8px 12px' }} 
                itemStyle={{ color: 'var(--text-primary)' }}
                cursor={{ fill: 'var(--surface-hover)' }}
                formatter={v => [`${v.toFixed(2)}%`, 'Importance']}
              />
              <Bar dataKey="importance" name="Importance" fill="#8B5CF6" radius={[0,4,4,0]} barSize={16}>
                 {featureImportance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#8B5CF6' : '#6366F1'} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
        <div className="glass-panel p-5">
          <p className="section-label mb-4 flex items-center gap-2"><BrainCircuit size={14} className="text-primary"/> Model Methodology</p>
          <div className="space-y-3">
            <div className="flex justify-between pb-3 border-b border-border"><span className="text-sm text-text-secondary">Algorithm</span><span className="text-sm font-medium text-text-primary bg-background px-2 py-1 rounded">Random Forest Classifier</span></div>
            <div className="flex justify-between pb-3 border-b border-border"><span className="text-sm text-text-secondary">Features Used</span><span className="text-sm font-medium text-text-primary">39</span></div>
            <div className="flex justify-between pb-3 border-b border-border"><span className="text-sm text-text-secondary">Objective</span><span className="text-sm font-medium text-text-primary">Binary Classification (Normal/Anomaly)</span></div>
            <div className="flex justify-between"><span className="text-sm text-text-secondary">Preprocessing</span><span className="text-sm font-medium text-text-primary text-right">StandardScaler, OneHotEncoder</span></div>
          </div>
        </div>

        <div className="glass-panel p-5">
          <p className="section-label mb-4 flex items-center gap-2"><Database size={14} className="text-primary"/> Dataset Methodology</p>
          <div className="space-y-3">
            <div className="flex justify-between pb-3 border-b border-border"><span className="text-sm text-text-secondary">Dataset Base</span><span className="text-sm font-medium text-text-primary font-mono">UNSW-NB15</span></div>
            <div className="flex justify-between pb-3 border-b border-border"><span className="text-sm text-text-secondary">Training Partition</span><span className="text-sm font-medium text-text-primary text-right">UNSW_NB15_training-set.parquet<br/><span className="text-[10px] text-text-muted">175,341 records</span></span></div>
            <div className="flex justify-between pb-3 border-b border-border"><span className="text-sm text-text-secondary">Evaluation Partition</span><span className="text-sm font-medium text-text-primary text-right">UNSW_NB15_testing-set.parquet<br/><span className="text-[10px] text-text-muted">82,332 records</span></span></div>
            <div className="flex justify-between"><span className="text-sm text-text-secondary">Class Imbalance Handling</span><span className="text-sm font-medium text-text-primary">Implicit Class Weights</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
