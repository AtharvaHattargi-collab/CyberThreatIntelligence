import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, Radio, ShieldAlert, Network, List, AlertCircle, Cpu, BarChart3, Database, FileText, Settings, X, ChevronRight } from 'lucide-react';
import { eventsAPI } from '../../api/client';
import StatusBadge from './StatusBadge';

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      setResults([]);
      document.body.style.overflow = '';
    }
  }, [open]);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        // Search across events (IDs, threats, protocols, services)
        const data = await eventsAPI.getEvents({ search: query, page_size: 5 });
        setResults(data.records || []);
      } catch (e) {
        setResults([]);
      }
      setSearching(false);
    }, 400); // Debounce
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const commands = [
    { label: 'Go to Overview', path: '/', icon: LayoutDashboard },
    { label: 'Open Threat Monitor', path: '/monitor', icon: Radio },
    { label: 'Open Threat Analytics', path: '/threats', icon: ShieldAlert },
    { label: 'Open Network Analytics', path: '/network', icon: Network },
    { label: 'Open Security Events', path: '/events', icon: List },
    { label: 'Open Incident Center', path: '/incidents', icon: AlertCircle },
    { label: 'Open AI Detection', path: '/detection', icon: Cpu },
    { label: 'Open Model Performance', path: '/performance', icon: BarChart3 },
    { label: 'Open Dataset Explorer', path: '/dataset', icon: Database },
    { label: 'Open Report Center', path: '/reports', icon: FileText },
  ].filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border border-border shadow-2xl rounded-xl overflow-hidden animate-fade-in flex flex-col max-h-[70vh]">
        
        {/* Input */}
        <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-text-primary text-base px-3 focus:outline-none placeholder-text-muted"
            placeholder="Search events, threats, commands..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="btn-ghost p-1"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Static Commands */}
          {commands.length > 0 && (!query || commands.length > 0) && (
            <div className="p-2">
              <p className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">Commands</p>
              {commands.map((cmd) => (
                <button
                  key={cmd.path}
                  onClick={() => handleNavigate(cmd.path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-hover text-sm text-text-primary group transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <cmd.icon size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                    {cmd.label}
                  </span>
                  <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {query && (
            <div className="p-2 border-t border-border">
              <p className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                <span>Event Results</span>
                {searching && <span className="text-primary text-[9px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot"/>Searching...</span>}
              </p>
              {!searching && results.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-text-secondary">No matching events found.</div>
              )}
              {results.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => handleNavigate(`/events?search=${ev.id}`)}
                  className="w-full flex items-start justify-between px-3 py-2.5 rounded-lg hover:bg-surface-hover text-sm text-text-primary text-left transition-colors mb-1"
                >
                  <div>
                    <p className="font-medium flex items-center gap-2">{ev.threat_type || 'Normal Traffic'} <span className="text-[10px] text-text-muted font-mono">{ev.id}</span></p>
                    <p className="text-xs text-text-secondary font-mono mt-0.5">{ev.protocol} / {ev.service}</p>
                  </div>
                  <StatusBadge value={ev.severity} className="shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-background border-t border-border flex items-center gap-4 text-[10px] text-text-muted shrink-0">
          <span className="flex items-center gap-1"><kbd className="bg-surface border border-border rounded px-1.5 py-0.5 font-mono text-[9px]">ESC</kbd> to close</span>
          <span className="flex items-center gap-1"><kbd className="bg-surface border border-border rounded px-1.5 py-0.5 font-mono text-[9px]">ENTER</kbd> to select</span>
        </div>
      </div>
    </div>
  );
}
