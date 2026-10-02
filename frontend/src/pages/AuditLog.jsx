import React, { useState } from 'react';
import { FileText, ShieldAlert, Clock, User, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

const SYSTEM_LOGS = [
  { id: 'AL-9081', user: 'admin', action: 'Login Success', resource: 'Auth API', ip: '192.168.1.45', status: 'SUCCESS', time: 'Just now' },
  { id: 'AL-9080', user: 'system', action: 'Data Ingestion', resource: 'Database', ip: '127.0.0.1', status: 'SUCCESS', time: '5 mins ago' },
  { id: 'AL-9079', user: 'analyst1', action: 'Incident Status Update', resource: 'Incident #45', ip: '10.0.0.23', status: 'SUCCESS', time: '12 mins ago' },
  { id: 'AL-9078', user: 'unknown', action: 'Failed Login Attempt', resource: 'Auth API', ip: '185.12.3.99', status: 'FAILURE', time: '1 hr ago' },
  { id: 'AL-9077', user: 'system', action: 'Model Retraining', resource: 'RandomForest', ip: '127.0.0.1', status: 'WARNING', time: '2 hrs ago' },
  { id: 'AL-9076', user: 'admin', action: 'Workspace Settings Update', resource: 'Config', ip: '192.168.1.45', status: 'SUCCESS', time: '3 hrs ago' },
  { id: 'AL-9075', user: 'unknown', action: 'API Rate Limit Exceeded', resource: 'Events API', ip: '203.45.1.22', status: 'FAILURE', time: '5 hrs ago' },
];

export default function AuditLog() {
  const [logs] = useState(SYSTEM_LOGS);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">System Audit Log</h2>
          <p className="text-xs text-text-secondary mt-1">Immutable record of system and user activities</p>
        </div>
        <div className="flex gap-2">
           <button className="btn-secondary text-xs">Export CSV</button>
        </div>
      </div>
      
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-text-secondary uppercase bg-surface-hover/50 border-b border-border tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Log ID</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3">Source IP</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-hover/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-text-muted">{log.id}</td>
                  <td className="px-5 py-3.5 text-xs text-text-secondary flex items-center gap-1.5"><Clock size={12} className="text-text-muted" />{log.time}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <User size={10} className="text-primary" />
                       </div>
                       <span className={`text-xs font-medium ${log.user === 'unknown' ? 'text-danger' : 'text-text-primary'}`}>{log.user}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-text-primary font-medium text-[13px]">{log.action}</td>
                  <td className="px-5 py-3.5 text-text-secondary font-mono text-[11px] bg-background/50 px-2 py-1 rounded inline-block mt-2">{log.resource}</td>
                  <td className="px-5 py-3.5 text-text-muted font-mono text-xs">{log.ip}</td>
                  <td className="px-5 py-3.5 text-right">
                    {log.status === 'SUCCESS' ? (
                       <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-safe/10 text-safe border border-safe/20"><CheckCircle size={10} /> SUCCESS</span>
                    ) : log.status === 'FAILURE' ? (
                       <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-danger/10 text-danger border border-danger/20"><AlertTriangle size={10} /> FAILURE</span>
                    ) : (
                       <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20"><Activity size={10} /> WARNING</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
