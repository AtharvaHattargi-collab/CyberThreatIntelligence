import React from 'react';

export default function MetricCard({ label, value, icon: Icon, suffix, accent = false }) {
  return (
    <div className={`glass-panel card-hover flex flex-col min-w-0 ${accent ? 'border-primary/30' : ''}`}>
      <div className="flex items-start justify-between mb-3 p-4 pb-0 shrink-0">
        <span className="section-label truncate pr-2">{label}</span>
        {Icon && <Icon size={16} className={`shrink-0 ${accent ? 'text-primary' : 'text-text-muted'}`} />}
      </div>
      <p className={`text-2xl font-bold tracking-tight truncate px-4 pb-4 ${accent ? 'text-primary' : 'text-text-primary'}`}>
        {value ?? 'N/A'}
        {suffix && <span className="text-sm font-normal text-text-secondary ml-1">{suffix}</span>}
      </p>
    </div>
  );
}
