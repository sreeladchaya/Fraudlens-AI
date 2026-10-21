/**
 * FraudLens — Symbolic AI Rule Catalogue & Execution Management
 * Complete 27-rule production system with configurable thresholds and forward chaining controls.
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { ProductionRule, RiskSeverity } from '../types/index.ts';
import { SeverityBadge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Cpu,
  Search,
  Filter,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle,
  Code,
  ArrowRight,
  Info,
} from 'lucide-react';

export const RulesPage: React.FC<{ onEngineTriggered?: () => void }> = ({ onEngineTriggered }) => {
  const { isAdmin } = useAuth();
  const [rules, setRules] = useState<ProductionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [editingRule, setEditingRule] = useState<ProductionRule | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ rules: ProductionRule[] }>('/api/rules');
      setRules(res.rules);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (rule: ProductionRule) => {
    try {
      const res = await apiClient.patch<{ rule: ProductionRule }>(`/api/rules/${rule.id}`, {
        isEnabled: !rule.isEnabled,
      });
      setRules(prev => prev.map(r => (r.id === rule.id ? res.rule : r)));
    } catch (err: any) {
      alert(`Error toggling rule: ${err.message}`);
    }
  };

  const handleOpenEdit = (rule: ProductionRule) => {
    setEditingRule(rule);
    const initial: Record<string, any> = {};
    rule.parameters.forEach(p => {
      initial[p.key] = p.value;
    });
    setParamValues(initial);
  };

  const handleSaveParameters = async () => {
    if (!editingRule) return;
    setIsSaving(true);
    try {
      const updatedParams = editingRule.parameters.map(p => ({
        key: p.key,
        value: p.type === 'number' ? Number(paramValues[p.key]) : paramValues[p.key],
      }));

      const res = await apiClient.patch<{ rule: ProductionRule }>(`/api/rules/${editingRule.id}`, {
        parameters: updatedParams,
      });

      setRules(prev => prev.map(r => (r.id === editingRule.id ? res.rule : r)));
      setEditingRule(null);
      setSuccessBanner(`Detection thresholds updated for ${editingRule.id}`);
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: any) {
      alert(`Failed to save parameters: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunForwardChaining = async () => {
    try {
      const res = await apiClient.post<any>('/api/rules/run-engine');
      setSuccessBanner(
        `Forward Chaining cycle completed in ${res.report.executionDurationMs}ms (${res.alertsCount} alerts, ${res.ringsCount} rings)`
      );
      fetchRules();
      if (onEngineTriggered) onEngineTriggered();
      setTimeout(() => setSuccessBanner(null), 5000);
    } catch (err: any) {
      alert(`Engine error: ${err.message}`);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Reseed synthetic dataset with standard test baseline (seed = 42)?')) return;
    try {
      await apiClient.post('/api/rules/reset-data', { seed: 42 });
      setSuccessBanner('Synthetic dataset reseeded and rule engine executed.');
      fetchRules();
      if (onEngineTriggered) onEngineTriggered();
      setTimeout(() => setSuccessBanner(null), 4000);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    }
  };

  const filteredRules = rules.filter(r => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Symbolic AI Rule Engine Catalogue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Production rule definitions, IF-THEN premises, Cypher pattern queries, and configurable thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reseed Dataset</span>
            </button>
          )}
          <button
            onClick={handleRunForwardChaining}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors cursor-pointer shadow-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Forward Chaining</span>
          </button>
        </div>
      </div>

      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 font-medium">
          {successBanner}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search 27 production rules by ID or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-full text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Rule Categories (27)</option>
            <option value="SHARED_INFRASTRUCTURE">Shared Infrastructure & Synthetic</option>
            <option value="RAPID_VELOCITY">Rapid & Structured Velocity</option>
            <option value="RING_TOPOLOGY">Knowledge Graph Ring Topology</option>
            <option value="MERCHANT_COLLUSION">Merchant & POS Collusion</option>
            <option value="ACCOUNT_TAKEOVER">Account Takeover & Behavioral Drift</option>
          </select>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-400">Loading rule catalogue...</div>
        ) : filteredRules.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-500">No production rules matched query.</div>
        ) : (
          filteredRules.map(rule => (
            <div
              key={rule.id}
              className={`bg-white border rounded-lg p-5 transition-all space-y-3.5 ${
                rule.isEnabled ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {rule.id}
                    </span>
                    <SeverityBadge severity={rule.severity} />
                    <span className="text-[11px] font-mono text-slate-500">Weight: {rule.weight}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
                </div>

                {/* Enable Toggle */}
                {isAdmin && (
                  <button
                    onClick={() => handleToggleRule(rule)}
                    className={`text-xs px-2.5 py-1 rounded font-semibold cursor-pointer border ${
                      rule.isEnabled
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {rule.isEnabled ? 'Active' : 'Disabled'}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{rule.description}</p>

              {/* Premises Description */}
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1 text-[11px]">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                  IF Premises:
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                  {rule.premisesDescription.map((premise, idx) => (
                    <li key={idx}>{premise}</li>
                  ))}
                </ul>
                <span className="font-bold text-blue-900 block uppercase tracking-wider text-[10px] pt-1">
                  THEN Conclusion:
                </span>
                <p className="text-blue-950 font-medium pl-1">{rule.conclusionDescription}</p>
              </div>

              {/* Parameters & Match Stats Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                  <span>Matches: <strong className="text-slate-900">{rule.matchedCount}</strong></span>
                  {rule.lastExecutedAt && (
                    <>
                      <span>·</span>
                      <span>Last: {new Date(rule.lastExecutedAt).toLocaleTimeString()}</span>
                    </>
                  )}
                </div>

                {isAdmin && rule.parameters.length > 0 && (
                  <button
                    onClick={() => handleOpenEdit(rule)}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Config Parameters ({rule.parameters.length})</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Parameter Edit Modal */}
      {editingRule && (
        <Modal
          isOpen={Boolean(editingRule)}
          onClose={() => setEditingRule(null)}
          title={`Configure Detection Parameters: ${editingRule.id}`}
          subtitle={editingRule.name}
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">{editingRule.description}</p>

            <div className="space-y-3 pt-2">
              {editingRule.parameters.map(param => (
                <div key={param.key} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-900">{param.label}</label>
                    <span className="text-[10px] font-mono text-slate-500">Default: {param.defaultValue} {param.unit || ''}</span>
                  </div>
                  {param.type === 'number' ? (
                    <input
                      type="number"
                      value={paramValues[param.key] ?? param.value}
                      onChange={e => setParamValues({ ...paramValues, [param.key]: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  ) : param.type === 'boolean' ? (
                    <select
                      value={String(paramValues[param.key] ?? param.value)}
                      onChange={e => setParamValues({ ...paramValues, [param.key]: e.target.value === 'true' })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-900 focus:outline-none"
                    >
                      <option value="true">True (Enabled)</option>
                      <option value="false">False (Disabled)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={paramValues[param.key] ?? param.value}
                      onChange={e => setParamValues({ ...paramValues, [param.key]: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => setEditingRule(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={handleSaveParameters}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Saving...' : 'Save Parameters'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
