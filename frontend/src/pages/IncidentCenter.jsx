import React, { useEffect, useState, useCallback } from 'react';
import { incidentsAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import Drawer from '../components/ui/Drawer';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { AlertCircle, RefreshCw, Send, ShieldAlert, Activity, Filter, Layers, Plus, Upload } from 'lucide-react';

export default function IncidentCenter() {
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: '' });
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loadingIncident, setLoadingIncident] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [addMode, setAddMode] = useState('manual');
  const [newIncident, setNewIncident] = useState({ threat_category: '', severity: 'LOW' });
  const [pdfFile, setPdfFile] = useState(null);
  const [addingIncident, setAddingIncident] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await incidentsAPI.getIncidents(filters);
      setIncidents(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const handleAddIncident = async (e) => {
    e.preventDefault();
    setAddingIncident(true);
    try {
      if (addMode === 'manual') {
        await incidentsAPI.createIncident(newIncident);
      } else if (addMode === 'pdf' && pdfFile) {
        await incidentsAPI.uploadIncidentPdf(pdfFile);
      }
      setAddDrawerOpen(false);
      setNewIncident({ threat_category: '', severity: 'LOW' });
      setPdfFile(null);
      fetchIncidents();
    } catch (err) {
      alert("Error: " + err.message);
    }
    setAddingIncident(false);
  };

  const openIncident = async (id) => {
    setLoadingIncident(true);
    setDrawerOpen(true);
    try {
      const data = await incidentsAPI.getIncident(id);
      setSelectedIncident(data);
    } catch {}
    setLoadingIncident(false);
  };

  const updateStatus = async (status) => {
    if (!selectedIncident) return;
    setUpdatingStatus(true);
    try {
      await incidentsAPI.updateStatus(selectedIncident.id, status);
      setSelectedIncident(prev => ({ ...prev, status }));
      setIncidents(prev => prev.map(i => i.id === selectedIncident.id ? { ...i, status } : i));
    } catch {}
    setUpdatingStatus(false);
  };

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || !selectedIncident) return;
    try {
      const note = await incidentsAPI.addNote(selectedIncident.id, noteContent);
      setSelectedIncident(prev => ({ ...prev, notes: [note, ...prev.notes] }));
      setIncidents(prev => prev.map(i => i.id === selectedIncident.id ? { ...i, notes_count: i.notes_count + 1 } : i));
      setNoteContent('');
    } catch {}
  };

  const groupedIncidents = {
    CRITICAL: incidents.filter(i => i.severity === 'CRITICAL').slice(0, 15),
    HIGH: incidents.filter(i => i.severity === 'HIGH').slice(0, 15),
    MEDIUM: incidents.filter(i => i.severity === 'MEDIUM').slice(0, 15),
    LOW: incidents.filter(i => i.severity === 'LOW').slice(0, 15),
  };

  const Section = ({ title, items, colorClass }) => {
    if (items.length === 0 && !loading) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
             <div className={`w-3 h-3 rounded-full ${colorClass}`} />
             <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">{title}</h3>
          </div>
          <div className="h-px bg-border flex-1" />
          <span className="text-xs font-semibold text-text-muted">{items.length} Incidents</span>
        </div>
        
        {loading ? (
           <LoadingSkeleton cards={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full min-w-0">
            {items.map(inc => (
              <div key={inc.id} onClick={() => openIncident(inc.id)} className="card card-hover cursor-pointer p-0 overflow-hidden flex flex-col group relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`} />
                <div className="p-5 flex-1 pl-6">
                  <div className="flex items-start justify-between mb-4">
                    <StatusBadge value={inc.severity} />
                    <StatusBadge value={inc.status} />
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-1 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-primary" /> {inc.threat_category}
                  </h3>
                  <p className="text-xs text-text-secondary font-mono">{inc.protocol} / {inc.service}</p>
                </div>
                <div className="px-5 py-3 pl-6 border-t border-border bg-surface-hover/50 flex items-center justify-between text-xs text-text-muted group-hover:bg-surface-hover transition-colors">
                  <span className="flex items-center gap-1.5"><Activity size={12} /> {inc.event_count.toLocaleString()} events</span>
                  <span className="flex items-center gap-1.5"><Layers size={12} /> {inc.notes_count} notes</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Incident Management</h2>
          <p className="text-xs text-text-secondary mt-1">Grouped threat vectors categorized by severity</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="input w-auto text-xs py-2">
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
          </select>
          <button onClick={() => setAddDrawerOpen(true)} className="btn-primary text-xs"><Plus size={14} /> Add Incident</button>
          <button onClick={fetchIncidents} className="btn-secondary text-xs"><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {error ? (
        <EmptyState isError title="Failed to load incidents" message={error} onRetry={fetchIncidents} />
      ) : !loading && incidents.length === 0 ? (
        <EmptyState icon={AlertCircle} title="No incidents found" message="Try adjusting your filters." />
      ) : (
        <div>
          <Section title="Critical Priority" items={groupedIncidents.CRITICAL} colorClass="bg-danger" />
          <Section title="High Priority" items={groupedIncidents.HIGH} colorClass="bg-warning" />
          <Section title="Medium Priority" items={groupedIncidents.MEDIUM} colorClass="bg-info" />
          <Section title="Low Priority" items={groupedIncidents.LOW} colorClass="bg-safe" />
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={`Incident #${selectedIncident?.id || ''}`} width="max-w-3xl">
        {loadingIncident ? (
          <LoadingSkeleton rows={10} />
        ) : selectedIncident ? (
          <div className="space-y-6 pb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-5">
                <p className="section-label mb-2">Threat Vector</p>
                <p className="text-xl font-bold text-text-primary mb-1">{selectedIncident.threat_category}</p>
                <p className="text-sm text-text-secondary font-mono bg-background p-2 rounded inline-block">{selectedIncident.protocol} / {selectedIncident.service}</p>
              </div>
              <div className="glass-panel p-5">
                <p className="section-label mb-2">Impact</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-text-secondary">Severity:</span>
                  <StatusBadge value={selectedIncident.severity} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-text-secondary">Events:</span>
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded">{selectedIncident.event_count.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="section-label mb-2">Status Management</p>
                <div className="flex items-center gap-2">
                   <span className="text-xs text-text-secondary">Current Status:</span>
                   <StatusBadge value={selectedIncident.status} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button disabled={updatingStatus || selectedIncident.status === 'Open'} onClick={() => updateStatus('Open')} className="btn-secondary text-xs">Mark Open</button>
                <button disabled={updatingStatus || selectedIncident.status === 'Investigating'} onClick={() => updateStatus('Investigating')} className="btn-secondary text-xs border-warning text-warning hover:bg-warning/10">Mark Investigating</button>
                <button disabled={updatingStatus || selectedIncident.status === 'Resolved'} onClick={() => updateStatus('Resolved')} className="btn-secondary text-xs border-safe text-safe hover:bg-safe/10">Mark Resolved</button>
              </div>
            </div>

            <div className="glass-panel p-5 space-y-4">
              <p className="section-label border-b border-border pb-2">Analyst Notes</p>
              <form onSubmit={addNote} className="flex gap-2">
                <input type="text" value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Add an investigation note..." className="input flex-1 text-sm bg-background" />
                <button type="submit" disabled={!noteContent.trim()} className="btn-primary text-xs px-4"><Send size={14} /></button>
              </form>
              <div className="space-y-3 mt-4">
                {selectedIncident.notes.length === 0 ? (
                  <p className="text-sm text-text-muted italic text-center py-4 bg-background/50 rounded-lg">No notes yet.</p>
                ) : (
                  selectedIncident.notes.map(note => (
                    <div key={note.id} className="bg-background p-4 rounded-lg border border-border">
                      <p className="text-sm text-text-primary">{note.content}</p>
                      <div className="flex items-center justify-between mt-3 text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                        <span className="text-primary">{note.author}</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-panel p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <p className="section-label">Related Events (Sample)</p>
                <span className="text-xs text-text-muted">Max 50 events</span>
              </div>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto rounded-lg border border-border custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="bg-surface sticky top-0 border-b border-border z-10">
                    <tr className="text-[10px] text-text-secondary uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-medium">ID</th>
                      <th className="px-4 py-3 text-left font-medium">State</th>
                      <th className="px-4 py-3 text-right font-medium">Packets</th>
                      <th className="px-4 py-3 text-right font-medium">Bytes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {selectedIncident.related_events.map(ev => (
                      <tr key={ev.id} className="hover:bg-surface-hover transition-colors">
                        <td className="px-4 py-2.5 text-text-muted font-mono text-xs">{ev.id}</td>
                        <td className="px-4 py-2.5 text-text-secondary font-mono text-xs">{ev.state}</td>
                        <td className="px-4 py-2.5 text-text-secondary text-right">{ev.packets.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-text-secondary text-right">{(ev.bytes_transferred/1024).toFixed(1)} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : null}
      </Drawer>

      <Drawer open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)} title="Add New Incident" width="max-w-md">
        <div className="space-y-6">
          <div className="flex border-b border-border">
            <button onClick={() => setAddMode('manual')} className={`flex-1 py-2 text-sm font-medium ${addMode === 'manual' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}>Manual Entry</button>
            <button onClick={() => setAddMode('pdf')} className={`flex-1 py-2 text-sm font-medium ${addMode === 'pdf' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}>Upload PDF</button>
          </div>
          
          <form onSubmit={handleAddIncident} className="space-y-4">
            {addMode === 'manual' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Threat Category</label>
                  <input required type="text" value={newIncident.threat_category} onChange={e => setNewIncident({...newIncident, threat_category: e.target.value})} className="input w-full" placeholder="e.g. DoS, Backdoor" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Severity</label>
                  <select value={newIncident.severity} onChange={e => setNewIncident({...newIncident, severity: e.target.value})} className="input w-full">
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </>
            ) : (
              <div>
                 <label className="block text-xs font-semibold text-text-secondary mb-1">Upload PDF Report</label>
                 <div className="border-2 border-dashed border-border p-6 rounded-lg text-center bg-surface-hover/50">
                    <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files[0])} className="hidden" id="pdf-upload" />
                    <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
                       <Upload size={24} className="text-text-muted mb-2" />
                       <span className="text-sm font-medium text-text-primary">{pdfFile ? pdfFile.name : 'Click to upload or drag and drop'}</span>
                       <span className="text-xs text-text-muted mt-1">PDF up to 10MB</span>
                    </label>
                 </div>
              </div>
            )}
            
            <div className="pt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setAddDrawerOpen(false)} className="btn-secondary text-sm">Cancel</button>
              <button type="submit" disabled={addingIncident || (addMode==='pdf' && !pdfFile) || (addMode==='manual' && !newIncident.threat_category)} className="btn-primary text-sm">
                {addingIncident ? 'Saving...' : 'Add Incident'}
              </button>
            </div>
          </form>
        </div>
      </Drawer>
    </div>
  );
}
