import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { eventsAPI, mlAPI } from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import Drawer from '../components/ui/Drawer';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { Search, Download, ChevronLeft, ChevronRight, X, Shield, Cpu, Zap } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export default function SecurityEvents() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlSearch = searchParams.get('search') || '';

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ current_page:1, total_pages:1, total_count:0, page_size:25 });
  const [search, setSearch] = useState(urlSearch);
  const [filters, setFilters] = useState({ threat_type:'', protocol:'', service:'', severity:'', is_anomaly:'' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [pageSize, setPageSize] = useState(25);

  const fetchEvents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize, search };
      Object.entries(filters).forEach(([k,v]) => { if (v) params[k] = v; });
      const data = await eventsAPI.getEvents(params);
      setEvents(data.records || []);
      setPagination({ current_page: data.current_page, total_pages: data.total_pages, total_count: data.total_count, page_size: pageSize });
    } catch {}
    setLoading(false);
  }, [search, filters, pageSize]);

  useEffect(() => { fetchEvents(1); }, [fetchEvents]);

  useEffect(() => {
    if (urlSearch !== search) {
      setSearch(urlSearch);
    }
  }, [urlSearch]);

  const openEvent = async (id) => {
    try {
      const data = await eventsAPI.getEvent(id);
      setSelectedEvent(data);
      setPrediction(null);
      setDrawerOpen(true);
    } catch {}
  };

  const runAI = async () => {
    if (!selectedEvent) return;
    setPredicting(true);
    try {
      const ml = selectedEvent.ml_features || {};
      const payload = {
        proto: selectedEvent.protocol || 'tcp', state: selectedEvent.state || 'FIN', service: selectedEvent.service || '-',
        spkts: 0, dpkts: 0, sbytes: 0, dbytes: 0, rate: 0, dur: 0, ...ml,
      };
      const result = await mlAPI.predict(payload);
      setPrediction(result);
    } catch {}
    setPredicting(false);
  };

  const clearFilters = () => { setSearch(''); setFilters({ threat_type:'', protocol:'', service:'', severity:'', is_anomaly:'' }); };
  const hasFilters = search || Object.values(filters).some(v => v);

  const handleExport = () => {
    const params = new URLSearchParams({ search, ...filters });
    window.open(`${API_BASE}/events/export?${params}`, '_blank');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter Bar */}
      <div className="card flex flex-col md:flex-row md:items-center gap-3 p-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search threats, protocols..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-xs" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filters.threat_type} onChange={e => setFilters({...filters, threat_type:e.target.value})} className="input w-auto text-xs py-2">
            <option value="">All Threats</option>
            <option value="Generic">Generic</option><option value="Exploits">Exploits</option><option value="Fuzzers">Fuzzers</option><option value="DoS">DoS</option><option value="Reconnaissance">Reconnaissance</option><option value="Analysis">Analysis</option><option value="Backdoor">Backdoor</option><option value="Shellcode">Shellcode</option><option value="Worms">Worms</option>
          </select>
          <select value={filters.protocol} onChange={e => setFilters({...filters, protocol:e.target.value})} className="input w-auto text-xs py-2">
            <option value="">All Protocols</option>
            <option value="tcp">TCP</option><option value="udp">UDP</option><option value="icmp">ICMP</option><option value="ospf">OSPF</option><option value="sctp">SCTP</option><option value="arp">ARP</option>
          </select>
          <select value={filters.severity} onChange={e => setFilters({...filters, severity:e.target.value})} className="input w-auto text-xs py-2">
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
          </select>
          <select value={filters.is_anomaly} onChange={e => setFilters({...filters, is_anomaly:e.target.value})} className="input w-auto text-xs py-2">
            <option value="">All Types</option><option value="true">Anomaly</option><option value="false">Normal</option>
          </select>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="input w-auto text-xs py-2">
            <option value={25}>25/page</option><option value={50}>50/page</option><option value={100}>100/page</option>
          </select>
          {hasFilters && <button onClick={clearFilters} className="btn-ghost text-xs text-text-muted"><X size={14} />Clear</button>}
          <button onClick={handleExport} className="btn-secondary text-xs"><Download size={14} />Export</button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-[11px] text-text-secondary uppercase tracking-wider">
              <th className="px-5 py-2.5 text-left font-medium">ID</th>
              <th className="px-5 py-2.5 text-left font-medium">Threat</th>
              <th className="px-5 py-2.5 text-left font-medium">Protocol</th>
              <th className="px-5 py-2.5 text-left font-medium">Service</th>
              <th className="px-5 py-2.5 text-left font-medium">State</th>
              <th className="px-5 py-2.5 text-right font-medium">Packets</th>
              <th className="px-5 py-2.5 text-right font-medium">Bytes</th>
              <th className="px-5 py-2.5 text-center font-medium">Anomaly</th>
              <th className="px-5 py-2.5 text-right font-medium">Severity</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={9} className="py-12 text-center"><LoadingSkeleton rows={5} /></td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={9}><EmptyState icon={Shield} title="No events found" message="Try adjusting your filters." /></td></tr>
              ) : events.map(ev => (
                <tr key={ev.id} onClick={() => openEvent(ev.id)} className="hover:bg-surface-hover transition-colors cursor-pointer">
                  <td className="px-5 py-2 text-text-muted font-mono text-xs">{ev.id}</td>
                  <td className="px-5 py-2 text-text-primary font-medium">{ev.threat_type || 'Normal'}</td>
                  <td className="px-5 py-2 text-text-secondary font-mono text-xs uppercase">{ev.protocol}</td>
                  <td className="px-5 py-2 text-text-secondary">{ev.service}</td>
                  <td className="px-5 py-2 text-text-secondary font-mono text-xs">{ev.state}</td>
                  <td className="px-5 py-2 text-text-secondary text-right">{ev.packets?.toLocaleString()}</td>
                  <td className="px-5 py-2 text-text-secondary text-right">{(ev.bytes_transferred/1024).toFixed(1)} KB</td>
                  <td className="px-5 py-2 text-center">{ev.is_anomaly ? <span className="w-2 h-2 bg-danger rounded-full inline-block" /> : <span className="w-2 h-2 bg-safe rounded-full inline-block" />}</td>
                  <td className="px-5 py-2 text-right"><StatusBadge value={ev.severity} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-text-muted">Showing {((pagination.current_page-1)*pageSize)+1}–{Math.min(pagination.current_page*pageSize, pagination.total_count)} of {pagination.total_count.toLocaleString()}</span>
          <div className="flex items-center gap-1.5">
            <button disabled={pagination.current_page===1} onClick={() => fetchEvents(pagination.current_page-1)} className="btn-ghost disabled:opacity-30"><ChevronLeft size={16} /></button>
            <span className="text-text-primary px-2">{pagination.current_page} / {pagination.total_pages}</span>
            <button disabled={pagination.current_page===pagination.total_pages} onClick={() => fetchEvents(pagination.current_page+1)} className="btn-ghost disabled:opacity-30"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Investigation Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Event Investigation" subtitle={selectedEvent ? `Event #${selectedEvent.id}` : ''}>
        {selectedEvent && (
          <div className="space-y-6 pb-6">
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => { navigator.clipboard.writeText(selectedEvent.id); }} className="btn-secondary text-xs py-1.5 px-3">
                Copy Event ID
              </button>
              <button onClick={() => {
                const params = new URLSearchParams({ search: selectedEvent.id });
                window.open(`${API_BASE}/events/export?${params}`, '_blank');
              }} className="btn-secondary text-xs py-1.5 px-3">
                <Download size={12} className="mr-1" /> Export Event
              </button>
            </div>
            
            <div>
              <p className="section-label mb-3">EVENT OVERVIEW</p>
              <div className="grid grid-cols-2 gap-3">
                {[['Threat', selectedEvent.threat_type || 'Normal'], ['Protocol', selectedEvent.protocol], ['Service', selectedEvent.service], ['State', selectedEvent.state], ['Anomaly', selectedEvent.is_anomaly ? 'Yes' : 'No'], ['Severity', selectedEvent.severity]].map(([l,v]) => (
                  <div key={l} className="bg-background p-3 rounded-lg border border-border">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{l}</p>
                    <p className="text-sm text-text-primary font-medium">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="section-label mb-3">TRAFFIC</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background p-3 rounded-lg border border-border"><p className="text-[10px] text-text-muted uppercase mb-1">Packets</p><p className="text-sm font-medium text-text-primary">{selectedEvent.packets?.toLocaleString()}</p></div>
                <div className="bg-background p-3 rounded-lg border border-border"><p className="text-[10px] text-text-muted uppercase mb-1">Bytes</p><p className="text-sm font-medium text-text-primary">{(selectedEvent.bytes_transferred/1024).toFixed(1)} KB</p></div>
              </div>
            </div>

            {selectedEvent.ml_features && Object.keys(selectedEvent.ml_features).length > 0 && (
              <div>
                <p className="section-label mb-3">ML FEATURES</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedEvent.ml_features).filter(([k]) => k !== 'event_id').map(([k,v]) => (
                    <div key={k} className="bg-background p-2 rounded border border-border">
                      <p className="text-[9px] text-text-muted font-mono truncate">{k}</p>
                      <p className="text-xs text-text-primary font-mono">{typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(4)) : String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="section-label mb-3">AI ASSESSMENT</p>
              {!prediction ? (
                <button onClick={runAI} disabled={predicting} className="btn-primary w-full">
                  <Cpu size={14} />{predicting ? 'Running...' : 'Run AI Assessment'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className={`p-4 rounded-lg border ${prediction.is_anomaly ? 'bg-danger/5 border-danger/20' : 'bg-safe/5 border-safe/20'}`}>
                    <p className={`text-lg font-bold ${prediction.is_anomaly ? 'text-danger' : 'text-safe'}`}>{prediction.is_anomaly ? 'ANOMALY DETECTED' : 'NORMAL'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-background p-3 rounded-lg border border-border"><p className="text-[10px] text-text-muted uppercase mb-1">Risk</p><p className="text-lg font-bold text-text-primary">{prediction.risk_score}%</p></div>
                    <div className="bg-background p-3 rounded-lg border border-border"><p className="text-[10px] text-text-muted uppercase mb-1">Score</p><p className="text-lg font-bold text-text-primary">{prediction.anomaly_score}</p></div>
                    <div className="bg-background p-3 rounded-lg border border-border"><p className="text-[10px] text-text-muted uppercase mb-1">Threat</p><p className="text-sm font-medium text-text-primary">{prediction.predicted_threat}</p></div>
                  </div>
                  {prediction.top_indicators?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1"><Zap size={10} />Indicators</p>
                      {prediction.top_indicators.map((ind,i) => (
                        <p key={i} className="text-xs text-text-secondary bg-background p-2 rounded border border-border mb-1">{ind}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
