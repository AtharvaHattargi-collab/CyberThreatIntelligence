import React, { useState } from 'react';
import { Filter, Save, X, Bookmark } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function GlobalFilters({ currentFilters, onFilterChange }) {
  const { savedViews, saveView } = useAppContext();
  const [viewName, setViewName] = useState('');
  const [saving, setSaving] = useState(false);

  const hasFilters = Object.values(currentFilters).some(v => v);

  const handleSaveView = () => {
    if (viewName.trim()) {
      saveView(viewName, currentFilters);
      setSaving(false);
      setViewName('');
    }
  };

  return (
    <div className="card p-3 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-text-secondary mr-2">
          <Filter size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </div>
        
        <select value={currentFilters.severity || ''} onChange={e => onFilterChange({ ...currentFilters, severity: e.target.value })} className="input w-auto text-xs py-1.5">
          <option value="">Any Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select value={currentFilters.threat_type || ''} onChange={e => onFilterChange({ ...currentFilters, threat_type: e.target.value })} className="input w-auto text-xs py-1.5">
          <option value="">Any Threat</option>
          <option value="Generic">Generic</option>
          <option value="Exploits">Exploits</option>
          <option value="Fuzzers">Fuzzers</option>
          <option value="DoS">DoS</option>
          <option value="Reconnaissance">Reconnaissance</option>
          <option value="Analysis">Analysis</option>
          <option value="Backdoor">Backdoor</option>
          <option value="Shellcode">Shellcode</option>
          <option value="Worms">Worms</option>
        </select>
        
        {hasFilters && (
          <button onClick={() => onFilterChange({})} className="btn-ghost text-xs text-text-muted px-2 py-1 flex items-center gap-1">
            <X size={12} /> Clear All
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {savedViews.length > 0 && (
          <select 
            className="input w-auto text-xs py-1.5 border-primary/30 bg-primary/5"
            onChange={(e) => {
              const view = savedViews.find(v => v.id === e.target.value);
              if (view) onFilterChange(view.filters);
              e.target.value = ""; // Reset select
            }}
          >
            <option value="">Load View...</option>
            {savedViews.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}

        {hasFilters && !saving && (
          <button onClick={() => setSaving(true)} className="btn-secondary text-xs py-1.5 px-3">
            <Bookmark size={12} className="mr-1" /> Save View
          </button>
        )}
        
        {saving && (
          <div className="flex items-center gap-1 bg-surface-hover p-1 rounded-lg border border-border">
            <input 
              autoFocus
              type="text" 
              value={viewName} 
              onChange={e => setViewName(e.target.value)} 
              placeholder="View name..." 
              className="bg-background text-xs px-2 py-1 rounded border border-border outline-none" 
            />
            <button onClick={handleSaveView} disabled={!viewName.trim()} className="text-safe p-1 hover:bg-background rounded"><Save size={14} /></button>
            <button onClick={() => setSaving(false)} className="text-text-muted p-1 hover:bg-background rounded"><X size={14} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
