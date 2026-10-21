/**
 * FraudLens — Fraud Ring Explorer
 * Inspects candidate syndicates, topology classifications, member entities, and aggregate risks.
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { FraudRingCluster, RiskSeverity } from '../types/index.ts';
import { SeverityBadge } from '../components/common/Badge.tsx';
import { NavTab } from '../components/layout/Header.tsx';
import {
  Layers,
  Network,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  Users,
  Search,
  Filter,
} from 'lucide-react';

interface FraudRingsPageProps {
  onNavigate: (tab: NavTab, params?: any) => void;
}

export const FraudRingsPage: React.FC<FraudRingsPageProps> = ({ onNavigate }) => {
  const [rings, setRings] = useState<FraudRingCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopology, setSelectedTopology] = useState('ALL');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchRings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ rings: FraudRingCluster[] }>('/api/rings');
      setRings(res.rings);
    } catch (err) {
      console.error('Failed to load rings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRings();
  }, []);

  const handleCreateCase = async (ring: FraudRingCluster) => {
    try {
      const res = await apiClient.post<{ case: any }>(`/api/rings/${ring.id}/create-case`);
      setActionSuccess(`Case ${res.case.caseId} opened for ${ring.name}`);
      fetchRings();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Error creating case: ${err.message}`);
    }
  };

  const filteredRings = rings.filter(ring => {
    const matchesSearch =
      ring.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ring.ringId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ring.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopology = selectedTopology === 'ALL' || ring.topologyType === selectedTopology;
    return matchesSearch && matchesTopology;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Coordinated Fraud Ring Explorer</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Graph community detection & rule-based pattern matching clusters representing coordinated syndicates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('graph')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Open Global Graph</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => onNavigate('cases')} className="font-bold underline ml-2 cursor-pointer">
            View in Cases
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search fraud rings by name, ID or pattern..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-full text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedTopology}
            onChange={e => setSelectedTopology(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Graph Topologies</option>
            <option value="CIRCULAR_CYCLE">Circular Cycles (A ➔ B ➔ C ➔ A)</option>
            <option value="SYNTHETIC_MESH">Synthetic Identity Mesh</option>
            <option value="MERCHANT_COLLUSION">Merchant POS Collusion</option>
            <option value="BURST_TAKEOVER">Account Takeover Burst</option>
          </select>
        </div>
      </div>

      {/* Rings Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-white border border-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredRings.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
          No fraud rings matched your search filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRings.map(ring => (
            <div
              key={ring.id}
              className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-all shadow-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {ring.ringId}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{ring.name}</h2>
                    <SeverityBadge severity={ring.severity} score={ring.aggregateRiskScore} />
                    <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {ring.topologyType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                    {ring.explanation}
                  </p>

                  {/* Summary Bar */}
                  <div className="flex items-center gap-6 text-xs text-slate-500 pt-1 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ring.entityCount} Linked Entities</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900">${ring.totalVolume.toLocaleString()} Flow</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ring.transactionCount} Transactions</span>
                    </div>
                  </div>

                  {/* Member Entities Pills */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Constituent Entities & Roles:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {ring.entities.map(e => (
                        <div
                          key={e.id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
                        >
                          <span className="font-medium">{e.label}</span>
                          {e.roleInRing && (
                            <span className="text-[10px] text-slate-500 font-mono">({e.roleInRing})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex lg:flex-col items-center lg:items-end gap-2.5 shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => onNavigate('graph', { ringId: ring.id })}
                    className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Network className="w-3.5 h-3.5 text-blue-600" />
                    <span>Inspect Subgraph</span>
                  </button>

                  {ring.caseCreated ? (
                    <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 flex items-center gap-1.5">
                      <span>Case Active in SIU</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCreateCase(ring)}
                      className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Promote to Investigation Case</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
