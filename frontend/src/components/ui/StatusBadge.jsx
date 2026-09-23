import React from 'react';

const severityMap = {
  CRITICAL: 'badge-danger',
  HIGH: 'badge-warning',
  MEDIUM: 'badge-info',
  LOW: 'badge-safe',
  Open: 'badge-danger',
  Investigating: 'badge-warning',
  Resolved: 'badge-safe',
};

export default function StatusBadge({ value, className = '' }) {
  const cls = severityMap[value] || 'badge-muted';
  return <span className={`badge ${cls} ${className}`}>{value}</span>;
}
