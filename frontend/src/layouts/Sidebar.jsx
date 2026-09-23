import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, Radio, ShieldAlert, Network, List, AlertCircle, Cpu, BarChart3, Database, FileText, Wifi, Brain, ChevronLeft, ChevronRight, Activity, User } from 'lucide-react';
import { healthAPI } from '../api/client';
import { useAppContext } from '../context/AppContext';
import SystemHealthModal from '../components/ui/SystemHealthModal';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/monitor', label: 'Threat Monitor', icon: Radio },
  { to: '/threats', label: 'Threat Analytics', icon: ShieldAlert },
  { to: '/network', label: 'Network Analytics', icon: Network },
  { to: '/events', label: 'Security Events', icon: List },
  { to: '/incidents', label: 'Incident Center', icon: AlertCircle },
  { to: '/detection', label: 'AI Detection', icon: Cpu },
  { to: '/performance', label: 'Model Performance', icon: BarChart3 },
];

const systemItems = [
  { to: '/settings', label: 'Workspace Settings', icon: Database },
  { to: '/users', label: 'Users & Access', icon: User },
  { to: '/audit', label: 'Audit Log', icon: FileText },
];

export default function Sidebar({ collapsed, onToggle }) {
  const [apiOk, setApiOk] = useState(null);
  const [dbOk, setDbOk] = useState(null);
  const { addNotification } = useAppContext();
  const { user } = useAuth();
  const [healthOpen, setHealthOpen] = useState(false);

  const [mlOk, setMlOk] = useState(null);
  
  useEffect(() => {
    let lastApi = null;
    const check = async () => {
      try {
        await healthAPI.check();
        if (lastApi === false) addNotification({ type: 'system', title: 'API Gateway Restored', message: 'Connection to backend re-established.' });
        setApiOk(true); lastApi = true;
      } catch {
        if (lastApi === true) addNotification({ type: 'alert', title: 'API Gateway Offline', message: 'Lost connection to backend services.' });
        setApiOk(false); lastApi = false;
      }
      try {
        await healthAPI.database();
        setDbOk(true);
      } catch {
        setDbOk(false);
      }
      try {
        const { mlAPI } = await import('../api/client');
        await mlAPI.getPerformance();
        setMlOk(true);
      } catch {
        setMlOk(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [addNotification]);

  const StatusDot = ({ ok }) => (
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ok === null ? 'bg-text-muted' : ok ? 'bg-safe animate-pulse-dot' : 'bg-danger'}`} />
  );

  const renderNav = (items) => items.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors relative group ${
          isActive
            ? 'bg-primary/15 text-primary font-medium'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r" />}
          <Icon size={18} className="shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  ));

  return (
    <>
      <div className={`${collapsed ? 'w-20' : 'w-[260px]'} bg-sidebar h-screen fixed left-0 top-0 flex flex-col border-r border-border z-30 transition-all duration-300 shadow-2xl`}>
        {/* Brand */}
        <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-primary" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-text-primary tracking-wide leading-tight truncate">Cyber Threat</p>
                <p className="text-[10px] text-text-secondary font-semibold tracking-widest leading-tight uppercase">Intelligence</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {!collapsed && <div className="mb-3 px-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Overview</div>}
          {renderNav(navItems)}
          
          {!collapsed && <div className="mt-8 mb-3 px-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">System</div>}
          {collapsed && <div className="mt-4 mb-2 border-t border-border mx-2" />}
          
          {renderNav(systemItems)}
        </nav>

        {/* System Health */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-border shrink-0 bg-background/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-widest">System Status</span>
              <button onClick={() => setHealthOpen(true)} className="text-text-muted hover:text-primary transition-colors" title="View Details"><Activity size={14} /></button>
            </div>
            <div 
              className="space-y-2.5 bg-surface/50 p-3.5 rounded-xl border border-border text-[11px] cursor-pointer hover:bg-surface transition-colors shadow-inner"
              onClick={() => setHealthOpen(true)}
            >
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-2"><Wifi size={13} />API</span>
                <span className="flex items-center gap-2 font-medium"><StatusDot ok={apiOk} /><span className={apiOk ? 'text-safe' : apiOk === false ? 'text-danger' : 'text-text-muted'}>{apiOk ? 'Operational' : apiOk === false ? 'Offline' : '...'}</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-2"><Database size={13} />PostgreSQL</span>
                <span className="flex items-center gap-2 font-medium"><StatusDot ok={dbOk} /><span className={dbOk ? 'text-safe' : dbOk === false ? 'text-danger' : 'text-text-muted'}>{dbOk ? 'Connected' : dbOk === false ? 'Down' : '...'}</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary flex items-center gap-2"><Brain size={13} />ML Model</span>
                <span className="flex items-center gap-2 font-medium"><StatusDot ok={mlOk} /><span className={mlOk ? 'text-safe' : mlOk === false ? 'text-danger' : 'text-text-muted'}>{mlOk ? 'Ready' : mlOk === false ? 'Offline' : '...'}</span></span>
              </div>
            </div>
          </div>
        )}

        {/* User Profile */}
        <div className={`border-t border-border p-4 flex items-center justify-between bg-surface/30 shrink-0 ${collapsed ? 'flex-col gap-4' : ''}`}>
           {!collapsed ? (
             <div className="flex items-center gap-3 min-w-0">
               <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User size={16} className="text-primary" />
               </div>
               <div className="min-w-0">
                 <p className="text-[13px] font-semibold text-text-primary truncate">{user?.username || 'Analyst'}</p>
                 <p className="text-[10px] text-text-secondary truncate">{user?.email || 'analyst@soc.local'}</p>
               </div>
             </div>
           ) : (
             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto" title={user?.username || 'Analyst'}>
                <User size={18} className="text-primary" />
             </div>
           )}
           <button onClick={onToggle} className={`h-8 w-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface transition-colors shrink-0 ${collapsed ? '' : ''}`} title="Toggle Sidebar">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      <SystemHealthModal open={healthOpen} onClose={() => setHealthOpen(false)} />
    </>
  );
}
