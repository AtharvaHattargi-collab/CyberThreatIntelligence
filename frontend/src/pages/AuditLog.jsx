import React from 'react';
import { FileText, ShieldAlert } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function AuditLog() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-4">
        <h2 className="text-lg font-bold text-text-primary">System Audit Log</h2>
        <p className="text-xs text-text-secondary mt-1">Immutable record of system and user activities</p>
      </div>
      
      <EmptyState 
        icon={ShieldAlert}
        title="Audit Logging Not Configured"
        message="System audit logging is currently disabled at the database level. Please configure an audit sink (e.g. syslog, Elastic) or enable local PostgreSQL audit logging to view records here."
      />
    </div>
  );
}
