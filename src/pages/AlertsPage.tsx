/**
 * FraudLens — Alerts Management Queue
 * Triaging and investigating alerts with complete Evidence Graph Traces.
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { FraudAlert, AlertStatus, RiskSeverity } from '../types/index.ts';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { NavTab } from '../components/layout/Header.tsx';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Briefcase,
  Network,
  ArrowRight,
  Info,
  Clock,
  Layers,
} from 'lucide-react';

interface AlertsPageProps {
  onNavigate: (tab: NavTab, params?: any) => void;
  selectedAlertId?: string;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate, selectedAlertId }) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [activeAlert, setActiveAlert] = useState<FraudAlert | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ alerts: FraudAlert[] }>('/api/alerts');
      setAlerts(res.alerts);
      if (selectedAlertId) {
        const found = res.alerts.find(a => a.id === selectedAlertId);
        if (found) setActiveAlert(found);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedAlertId]);

  const handleUpdateStatus = async (alertId: string, status: AlertStatus) => {
    setStatusUpdating(true);
    try {
      const res = await apiClient.patch<{ alert: FraudAlert }>(`/api/alerts/${alertId}/status`, { status });
      setAlerts(prev => prev.map(a => (a.id === alertId ? res.alert : a)));
      if (activeAlert?.id === alertId) {
        setActiveAlert(res.alert);
      }
    } catch (err: any) {
      alert(`Error updating alert status: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCreateCaseFromAlert = async (targetAlert: FraudAlert) => {
    try {
      const res = await apiClient.post<{ case: any }>(`/api/alerts/${targetAlert.id}/create-case`, {
        title: `Investigation: ${targetAlert.title}`,
        priority: targetAlert.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      });
      targetAlert.status = 'CONVERTED_TO_CASE';
      targetAlert.caseId = res.case.id;
      setActiveAlert(null);
      fetchAlerts();
      onNavigate('cases');
    } catch (err: any) {
      console.error(`Error creating case: ${err.message}`);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.alertId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.primaryEntityLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = selectedSeverity === 'ALL' || a.severity === selectedSeverity;
    const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Surveillance Alert Triage Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deduplicated findings generated via Forward Chaining inference over graph facts
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts by title, entity, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-full text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ESCALATED">Escalated</option>
            <option value="DISMISSED">Dismissed</option>
            <option value="CONVERTED_TO_CASE">Converted to Case</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading alerts stream...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No surveillance alerts match the selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-2.5 px-4 font-semibold">Alert ID</th>
                  <th className="py-2.5 px-4 font-semibold">Title & Evidence Summary</th>
                  <th className="py-2.5 px-4 font-semibold">Primary Target</th>
                  <th className="py-2.5 px-4 font-semibold">Severity</th>
                  <th className="py-2.5 px-4 font-semibold">Risk Score</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {alert.alertId}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-slate-900">{alert.title}</div>
                      <div className="text-slate-500 truncate mt-0.5">{alert.evidenceTrace.summary}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      <span className="font-medium">{alert.primaryEntityLabel}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{alert.primaryEntityType}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-900 tabular-nums">
                      {alert.riskScore}/100
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => setActiveAlert(alert)}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                      >
                        Inspect Evidence
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alert Evidence Trace Modal */}
      {activeAlert && (
        <Modal
          isOpen={Boolean(activeAlert)}
          onClose={() => setActiveAlert(null)}
          title={`Alert Evidence Trace: ${activeAlert.alertId}`}
          subtitle={activeAlert.title}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Top Stat Ribbon */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Severity & Risk</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <SeverityBadge severity={activeAlert.severity} score={activeAlert.riskScore} />
                  <span className="font-mono text-slate-600">Primary: {activeAlert.primaryEntityLabel}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 block">Current Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={activeAlert.status} />
                </div>
              </div>
            </div>

            {/* Triggered Rules Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Triggered Production Rules ({activeAlert.triggeredRules.length})
              </span>
              <div className="space-y-2">
                {activeAlert.triggeredRules.map(r => (
                  <div key={r.ruleId} className="p-3 bg-white border border-slate-200 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-blue-700">{r.ruleId}: {r.ruleName}</span>
                      <span className="font-mono text-slate-500">Weight: {r.weight}/100</span>
                    </div>
                    <p className="text-slate-600">{r.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Summary & SIU Recommendation */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded space-y-2 text-slate-800">
              <span className="font-bold text-blue-900 uppercase text-[11px] tracking-wider block">
                Evidence Trace Summary
              </span>
              <p className="leading-relaxed">{activeAlert.evidenceTrace.summary}</p>
              <div className="pt-2 border-t border-blue-200/60">
                <span className="font-semibold text-blue-950 block">Recommended Action:</span>
                <p className="text-blue-900 mt-0.5">{activeAlert.evidenceTrace.recommendation}</p>
              </div>
            </div>

            {/* Matched Entities & Edges */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Matched Subgraph Entities ({activeAlert.evidenceTrace.matchedEntities.length})
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeAlert.evidenceTrace.matchedEntities.map(e => (
                  <span key={e.id} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono text-[11px]">
                    {e.type}: {e.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Workflow Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  disabled={statusUpdating || activeAlert.status === 'UNDER_REVIEW'}
                  onClick={() => handleUpdateStatus(activeAlert.id, 'UNDER_REVIEW')}
                  className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Mark Under Review
                </button>
                <button
                  disabled={statusUpdating || activeAlert.status === 'DISMISSED'}
                  onClick={() => handleUpdateStatus(activeAlert.id, 'DISMISSED')}
                  className="px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeAlert.caseId ? (
                  <span className="text-xs font-semibold text-emerald-700">Converted to Case {activeAlert.caseId}</span>
                ) : (
                  <button
                    onClick={() => handleCreateCaseFromAlert(activeAlert)}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Create Investigation Case</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
