import React from 'react';
import { User, Settings, LogOut, Layout, Keyboard, Moon, Shield, Lock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ProfileDropdown({ open, onClose, onOpenShortcuts }) {
  const { preferences, updatePreference, theme, setTheme } = useAppContext();
  const { user, logout, isAdmin } = useAuth();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-14 right-4 w-64 bg-surface border border-border shadow-xl rounded-xl z-50 overflow-hidden animate-fade-in">
        <div className="px-4 py-3 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">{user?.username || 'System Admin'}</p>
              <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">{user?.role || 'Cyber Security Analyst'}</p>
            </div>
          </div>
        </div>
        
        <div className="p-2 border-b border-border">
          <p className="px-2 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">Preferences</p>
          <div className="space-y-1">
            <button 
              onClick={() => updatePreference('animations', !preferences.animations)}
              className="w-full flex items-center justify-between px-2 py-2 rounded hover:bg-surface-hover text-xs text-text-primary transition-colors"
            >
              <span className="flex items-center gap-2"><Layout size={14} className="text-text-muted" /> Animations</span>
              <div className={`w-6 h-3.5 rounded-full relative transition-colors ${preferences.animations ? 'bg-primary' : 'bg-surface-hover border border-border'}`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all ${preferences.animations ? 'left-3' : 'left-0.5'}`} />
              </div>
            </button>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              className="w-full flex items-center justify-between px-2 py-2 rounded hover:bg-surface-hover text-xs text-text-primary transition-colors"
            >
              <span className="flex items-center gap-2"><Moon size={14} className="text-text-muted" /> Theme: {theme}</span>
              <div className="w-6 h-3.5 rounded-full relative bg-primary transition-colors">
                <div className="absolute top-0.5 left-3 w-2.5 h-2.5 rounded-full bg-white" />
              </div>
            </button>
          </div>
        </div>

        <div className="p-2">
          <div className="space-y-1">
            <button 
              onClick={() => { onClose(); onOpenShortcuts(); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-surface-hover text-xs text-text-primary transition-colors"
            >
              <Keyboard size={14} className="text-text-muted" /> Keyboard Shortcuts
            </button>
            <Link 
              to="/settings" 
              onClick={onClose}
              className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-surface-hover text-xs text-text-primary transition-colors"
            >
              <Settings size={14} className="text-text-muted" /> Workspace Settings
            </Link>
            {isAdmin && (
              <Link 
                to="/users" 
                onClick={onClose}
                className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-surface-hover text-xs text-text-primary transition-colors"
              >
                <Shield size={14} className="text-text-muted" /> User Management
              </Link>
            )}
            <button 
              className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-surface-hover text-xs text-text-primary transition-colors"
            >
              <Lock size={14} className="text-text-muted" /> Change Password
            </button>
            <div className="pt-1 mt-1 border-t border-border">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-danger/10 text-xs text-danger transition-colors"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
