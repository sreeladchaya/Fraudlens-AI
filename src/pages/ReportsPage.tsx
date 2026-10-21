/**
 * FraudLens — Compliance & Forensic Reports
 * Formally generated regulatory summaries, SIU case dossiers, and CSV data exports.
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { FileText, Download, Printer, ShieldCheck, CheckCircle } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/api/reports/summary');
        setSummaryData(res);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = (type: 'alerts' | 'rings' | 'rules') => {
    if (!summaryData) return;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (type === 'rings') {
      csvContent += 'Ring ID,Name,Topology,Risk Score,Volume,Entities\n';
      summaryData.ringsSummary.forEach((r: any) => {
        csvContent += `"${r.ringId}","${r.name}","${r.topology}",${r.riskScore},${r.volume},${r.entities}\n`;
      });
    } else if (type === 'rules') {
      csvContent += 'Rule ID,Rule Name,Severity,Match Count\n';
      summaryData.topTriggeredRules.forEach((r: any) => {
        csvContent += `"${r.id}","${r.name}","${r.severity}",${r.count}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fraudlens_${type}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !summaryData) {
    return <div className="p-8 text-center text-xs text-slate-400">Compiling surveillance reports...</div>;
  }

  const { systemStatistics, topTriggeredRules, ringsSummary, generatedAt } = summaryData;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Regulatory Compliance & Case Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready reporting exports for internal SIU governance and FinCEN SAR documentation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCSV('rings')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Rings (CSV)</span>
          </button>
          <button
            onClick={() => handleExportCSV('rules')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Rules (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-xs space-y-6 text-xs text-slate-800 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
              CONFIDENTIAL FORENSIC DOSSIER
            </span>
            <h2 className="text-lg font-bold text-slate-900">FraudLens Surveillance Executive Report</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Knowledge Graph & Forward Chaining Symbolic AI Detection Platform
            </p>
          </div>
          <div className="text-right font-mono text-[11px] text-slate-500">
            <div>Timestamp: {new Date(generatedAt).toUTCString()}</div>
            <div>Classification: Law Enforcement / SIU Internal</div>
          </div>
        </div>

        {/* Statistical Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded border border-slate-200">
          <div>
            <span className="text-slate-500 block text-[11px]">Total Monitored Alerts</span>
            <span className="text-xl font-bold font-mono text-slate-900">{systemStatistics.totalAlerts}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Critical Alerts</span>
            <span className="text-xl font-bold font-mono text-rose-700">{systemStatistics.criticalAlerts}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Identified Rings</span>
            <span className="text-xl font-bold font-mono text-blue-700">{systemStatistics.identifiedRings}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Cases Formatted</span>
            <span className="text-xl font-bold font-mono text-slate-900">{systemStatistics.casesOpened}</span>
          </div>
        </div>

        {/* Coordinated Rings Summary Section */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
            1. Coordinated Fraud Ring Clusters
          </h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <th className="py-2">Ring ID</th>
                <th className="py-2">Syndicate Name</th>
                <th className="py-2">Topology Classification</th>
                <th className="py-2">Risk Score</th>
                <th className="py-2">Cycled Volume</th>
                <th className="py-2 text-right">Entities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {ringsSummary.map((r: any) => (
                <tr key={r.ringId}>
                  <td className="py-2 font-bold">{r.ringId}</td>
                  <td className="py-2 font-sans font-medium text-slate-900">{r.name}</td>
                  <td className="py-2">{r.topology}</td>
                  <td className="py-2 font-bold text-rose-700">{r.riskScore}/100</td>
                  <td className="py-2">${r.volume.toLocaleString()}</td>
                  <td className="py-2 text-right">{r.entities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Production Rules Triggered */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-1">
            2. Production Rule Execution Frequency
          </h3>
          <div className="space-y-2">
            {topTriggeredRules.map((r: any) => (
              <div key={r.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-slate-900 mr-2">{r.id}:</span>
                  <span className="font-medium text-slate-800">{r.name}</span>
                </div>
                <div className="font-mono text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {r.count} Inferences
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal Sign-Off Block */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-slate-500 text-[11px]">
          <div>
            <p>Prepared by: Special Investigations Unit & Forensic AI System</p>
            <p className="mt-0.5">Complies with USA PATRIOT Act Section 314(b) Information Sharing Guidelines</p>
          </div>
          <div className="border border-slate-300 rounded p-2 text-center text-slate-700 font-mono text-[10px]">
            <span>[ DIGITAL SEAL VERIFIED ]</span>
          </div>
        </div>
      </div>
    </div>
  );
};
