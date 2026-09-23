import React from 'react';

export default function ChartCard({ title, subtitle, icon: Icon, children, className = '' }) {
  return (
    <div className={`glass-panel flex flex-col p-0 overflow-hidden ${className}`}>
      <div className="flex items-start justify-between bg-surface-hover/30 p-4 border-b border-border shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
        {Icon && <Icon size={16} className="text-text-muted" />}
      </div>
      <div className="flex-1 w-full min-h-0 p-4 min-w-0">{children}</div>
    </div>
  );
}
