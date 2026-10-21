/**
 * FraudLens — Administration & Audit Trail
 * User roles, system health diagnostics, and immutable forensic audit logs.
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { User, AuditLogEntry } from '../types/index.ts';
import { Shield, Activity, Users, FileText, CheckCircle, Clock } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const [usersRes, logsRes, healthRes] = await Promise.all([
          apiClient.get<{ users: User[] }>('/api/admin/users'),
          apiClient.get<{ logs: AuditLogEntry[] }>('/api/admin/audit-logs'),
          apiClient.get<any>('/api/admin/health'),
        ]);
        setUsers(usersRes.users);
        setAuditLogs(logsRes.logs);
        setHealth(healthRes);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Administration & Audit Governance</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Role-based access controls, server health diagnostics, and immutable action audit logs
        </p>
      </div>

      {/* System Health Diagnostics */}
      {health && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Core Engine Diagnostics</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[11px] font-sans">System Status</span>
              <span className="font-bold text-emerald-700">{health.status}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[11px] font-sans">Uptime</span>
              <span className="font-bold text-slate-900">{Math.floor(health.uptimeSeconds / 60)} minutes</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[11px] font-sans">Memory Consumption</span>
              <span className="font-bold text-slate-900">{health.memoryUsageMB} MB heap</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-500 block text-[11px] font-sans">Active Knowledge Facts</span>
              <span className="font-bold text-blue-700">{health.entitiesCount * 3} facts</span>
            </div>
          </div>

          {/* Database Connectivity & Synthetic Dataset Status */}
          {health.databases && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">PostgreSQL (Relational Store)</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${health.databases.postgresql.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                    {health.databases.postgresql.status}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{health.databases.postgresql.note}</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Neo4j (Knowledge Graph)</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${health.databases.neo4j.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                    {health.databases.neo4j.status}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{health.databases.neo4j.note}</p>
              </div>
            </div>
          )}

          {health.graphDataset && (
            <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between">
              <span className="font-medium">Data Label: {health.graphDataset.label}</span>
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-blue-200 text-blue-800">
                {health.graphDataset.plantedScenariosCount} Planted Scenarios
              </span>
            </div>
          )}
        </div>
      )}

      {/* Users & Roles */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Authorized System Operators ({users.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/40 text-slate-500">
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Email</th>
                <th className="py-2.5 px-4 font-semibold">Assigned Role</th>
                <th className="py-2.5 px-4 font-semibold">Department</th>
                <th className="py-2.5 px-4 font-semibold text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.department}</td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Immutable Forensic Audit Trail ({auditLogs.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
              <tr className="text-slate-500">
                <th className="py-2 px-4 font-semibold">Timestamp</th>
                <th className="py-2 px-4 font-semibold">Operator</th>
                <th className="py-2 px-4 font-semibold">Action</th>
                <th className="py-2 px-4 font-semibold">Target Resource</th>
                <th className="py-2 px-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-4 font-bold text-slate-800 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-2 px-4 whitespace-nowrap">
                    <span className="text-blue-700 font-bold">{log.action}</span>
                  </td>
                  <td className="py-2 px-4 whitespace-nowrap text-slate-600">
                    {log.resource}: {log.resourceId}
                  </td>
                  <td className="py-2 px-4 text-slate-500 max-w-xs truncate font-sans">
                    {JSON.stringify(log.details)}
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
