import React, { useState, useEffect } from 'react';
import { mlAPI } from '../api/client';
import EmptyState from '../components/ui/EmptyState';
import { Brain, ShieldCheck, Cpu, Network, Server, Clock, Zap, DownloadCloud, Activity, AlertTriangle, BarChart2 } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

export default function MLDetection() {
  const [loading, setLoading] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [featureImportance, setFeatureImportance] = useState(null);
  const [sampleInfo, setSampleInfo] = useState(null);

  const [formData, setFormData] = useState({
    proto: 'tcp', service: 'http', state: 'FIN',
    spkts: 10, dpkts: 8, sbytes: 1500, dbytes: 2000, rate: 100.5,
    dur: 0.5, sinpkt: 10.0, dinpkt: 10.0, tcprtt: 0.05,
    ct_srv_src: 2, ct_srv_dst: 2, is_ftp_login: 0, ct_flw_http_mthd: 1,
  });

  useEffect(() => {
    mlAPI.getFeatureImportance().then(res => setFeatureImportance(res)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleLoadSample = async () => {
    setLoadingSample(true); setError(null);
    try {
      const data = await mlAPI.getSample();
      if (data && data.sample) {
        setFormData(prev => ({ ...prev, ...data.sample }));
        setSampleInfo({
          id: data.source_event_id,
          label: data.actual_label,
          threat: data.actual_threat
        });
        setResult(null); // Clear previous result when loading new sample
      }
    } catch (e) { setError('Failed to load sample: ' + e.message); }
    setLoadingSample(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const data = await mlAPI.predict({ ...formData });
      setResult(data);
    } catch (err) { setError(err?.message || 'Failed to communicate with ML engine'); }
    setLoading(false);
  };

  const deriveSeverity = (riskScore) => {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card p-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">AI Threat Detection</h2>
          <p className="text-xs text-text-secondary mt-1">Random Forest network flow evaluation workspace</p>
        </div>
        <div className="flex items-center gap-3">
          {sampleInfo && (
            <div className="text-xs text-text-muted bg-surface-hover px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
              <span className="font-semibold">Sample ID: {sampleInfo.id}</span>
              <span className="w-px h-3 bg-border" />
              <span>Actual: {sampleInfo.threat}</span>
            </div>
          )}
          <button onClick={handleLoadSample} disabled={loadingSample} className="btn-secondary text-xs">
            <DownloadCloud size={14} /> {loadingSample ? 'Loading...' : 'Use Dataset Sample'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full min-w-0">
        
        {/* Form Column */}
        <div className="xl:col-span-7 card p-0 overflow-hidden flex flex-col relative w-full min-w-0">
          <div className="p-4 border-b border-border bg-surface-hover/30 shrink-0">
             <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Network size={16} className="text-primary"/> Network Feature Input Form</h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
            <div>
              <p className="section-label mb-3">Categorical Features</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors">
                  <label className="input-label">Protocol</label>
                  <input name="proto" value={formData.proto} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs text-text-primary focus:outline-none" />
                </div>
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors">
                  <label className="input-label">Service</label>
                  <input name="service" value={formData.service} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs text-text-primary focus:outline-none" />
                </div>
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors">
                  <label className="input-label">State</label>
                  <input name="state" value={formData.state} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs text-text-primary focus:outline-none" />
                </div>
              </div>
            </div>

            <div>
              <p className="section-label mb-3">Volumetric Features</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors"><label className="input-label">Src Packets</label><input type="number" name="spkts" value={formData.spkts} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs font-mono focus:outline-none" /></div>
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors"><label className="input-label">Dst Packets</label><input type="number" name="dpkts" value={formData.dpkts} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs font-mono focus:outline-none" /></div>
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors"><label className="input-label">Traffic Rate</label><input type="number" step="0.1" name="rate" value={formData.rate} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs font-mono focus:outline-none" /></div>
                
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors"><label className="input-label">Src Bytes</label><input type="number" name="sbytes" value={formData.sbytes} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs font-mono focus:outline-none" /></div>
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors"><label className="input-label">Dst Bytes</label><input type="number" name="dbytes" value={formData.dbytes} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs font-mono focus:outline-none" /></div>
              </div>
            </div>

            <div>
              <p className="section-label mb-3">Timing Features</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors"><label className="input-label">Duration (sec)</label><input type="number" step="0.001" name="dur" value={formData.dur} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs font-mono focus:outline-none" /></div>
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors"><label className="input-label">TCP RTT (sec)</label><input type="number" step="0.001" name="tcprtt" value={formData.tcprtt} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs font-mono focus:outline-none" /></div>
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors"><label className="input-label">Src Inter-packet (ms)</label><input type="number" step="0.1" name="sinpkt" value={formData.sinpkt} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs font-mono focus:outline-none" /></div>
                <div className="bg-background p-2 rounded-lg border border-border focus-within:border-primary/50 transition-colors"><label className="input-label">Dst Inter-packet (ms)</label><input type="number" step="0.1" name="dinpkt" value={formData.dinpkt} onChange={handleChange} className="w-full bg-transparent border-0 p-0 text-xs font-mono focus:outline-none" /></div>
              </div>
            </div>
          </form>
          <div className="p-4 border-t border-border bg-background shrink-0">
             <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full text-sm py-3 font-bold uppercase tracking-wider">
               {loading ? 'Evaluating Model...' : <><Brain size={16} /> Analyze Traffic</>}
             </button>
          </div>
        </div>

        {/* Result Column */}
        <div className="xl:col-span-5 space-y-6 w-full min-w-0">
          <div className="glass-panel p-0 overflow-hidden min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-border bg-surface-hover/30 shrink-0">
               <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2"><Cpu size={16} className="text-primary"/> AI Analysis Result</h3>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              {error && <EmptyState isError title="Inference Failed" message={error} icon={AlertTriangle} />}
              {!result && !error && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-surface-hover border border-border flex items-center justify-center text-text-muted">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Waiting for input</p>
                    <p className="text-xs text-text-secondary mt-1 max-w-[200px] mx-auto">Submit parameters or load a sample to run inference.</p>
                  </div>
                </div>
              )}
              
              {result && !error && (
                <div className="space-y-5 animate-fade-in">
                  <div className={`p-5 rounded-xl border ${result.is_anomaly ? 'bg-danger/10 border-danger/30' : 'bg-safe/10 border-safe/30'} flex flex-col items-center justify-center text-center`}>
                    <p className="text-[11px] text-text-primary/70 uppercase tracking-widest font-semibold mb-1">Threat Status</p>
                    <p className={`text-2xl font-black tracking-tighter uppercase ${result.is_anomaly ? 'text-danger' : 'text-safe'}`}>
                      {result.is_anomaly ? 'ANOMALY DETECTED' : 'NORMAL TRAFFIC'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background p-4 rounded-xl border border-border">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Risk Score</p>
                      <div className="flex items-end gap-2">
                         <p className="text-3xl font-bold text-text-primary">{result.risk_score}<span className="text-lg text-text-muted">%</span></p>
                      </div>
                    </div>
                    <div className="bg-background p-4 rounded-xl border border-border">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Severity</p>
                      <div className="mt-2">
                        <StatusBadge value={result.is_anomaly ? deriveSeverity(result.risk_score) : 'LOW'} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background p-4 rounded-xl border border-border">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Predicted Threat</p>
                      <p className="text-sm font-bold text-text-primary mt-1">{result.predicted_threat}</p>
                    </div>
                    <div className="bg-background p-4 rounded-xl border border-border">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-1">Anomaly Score</p>
                      <p className="text-sm font-mono text-text-primary mt-1">{result.anomaly_score.toFixed(4)}</p>
                    </div>
                  </div>

                  {result.top_indicators && result.top_indicators.length > 0 && (
                    <div className="mt-6 border-t border-border pt-4">
                      <p className="text-[11px] text-text-secondary uppercase tracking-wider mb-3 font-semibold flex items-center gap-1.5"><Zap size={12} className="text-warning"/> Top Indicators</p>
                      <div className="space-y-2">
                        {result.top_indicators.map((ind, i) => (
                          <div key={i} className="text-xs text-text-primary bg-background px-3 py-2.5 rounded-lg border border-border flex items-start gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0 mt-1" />
                            {ind}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {featureImportance && (
            <div className="card">
              <p className="section-label mb-2 flex items-center gap-1.5"><BarChart2 size={14} className="text-text-muted" /> Global ML Explainability</p>
              <p className="text-[10px] text-text-muted mb-4">Random Forest feature importance for the overall model, not specific to this prediction.</p>
              <div className="space-y-2.5">
                {featureImportance.features.slice(0, 5).map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-24 text-[10px] font-mono text-text-secondary truncate" title={f.name}>{f.name}</div>
                    <div className="flex-1 h-2 bg-background rounded-full overflow-hidden border border-border/50">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${f.importance * 100}%` }} />
                    </div>
                    <div className="w-8 text-right text-[10px] font-mono text-text-muted">{(f.importance * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
