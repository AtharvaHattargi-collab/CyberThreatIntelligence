import React, { useState } from 'react';
import { Settings, Shield, Bell, Database, Monitor, Server, Clock, Palette } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function WorkspaceSettings() {
  const { preferences, updatePreference, theme, setTheme } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('workspace');
  const [workspaceName, setWorkspaceName] = useState('Cyber Threat Intelligence SOC');
  const [environment, setEnvironment] = useState('Production');
  const [sessionTimeout, setSessionTimeout] = useState('120');
  
  const [saveStatus, setSaveStatus] = useState('');

  const handleSave = () => {
    setSaveStatus('Saving...');
    setTimeout(() => {
      setSaveStatus('Settings saved successfully');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Settings size={20} className="text-primary" /> Workspace Settings
          </h2>
          <p className="text-sm text-text-secondary mt-1">Configure global platform behavior and preferences.</p>
        </div>
        <button onClick={handleSave} className="btn-primary px-6">Save Changes</button>
      </div>
      
      {saveStatus && (
        <div className={`p-3 rounded border text-sm font-semibold mb-4 ${saveStatus.includes('success') ? 'bg-safe/10 border-safe/30 text-safe' : 'bg-primary/10 border-primary/30 text-primary'}`}>
          {saveStatus}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full min-w-0">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`w-full p-4 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'workspace' ? 'bg-surface border border-border text-text-primary' : 'bg-transparent text-text-muted hover:bg-surface-hover hover:text-text-primary'}`}
          >
            <Monitor size={18} className={activeTab === 'workspace' ? 'text-primary' : ''} />
            <span className="text-sm font-semibold">Workspace</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('appearance')}
            className={`w-full p-4 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'appearance' ? 'bg-surface border border-border text-text-primary' : 'bg-transparent text-text-muted hover:bg-surface-hover hover:text-text-primary'}`}
          >
            <Palette size={18} className={activeTab === 'appearance' ? 'text-primary' : ''} />
            <span className="text-sm font-semibold">Appearance</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full p-4 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'security' ? 'bg-surface border border-border text-text-primary' : 'bg-transparent text-text-muted hover:bg-surface-hover hover:text-text-primary'}`}
          >
            <Shield size={18} className={activeTab === 'security' ? 'text-primary' : ''} />
            <span className="text-sm font-semibold">Security</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full p-4 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'notifications' ? 'bg-surface border border-border text-text-primary' : 'bg-transparent text-text-muted hover:bg-surface-hover hover:text-text-primary'}`}
          >
            <Bell size={18} className={activeTab === 'notifications' ? 'text-primary' : ''} />
            <span className="text-sm font-semibold">Notifications</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('data')}
            className={`w-full p-4 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'data' ? 'bg-surface border border-border text-text-primary' : 'bg-transparent text-text-muted hover:bg-surface-hover hover:text-text-primary'}`}
          >
            <Database size={18} className={activeTab === 'data' ? 'text-primary' : ''} />
            <span className="text-sm font-semibold">Data & System</span>
          </button>
        </div>

        {/* Settings Panels */}
        <div className="md:col-span-3 space-y-6">
          
          {/* WORKSPACE TAB */}
          {activeTab === 'workspace' && (
            <div className="card animate-fade-in">
              <h3 className="section-label mb-4">Workspace Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Workspace Name</label>
                  <input type="text" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} className="input w-full mt-1" />
                </div>
                <div>
                  <label className="input-label">Environment</label>
                  <select value={environment} onChange={e => setEnvironment(e.target.value)} className="input w-full mt-1">
                    <option value="Development">Development</option>
                    <option value="Staging">Staging</option>
                    <option value="Production">Production</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card">
                <h3 className="section-label mb-4">Theme Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Global Theme</p>
                      <p className="text-xs text-text-secondary">Select your preferred color scheme.</p>
                    </div>
                    <select value={theme} onChange={e => setTheme(e.target.value)} className="input w-36">
                      <option value="dark">Dark (SOC)</option>
                      <option value="light">Light</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div onClick={() => setTheme('dark')} className={`cursor-pointer rounded-xl border-2 p-1 transition-colors ${theme === 'dark' ? 'border-primary' : 'border-transparent'}`}>
                      <div className="bg-[#070A0F] rounded-lg h-24 border border-[#1D2733] flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#111923] border border-[#1D2733]" />
                        <span className="text-[#F8FAFC] text-[10px] font-medium">Dark (SOC)</span>
                      </div>
                    </div>
                    
                    <div onClick={() => setTheme('light')} className={`cursor-pointer rounded-xl border-2 p-1 transition-colors ${theme === 'light' ? 'border-primary' : 'border-transparent'}`}>
                      <div className="bg-[#F8FAFC] rounded-lg h-24 border border-[#E2E8F0] flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#FFFFFF] border border-[#E2E8F0]" />
                        <span className="text-[#0F172A] text-[10px] font-medium">Light</span>
                      </div>
                    </div>

                    <div onClick={() => setTheme('system')} className={`cursor-pointer rounded-xl border-2 p-1 transition-colors ${theme === 'system' ? 'border-primary' : 'border-transparent'}`}>
                      <div className="bg-gradient-to-r from-[#070A0F] to-[#F8FAFC] rounded-lg h-24 border border-border flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border z-10" />
                        <span className="text-white mix-blend-difference text-[10px] font-medium z-10">System</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="section-label mb-4">UI Behavior</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Animations</p>
                      <p className="text-xs text-text-secondary">Enable UI transitions and data stream effects.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={preferences.animations} onChange={() => updatePreference('animations', !preferences.animations)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Compact Mode</p>
                      <p className="text-xs text-text-secondary">Reduce padding and spacing in tables and lists.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={preferences.compactMode} onChange={() => updatePreference('compactMode', !preferences.compactMode)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="card animate-fade-in">
              <h3 className="section-label mb-4">Security Policies</h3>
              <div className="space-y-4">
                <div>
                  <label className="input-label flex items-center gap-2"><Clock size={14} /> Session Timeout (minutes)</label>
                  <input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} className="input w-32 mt-1" />
                  <p className="text-xs text-text-muted mt-2">Automatically log out users after a period of inactivity.</p>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="card animate-fade-in">
              <h3 className="section-label mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {['Security Alerts', 'Critical Threat Detections', 'System Maintenance', 'ML Model Anomalies'].map(label => (
                  <div key={label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{label}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DATA & SYSTEM TAB */}
          {activeTab === 'data' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card">
                <h3 className="section-label mb-4 flex items-center gap-2"><Database size={16} /> Dataset Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface p-4 rounded border border-border">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Active Dataset</p>
                    <p className="text-sm font-semibold text-text-primary">UNSW-NB15</p>
                  </div>
                  <div className="bg-surface p-4 rounded border border-border">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Total Records</p>
                    <p className="text-sm font-semibold text-text-primary">257,673</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="section-label mb-4">Monitoring & Auto-Refresh</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Global Auto-Refresh Rate</p>
                    <p className="text-xs text-text-secondary">Frequency of backend data polling.</p>
                  </div>
                  <select value={preferences.autoRefresh} onChange={e => updatePreference('autoRefresh', e.target.value)} className="input w-36">
                    <option value="false">Disabled</option>
                    <option value="5000">5 seconds</option>
                    <option value="15000">15 seconds</option>
                    <option value="30000">30 seconds</option>
                    <option value="60000">60 seconds</option>
                  </select>
                </div>
              </div>

              <div className="card bg-surface/30">
                <h3 className="section-label mb-2 flex items-center gap-2"><Server size={16} /> System About</h3>
                <p className="text-xs text-text-secondary mb-1">Version: 2.0.0 (Enterprise)</p>
                <p className="text-xs text-text-secondary">Tech Stack: React, Tailwind, FastAPI, PostgreSQL, Scikit-Learn</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
