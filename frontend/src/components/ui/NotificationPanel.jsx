import React from 'react';
import { Bell, Check, Trash2, ShieldAlert, Zap, Server, Activity } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function NotificationPanel({ open, onClose }) {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useAppContext();

  if (!open) return null;

  const getIcon = (type) => {
    switch(type) {
      case 'alert': return <ShieldAlert size={14} className="text-danger" />;
      case 'system': return <Server size={14} className="text-info" />;
      case 'ml': return <Zap size={14} className="text-primary" />;
      default: return <Activity size={14} className="text-text-muted" />;
    }
  };

  return (
    <>
      {/* Invisible backdrop to catch clicks outside */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="absolute top-14 right-4 w-80 bg-surface border border-border shadow-xl rounded-xl z-50 flex flex-col max-h-[400px] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={markAllNotificationsRead} className="btn-ghost p-1.5" title="Mark all read"><Check size={14} /></button>
            <button onClick={clearNotifications} className="btn-ghost p-1.5" title="Clear all"><Trash2 size={14} /></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={24} className="text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-secondary">No new notifications</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markNotificationRead(n.id)}
                  className={`p-3 rounded-lg flex items-start gap-3 cursor-pointer transition-colors ${n.read ? 'opacity-60 hover:bg-surface-hover' : 'bg-surface-hover/50 hover:bg-surface-hover border border-border'}`}
                >
                  <div className="mt-0.5 shrink-0 bg-background p-1.5 rounded-full border border-border">
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary font-medium leading-tight">{n.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-text-muted mt-1.5">{new Date(n.timestamp).toLocaleTimeString()}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
