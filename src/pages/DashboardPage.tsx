/**
 * FraudLens — Main Dashboard Page
 * Real enterprise banking surveillance overview using live backend APIs
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { StatCard } from '../components/common/StatCard.tsx';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.tsx';
import { FraudAlert, FraudRingCluster, ForwardChainingExecutionReport } from '../types/index.ts';
import { NavTab } from '../components/layout/Header.tsx';
import {
  ShieldAlert,
  Users,
  Activity,
  Layers,
  Briefcase,
  Network,
  ArrowRight,
  RefreshCw,
  Cpu,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface DashboardData {
  kpis: {
    totalMonitoredEntities: number;
    totalCustomers: number;
    totalTransactions: number;
    totalTransactionVolume: number;
    openAlertsCount: number;
    criticalAlertsCount: number;
    activeRingsCount: number;
    openCasesCount: number;
    graphNodeCount: number;
    graphEdgeCount: number;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  ruleTriggers: {
    id: string;
    name: string;
    count: number;
    category: string;
    severity: string;
  }[];
  recentAlerts: FraudAlert[];
  activeRings: FraudRingCluster[];
  latestInferenceReport: ForwardChainingExecutionReport | null;
}

export const DashboardPage: React.FC<{ onNavigate: (tab: NavTab, params?: any) => void }> = ({
  onNavigate,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<DashboardData>('/api/dashboard/summary');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-slate-200 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center">
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg max-w-md mx-auto text-rose-800">
          <p className="font-semibold">Unable to load surveillance data</p>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { kpis, riskDistribution, ruleTriggers, recentAlerts, activeRings, latestInferenceReport } = data;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Financial Surveillance Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Knowledge graph pattern matching & forward chaining symbolic AI reasoning engine
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => onNavigate('graph')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors cursor-pointer"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Open Graph Canvas</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Monitored Entities"
          value={kpis.totalMonitoredEntities}
          subtext={`${kpis.totalCustomers} Customers · ${kpis.graphNodeCount} Graph Nodes`}
          icon={Users}
          onClick={() => onNavigate('customers')}
        />
        <StatCard
          label="Active Fraud Rings"
          value={kpis.activeRingsCount}
          subtext="Coordinated multi-entity clusters"
          icon={Layers}
          badge={{ text: 'Detected', variant: 'negative' }}
          onClick={() => onNavigate('rings')}
        />
        <StatCard
          label="Open Alerts"
          value={kpis.openAlertsCount}
          subtext={`${kpis.criticalAlertsCount} Critical Severity`}
          icon={ShieldAlert}
          badge={{ text: `${kpis.criticalAlertsCount} Urgent`, variant: 'negative' }}
          onClick={() => onNavigate('alerts')}
        />
        <StatCard
          label="Scanned Volume"
          value={`$${(kpis.totalTransactionVolume / 1000).toFixed(1)}k`}
          subtext={`${kpis.totalTransactions} Total Transactions`}
          icon={Activity}
          onClick={() => onNavigate('transactions')}
        />
        <StatCard
          label="Investigation Cases"
          value={kpis.openCasesCount}
          subtext="Active dossiers with SIU"
          icon={Briefcase}
          onClick={() => onNavigate('cases')}
        />
      </div>

      {/* Inference Engine Status Banner */}
      {latestInferenceReport && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 border border-blue-100 rounded text-blue-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Symbolic Inference Status: {latestInferenceReport.status}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {latestInferenceReport.executionDurationMs}ms
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Converged to Fixed-Point in <span className="font-semibold text-slate-900">{latestInferenceReport.iterationsCount} cycles</span>. Evaluated{' '}
                <span className="font-semibold text-slate-900">{latestInferenceReport.rulesEvaluated} rules</span> against{' '}
                <span className="font-semibold text-slate-900">{latestInferenceReport.finalFactsCount} facts</span>, deriving{' '}
                <span className="font-semibold text-slate-900">{latestInferenceReport.totalAlertsGenerated} alerts</span> and{' '}
                <span className="font-semibold text-slate-900">{latestInferenceReport.totalRingsDetected} rings</span>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('rules')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Review Rule Execution Algebra</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mid-Row: Active Fraud Rings & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Rings (2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Identified Coordinated Fraud Rings</h2>
              <p className="text-xs text-slate-500">Clusters derived via graph pattern matching & forward chaining</p>
            </div>
            <button
              onClick={() => onNavigate('rings')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({activeRings.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeRings.map(ring => (
              <div key={ring.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{ring.name}</span>
                      <SeverityBadge severity={ring.severity} score={ring.aggregateRiskScore} />
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {ring.topologyType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl">{ring.explanation}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 font-mono">
                      <span>{ring.entityCount} Entities</span>
                      <span>·</span>
                      <span>{ring.transactionCount} Transactions</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-900">${ring.totalVolume.toLocaleString()} Total Flow</span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate('graph', { ringId: ring.id })}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Inspect Graph
                    </button>
                    {ring.caseCreated ? (
                      <span className="text-[11px] text-emerald-700 font-medium">Case Active</span>
                    ) : (
                      <button
                        onClick={() => onNavigate('rings')}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Investigate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution & Rule Triggers (1 Column) */}
        <div className="space-y-6">
          {/* Risk Profile Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Entity Risk Distribution</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Critical Risk (90 - 100)</span>
                <span className="font-mono font-bold text-rose-700">{riskDistribution.critical} entities</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                <div
                  className="bg-rose-600 h-full rounded"
                  style={{ width: `${(riskDistribution.critical / Math.max(1, kpis.totalCustomers)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600">High Risk (70 - 89)</span>
                <span className="font-mono font-bold text-orange-600">{riskDistribution.high} entities</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded"
                  style={{ width: `${(riskDistribution.high / Math.max(1, kpis.totalCustomers)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600">Medium Risk (40 - 69)</span>
                <span className="font-mono font-bold text-amber-600">{riskDistribution.medium} entities</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded"
                  style={{ width: `${(riskDistribution.medium / Math.max(1, kpis.totalCustomers)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600">Low / Benign (&lt; 40)</span>
                <span className="font-mono font-bold text-emerald-600">{riskDistribution.low} entities</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded"
                  style={{ width: `${(riskDistribution.low / Math.max(1, kpis.totalCustomers)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Frequently Triggered Rules */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Top Triggered Rules</h2>
              <button
                onClick={() => onNavigate('rules')}
                className="text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
              >
                Catalogue
              </button>
            </div>
            <div className="space-y-2.5">
              {ruleTriggers.slice(0, 5).map(rt => (
                <div key={rt.id} className="text-xs flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="truncate pr-2">
                    <span className="font-mono font-bold text-slate-800">{rt.id}</span>
                    <span className="text-slate-600 ml-1.5">{rt.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                    {rt.count} matches
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Alerts Queue */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Automated Surveillance Alerts</h2>
            <p className="text-xs text-slate-500">Real-time alerts queued for Special Investigations Unit (SIU) triage</p>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Alert Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                <th className="py-2.5 px-4 font-semibold">Alert ID</th>
                <th className="py-2.5 px-4 font-semibold">Title & Explanation</th>
                <th className="py-2.5 px-4 font-semibold">Primary Target</th>
                <th className="py-2.5 px-4 font-semibold">Severity</th>
                <th className="py-2.5 px-4 font-semibold">Risk Score</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAlerts.map(alert => (
                <tr key={alert.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {alert.alertId}
                  </td>
                  <td className="py-3 px-4 max-w-md">
                    <div className="font-semibold text-slate-900">{alert.title}</div>
                    <div className="text-slate-500 truncate mt-0.5">{alert.evidenceTrace.summary}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                    <span className="font-medium">{alert.primaryEntityLabel}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{alert.primaryEntityType}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900 tabular-nums">
                    {alert.riskScore}/100
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={alert.status} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => onNavigate('alerts', { selectedAlertId: alert.id })}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                    >
                      Review Evidence
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
