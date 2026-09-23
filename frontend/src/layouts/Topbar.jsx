import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Server, Database, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import NotificationPanel from '../components/ui/NotificationPanel';
import ProfileDropdown from '../components/ui/ProfileDropdown';
import { useAppContext } from '../context/AppContext';
import { healthAPI } from '../api/client';

const pageContextMap = {
  '/': { title: 'Security Operations Center', desc: 'Monitor network threats, investigate anomalies and evaluate AI detections.' },
  '/monitor': { title: 'Threat Monitor', desc: 'Dataset event stream — real-time threat feed replay.' },
  '/threats': { title: 'Threat Analytics', desc: 'Attack vector categorization and severity analysis.' },
  '/network': { title: 'Network Analytics', desc: 'Protocol distribution, traffic volumes and service fingerprints.' },
  '/events': { title: 'Security Events', desc: 'Search, filter and investigate raw security event records.' },
  '/incidents': { title: 'Incident Center', desc: 'Manage grouped threat incidents and analyst investigations.' },
  '/detection': { title: 'AI Threat Detection', desc: 'Evaluate network behavior using the trained Random Forest model.' },
  '/performance': { title: 'Model Performance', desc: 'Evaluation metrics from the held-out UNSW-NB15 testing partition.' },
  '/dataset': { title: 'Dataset Explorer', desc: 'UNSW-NB15 dataset schema and distribution metrics.' },
  '/reports': { title: 'Report Center', desc: 'Generate and export security analytics reports.' },
};

export default function Topbar({ onRefresh, isRefreshing, onOpenSearch, onOpenShortcuts }) {
  const location = useLocation();
  const ctx = pageContextMap[location.pathname] || { title: 'Dashboard', desc: '' };
  
  const { notifications } = useAppContext();
  const unreadCount = notifications.filter(n => !n.read).length;

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [apiOk, setApiOk] = useState(true);
  const [dbOk, setDbOk] = useState(true);

  useEffect(() => {
    const check = async () => {
      try { await healthAPI.check(); setApiOk(true); } catch { setApiOk(false); }
      try { await healthAPI.database(); setDbOk(true); } catch { setDbOk(false); }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 glass-panel border-b-0 border-l-0 border-r-0 rounded-none flex items-center justify-between px-6 sticky top-0 z-20 shrink-0 w-full min-w-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 cursor-pointer hover:bg-surface-hover px-2 py-1 rounded transition-colors border border-transparent hover:border-border">
          <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
            WS
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-text-primary">Primary Workspace</span>
              <ChevronDown size={12} className="text-text-muted" />
            </div>
            <span className="text-[10px] text-text-muted">SOC Analytics</span>
          </div>
        </div>

        <div className="w-px h-6 bg-border hidden md:block" />

        <div className="min-w-0 hidden md:block">
          <h1 className="text-sm font-semibold text-text-primary truncate">{ctx.title}</h1>
          <p className="text-[11px] text-text-secondary truncate">{ctx.desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-4 mr-2">
          <div className="flex items-center gap-1.5" title="API Status">
            <Server size={14} className={apiOk ? 'text-safe' : 'text-danger'} />
            <span className="text-xs text-text-muted font-medium">{apiOk ? 'API Online' : 'API Offline'}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Database Status">
            <Database size={14} className={dbOk ? 'text-safe' : 'text-danger'} />
            <span className="text-xs text-text-muted font-medium">{dbOk ? 'DB Connected' : 'DB Error'}</span>
          </div>
        </div>

        <div className="w-px h-6 bg-border hidden lg:block" />

        <div className="relative hidden md:block cursor-text group" onClick={onOpenSearch}>
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors" />
          <div className="bg-surface border border-border rounded-lg text-xs text-text-muted pl-9 pr-3 py-1.5 w-64 flex items-center justify-between group-hover:border-primary/50 transition-colors">
            <span>Search threats, events...</span>
            <kbd className="bg-background border border-border rounded px-1.5 font-mono text-[9px]">CTRL+K</kbd>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className={`btn-ghost relative ${notifOpen ? 'bg-surface-hover' : ''}`} title="Notifications">
            <Bell size={16} className={unreadCount > 0 ? 'text-text-primary' : ''} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger border-2 border-sidebar rounded-full animate-pulse-dot" />
            )}
          </button>
          <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <div className="relative ml-1">
          <button 
            onClick={() => setProfileOpen(!profileOpen)} 
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${profileOpen ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-text-muted hover:text-text-primary hover:border-primary/40'}`}
          >
            <User size={14} />
          </button>
          <ProfileDropdown open={profileOpen} onClose={() => setProfileOpen(false)} onOpenShortcuts={onOpenShortcuts} />
        </div>
      </div>
    </header>
  );
}
