/**
 * FraudLens — Investigation Case Management
 * Strict state machine transitions, SIU notes, evidence links, and resolution audit.
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { InvestigationCase, CaseStatus, UserRole } from '../types/index.ts';
import { StatusBadge, SeverityBadge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Plus,
  Send,
  FileText,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const CasesPage: React.FC = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [newNoteText, setNewNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<CaseStatus>('IN_INVESTIGATION');
  const [transitionNotes, setTransitionNotes] = useState('');

  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ cases: InvestigationCase[] }>('/api/cases');
      setCases(res.cases);
      if (selectedCase) {
        const updated = res.cases.find(c => c.id === selectedCase.id);
        if (updated) setSelectedCase(updated);
      }
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleAddNote = async () => {
    if (!selectedCase || !newNoteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await apiClient.post<{ note: any; case: InvestigationCase }>(
        `/api/cases/${selectedCase.id}/notes`,
        { text: newNoteText }
      );
      setSelectedCase(res.case);
      setCases(prev => prev.map(c => (c.id === res.case.id ? res.case : c)));
      setNewNoteText('');
    } catch (err: any) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleTransitionStatus = async () => {
    if (!selectedCase) return;
    try {
      const res = await apiClient.patch<{ case: InvestigationCase }>(
        `/api/cases/${selectedCase.id}/status`,
        {
          status: targetStatus,
          notes: transitionNotes,
          resolutionType: targetStatus === 'RESOLVED_FRAUD' ? 'SAR_FILED' : undefined,
          resolutionSummary: targetStatus === 'RESOLVED_FRAUD' ? transitionNotes : undefined,
        }
      );
      setSelectedCase(res.case);
      setCases(prev => prev.map(c => (c.id === res.case.id ? res.case : c)));
      setTransitionModalOpen(false);
      setTransitionNotes('');
    } catch (err: any) {
      alert(`Invalid State Transition: ${err.message}`);
    }
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.assignedToName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">SIU Investigation Case Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal forensic case files, evidence logs, notes journal, and Suspicious Activity Report (SAR) workflows
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cases by title, ID or investigator..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-full text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Case Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_INVESTIGATION">In Investigation</option>
            <option value="PENDING_SAR">Pending SAR Filing</option>
            <option value="RESOLVED_FRAUD">Resolved: Confirmed Fraud</option>
            <option value="RESOLVED_FALSE_POSITIVE">Resolved: False Positive</option>
            <option value="CLOSED_INCONCLUSIVE">Closed: Inconclusive</option>
          </select>
        </div>
      </div>

      {/* Main Split Layout: Case List on Left (1 col) and Selected Case Dossier on Right (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case List */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 font-semibold text-xs text-slate-700">
            Dossier Docket ({filteredCases.length})
          </div>
          <div className="divide-y divide-slate-100 max-h-[750px] overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-500">Loading cases...</div>
            ) : filteredCases.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No cases found.</div>
            ) : (
              filteredCases.map(c => {
                const isSelected = selectedCase?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-slate-900">{c.caseId}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-800 line-clamp-1">{c.title}</h3>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
                      <span>{c.assignedToName}</span>
                      <span className="text-rose-700 font-bold">{c.priority}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Case Dossier View */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 space-y-6 shadow-xs">
          {selectedCase ? (
            <>
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {selectedCase.caseId}
                    </span>
                    <StatusBadge status={selectedCase.status} />
                    <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      PRIORITY: {selectedCase.priority}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{selectedCase.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assigned Investigator: <span className="font-medium text-slate-800">{selectedCase.assignedToName}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTargetStatus('IN_INVESTIGATION');
                      setTransitionModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Update Status & Transition
                  </button>
                </div>
              </div>

              {/* Target Entities */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Target Entities Under Investigation
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedCase.targetEntities.map(t => (
                    <div key={t.id} className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                      <span className="font-semibold text-slate-900">{t.label}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{t.type} · {t.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Notes Journal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Investigation Notes Journal ({selectedCase.notes.length})
                  </span>
                </div>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {selectedCase.notes.map(note => (
                    <div key={note.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-semibold text-slate-900">{note.authorName} ({note.authorRole})</span>
                        <span className="font-mono text-[10px]">{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{note.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add forensic finding or interview note..."
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    disabled={isSubmittingNote || !newNoteText.trim()}
                    onClick={handleAddNote}
                    className="px-3 py-2 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log Note</span>
                  </button>
                </div>
              </div>

              {/* Timeline of Events */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Forensic Chain-of-Custody Timeline
                </span>
                <div className="space-y-2">
                  {selectedCase.timeline.map(tl => (
                    <div key={tl.id} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-mono text-slate-400 mr-2 text-[11px]">{new Date(tl.timestamp).toLocaleTimeString()}</span>
                        <span className="font-semibold text-slate-900 mr-1.5">{tl.actor}:</span>
                        <span>{tl.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a case file from the docket to review forensic evidence and notes.
            </div>
          )}
        </div>
      </div>

      {/* State Transition Modal */}
      {transitionModalOpen && selectedCase && (
        <Modal
          isOpen={transitionModalOpen}
          onClose={() => setTransitionModalOpen(false)}
          title={`Transition Case Status: ${selectedCase.caseId}`}
          subtitle={`Current State: ${selectedCase.status}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Status:</label>
              <select
                value={targetStatus}
                onChange={e => setTargetStatus(e.target.value as CaseStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none"
              >
                <option value="IN_INVESTIGATION">In Investigation (Active Examination)</option>
                <option value="PENDING_SAR">Pending SAR (Suspicious Activity Report Drafted)</option>
                <option value="RESOLVED_FRAUD">Resolved: Confirmed Fraud (Accounts Frozen / Legal Referral)</option>
                <option value="RESOLVED_FALSE_POSITIVE">Resolved: False Positive (Exonerated)</option>
                <option value="CLOSED_INCONCLUSIVE">Closed: Inconclusive (Insufficient Evidence)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Forensic Justification & Decision Note:</label>
              <textarea
                rows={4}
                value={transitionNotes}
                onChange={e => setTransitionNotes(e.target.value)}
                placeholder="Document legal reason, law enforcement referral number, or SAR filing tracking code..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setTransitionModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleTransitionStatus}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 cursor-pointer"
              >
                Confirm State Transition
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
