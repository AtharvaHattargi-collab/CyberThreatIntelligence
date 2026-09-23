import React, { useEffect, useState } from 'react';
import { analyticsAPI, mlAPI } from '../api/client';
import { FileText, Download, Printer, Shield, ShieldAlert, Activity, Check } from 'lucide-react';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';

export default function ReportCenter() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const [ov, th, sv, mx, rk, pf] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getThreatDistribution(),
        analyticsAPI.getSeverity(),
        analyticsAPI.getThreatProtocolMatrix(),
        analyticsAPI.getAttackRanking(),
        mlAPI.getPerformance()
      ]);
      setReportData({ ov, th, sv, mx, rk, pf, date: new Date().toLocaleString() });
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    setGenerating(true);
    try {
      let csv = "Category,Event Count,Total Packets,Total Bytes,Avg Rate\n";
      reportData.rk.forEach(r => {
        csv += `"${r.category}",${r.event_count},${r.total_packets},${r.total_bytes},${r.avg_rate}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `threat_report_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in print:text-black">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Report Center</h2>
          <p className="text-sm text-text-secondary mt-1">Generate deterministic security reports from live database metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          {!reportData ? (
            <button onClick={generateReport} disabled={loading} className="btn-primary">
              <FileText size={16} /> {loading ? 'Compiling Data...' : 'Generate Full Report'}
            </button>
          ) : (
            <>
              <button onClick={handleExportCSV} disabled={generating} className="btn-secondary">
                <Download size={16} /> Export Threats (CSV)
              </button>
              <button onClick={handlePrint} className="btn-primary">
                <Printer size={16} /> Save as PDF / Print
              </button>
            </>
          )}
        </div>
      </div>

      {loading && <LoadingSkeleton rows={10} />}

      {reportData && (
        <div className="bg-white text-slate-900 rounded-xl shadow-xl overflow-hidden print:shadow-none print:bg-transparent">
          {/* Cover / Header */}
          <div className="p-10 border-b border-slate-200 bg-slate-50 print:bg-transparent print:border-black">
            <div className="flex items-center gap-3 mb-6">
              <Shield size={32} className="text-blue-600 print:text-black" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cyber Threat Intelligence Report</h1>
                <p className="text-sm font-semibold tracking-widest uppercase text-slate-500">Security Operations Center</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-8">
              <div><span className="text-slate-500 font-medium">Generated:</span> <span className="font-bold">{reportData.date}</span></div>
              <div><span className="text-slate-500 font-medium">Dataset:</span> <span className="font-bold">UNSW-NB15</span></div>
            </div>
          </div>

          <div className="p-10 space-y-12">
            
            {/* Executive Summary */}
            <div>
              <h3 className="text-lg font-bold border-b-2 border-slate-900 pb-2 mb-6 uppercase tracking-wider">Executive Summary</h3>
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Total Events</p>
                  <p className="text-3xl font-black text-slate-900">{reportData.ov.total_events?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Total Threats</p>
                  <p className="text-3xl font-black text-red-600">{reportData.ov.total_attacks?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Attack Rate</p>
                  <p className="text-3xl font-black text-slate-900">{reportData.ov.attack_percentage}%</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">High Risk</p>
                  <p className="text-3xl font-black text-orange-600">{reportData.ov.high_risk_events?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Attack Ranking */}
            <div className="break-inside-avoid">
              <h3 className="text-lg font-bold border-b-2 border-slate-900 pb-2 mb-6 uppercase tracking-wider">Attack Category Breakdown</h3>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 border-b-2 border-slate-300">
                  <tr>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Category</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Events</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Packets</th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Bytes Transfer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.rk.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-800">{r.category}</td>
                      <td className="py-3 px-4 text-right font-mono">{r.event_count.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono">{r.total_packets.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono">{(r.total_bytes / 1024 / 1024).toFixed(2)} MB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Severity & ML Performance */}
            <div className="grid grid-cols-2 gap-10 break-inside-avoid">
              <div>
                <h3 className="text-lg font-bold border-b-2 border-slate-900 pb-2 mb-6 uppercase tracking-wider">Severity Distribution</h3>
                <div className="space-y-4">
                  {reportData.sv.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">{s.severity}</span>
                      <span className="font-mono bg-slate-100 px-3 py-1 rounded border border-slate-300">{s.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold border-b-2 border-slate-900 pb-2 mb-6 uppercase tracking-wider">ML Performance (RF)</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Accuracy</span>
                    <span className="font-mono text-green-700 font-bold bg-green-50 border border-green-200 px-3 py-1 rounded">
                      {(reportData.pf.accuracy * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Precision (Macro)</span>
                    <span className="font-mono bg-slate-100 px-3 py-1 rounded border border-slate-300">
                      {(reportData.pf.classification_report['macro avg'].precision * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Recall (Macro)</span>
                    <span className="font-mono bg-slate-100 px-3 py-1 rounded border border-slate-300">
                      {(reportData.pf.classification_report['macro avg'].recall * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">F1 Score (Macro)</span>
                    <span className="font-mono bg-slate-100 px-3 py-1 rounded border border-slate-300">
                      {(reportData.pf.classification_report['macro avg'].f1_score * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-300 text-center text-xs text-slate-500 font-medium tracking-widest uppercase break-inside-avoid">
              <p>CONFIDENTIAL — DO NOT DISTRIBUTE UNLESS AUTHORIZED</p>
              <p className="mt-1">Generated by Cyber Threat Intelligence Platform</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
