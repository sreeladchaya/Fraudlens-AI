/**
 * FraudLens — Application Database Store & Service Layer
 * Foundations of AI Project
 * 
 * Provides relational persistence, state transitions, audit logging, and
 * coordination between the Knowledge Graph, Forward Chaining, Alerts, and Cases.
 */

import bcrypt from 'bcryptjs';
import {
  User,
  ProductionRule,
  FraudAlert,
  FraudRingCluster,
  InvestigationCase,
  AuditLogEntry,
  CustomerEntity,
  AccountEntity,
  TransactionEntity,
  KnowledgeGraphData,
  ForwardChainingExecutionReport,
} from '../types/index.ts';
import { INITIAL_RULE_CATALOGUE } from './ruleCatalogue.ts';
import { generateSyntheticDataset, SyntheticDataset } from './syntheticData.ts';
import { ForwardChainingEngine } from './forwardChaining.ts';

export class DatabaseStore {
  public users: Map<string, User> = new Map();
  public passwordHashes: Map<string, string> = new Map();
  public rules: Map<string, ProductionRule> = new Map();
  public alerts: Map<string, FraudAlert> = new Map();
  public rings: Map<string, FraudRingCluster> = new Map();
  public cases: Map<string, InvestigationCase> = new Map();
  public auditLogs: AuditLogEntry[] = [];
  public executionReports: ForwardChainingExecutionReport[] = [];
  
  public dataset!: SyntheticDataset;
  public engine!: ForwardChainingEngine;

  constructor() {
    this.seedUsers();
    this.seedRules();
    this.resetDatasetAndRunEngine();
    this.seedInitialCases();
  }

  private seedUsers(): void {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('FraudLens2026!', salt);

    const usersData: User[] = [
      {
        id: 'usr-admin-01',
        email: 'admin@fraudlens.io',
        name: 'Dr. Sarah Al-Mansoor',
        role: 'ADMIN',
        department: 'Financial Crime & AI Governance',
        avatarUrl: '',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'usr-inv-01',
        email: 'investigator@fraudlens.io',
        name: 'James Reynolds, CFE',
        role: 'INVESTIGATOR',
        department: 'Special Investigations Unit (SIU)',
        avatarUrl: '',
        createdAt: '2026-01-15T00:00:00Z',
      },
      {
        id: 'usr-ana-01',
        email: 'analyst@fraudlens.io',
        name: 'Maya Lin',
        role: 'ANALYST',
        department: 'AML Transaction Monitoring',
        avatarUrl: '',
        createdAt: '2026-02-01T00:00:00Z',
      },
      {
        id: 'usr-aud-01',
        email: 'auditor@fraudlens.io',
        name: 'Edward Hayes',
        role: 'AUDITOR',
        department: 'Regulatory Compliance & Audit',
        avatarUrl: '',
        createdAt: '2026-02-10T00:00:00Z',
      },
    ];

    usersData.forEach(u => {
      this.users.set(u.id, u);
      this.passwordHashes.set(u.email.toLowerCase(), hash);
    });
  }

  private seedRules(): void {
    INITIAL_RULE_CATALOGUE.forEach(r => {
      this.rules.set(r.id, { ...r });
    });
  }

  public resetDatasetAndRunEngine(seed: number = 42): ForwardChainingExecutionReport {
    this.dataset = generateSyntheticDataset(seed);
    const activeRules = Array.from(this.rules.values());
    this.engine = new ForwardChainingEngine(activeRules, this.dataset);
    
    // Clear previous dynamic state
    this.alerts.clear();
    this.rings.clear();

    const { alerts, rings, report } = this.engine.runInference(5);

    alerts.forEach(a => this.alerts.set(a.id, a));
    rings.forEach(r => this.rings.set(r.id, r));
    this.executionReports.unshift(report);

    this.logAudit({
      userId: 'system',
      userName: 'Forward Chaining Engine',
      action: 'INFERENCE_EXECUTION',
      resource: 'RULE_ENGINE',
      resourceId: report.executionId,
      details: {
        iterations: report.iterationsCount,
        alertsGenerated: alerts.length,
        ringsDetected: rings.length,
        durationMs: report.executionDurationMs,
      },
      ipAddress: '127.0.0.1',
    });

    return report;
  }

  private seedInitialCases(): void {
    // Seed initial cases for realistic investigation workflows
    const case1: InvestigationCase = {
      id: 'CASE-2026-001',
      caseId: 'CASE-2026-001',
      title: 'The Ouroboros 3-Hop Laundering Cycle',
      status: 'IN_INVESTIGATION',
      priority: 'CRITICAL',
      assignedTo: 'usr-inv-01',
      assignedToName: 'James Reynolds, CFE',
      associatedAlertIds: ['ALT-FR13-ACC-OURO-01'],
      associatedRingId: 'RING-OUROBOROS',
      targetEntities: [
        { id: 'ACC-OURO-01', type: 'ACCOUNT', label: 'ACC-OURO-01 (Klaus Richter)' },
        { id: 'ACC-OURO-02', type: 'ACCOUNT', label: 'ACC-OURO-02 (Amara Okafor)' },
        { id: 'ACC-OURO-03', type: 'ACCOUNT', label: 'ACC-OURO-03 (Siddharth Nair)' },
      ],
      notes: [
        {
          id: 'note-01',
          authorId: 'usr-inv-01',
          authorName: 'James Reynolds, CFE',
          authorRole: 'INVESTIGATOR',
          text: 'Verified bank wire Swift references for legs 1 and 2. High risk of trade-based invoice fraud between Berlin and Lagos.',
          createdAt: '2026-10-17T14:00:00Z',
        },
      ],
      timeline: [
        {
          id: 'tl-01',
          timestamp: '2026-10-17T11:20:00Z',
          actor: 'Forward Chaining Engine',
          action: 'RULE_TRIGGERED',
          details: 'Rule FR-13 (Circular Fund Movement 3-Hop) fired with 99% confidence.',
        },
        {
          id: 'tl-02',
          timestamp: '2026-10-17T12:00:00Z',
          actor: 'James Reynolds, CFE',
          action: 'STATUS_CHANGE',
          details: 'Promoted alert ALT-FR13 to Investigation Case with CRITICAL priority.',
        },
      ],
      createdAt: '2026-10-17T12:00:00Z',
      updatedAt: '2026-10-18T15:00:00Z',
    };

    const case2: InvestigationCase = {
      id: 'CASE-2026-002',
      caseId: 'CASE-2026-002',
      title: 'Victoria Chen ATO & Geolocation Leap',
      status: 'PENDING_SAR',
      priority: 'HIGH',
      assignedTo: 'usr-inv-01',
      assignedToName: 'James Reynolds, CFE',
      associatedAlertIds: ['ALT-FR23-ACC-VIC-01'],
      associatedRingId: 'RING-SHADOW',
      targetEntities: [
        { id: 'CUST-VIC-01', type: 'CUSTOMER', label: 'Victoria Chen' },
        { id: 'ACC-VIC-01', type: 'ACCOUNT', label: 'Account 5511 (Victoria)' },
      ],
      notes: [
        {
          id: 'note-02',
          authorId: 'usr-inv-01',
          authorName: 'James Reynolds, CFE',
          authorRole: 'INVESTIGATOR',
          text: 'Confirmed with customer by phone: She was in London at 04:00 AM and did not initiate $14,900 transfer. Prepared FinCEN SAR draft.',
          createdAt: '2026-10-18T09:30:00Z',
        },
      ],
      timeline: [
        {
          id: 'tl-03',
          timestamp: '2026-10-18T04:30:00Z',
          actor: 'Forward Chaining Engine',
          action: 'ALERT_GENERATED',
          details: 'FR-23 fired for impossible travel velocity (London to Lagos).',
        },
        {
          id: 'tl-04',
          timestamp: '2026-10-18T08:15:00Z',
          actor: 'James Reynolds, CFE',
          action: 'STATUS_CHANGE',
          details: 'Account frozen; status transitioned to PENDING_SAR.',
        },
      ],
      createdAt: '2026-10-18T08:00:00Z',
      updatedAt: '2026-10-18T10:00:00Z',
    };

    this.cases.set(case1.id, case1);
    this.cases.set(case2.id, case2);
  }

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.auditLogs.unshift(fullEntry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return fullEntry;
  }

  // State Transition Validation for Investigation Cases
  public updateCaseStatus(
    caseId: string, 
    newStatus: InvestigationCase['status'], 
    user: User, 
    notes?: string,
    resolutionType?: InvestigationCase['resolutionType'],
    resolutionSummary?: string
  ): InvestigationCase {
    const c = this.cases.get(caseId);
    if (!c) throw new Error(`Case ${caseId} not found`);

    const allowedTransitions: Record<InvestigationCase['status'], InvestigationCase['status'][]> = {
      OPEN: ['IN_INVESTIGATION', 'RESOLVED_FALSE_POSITIVE', 'CLOSED_INCONCLUSIVE'],
      IN_INVESTIGATION: ['PENDING_SAR', 'RESOLVED_FRAUD', 'RESOLVED_FALSE_POSITIVE', 'CLOSED_INCONCLUSIVE'],
      PENDING_SAR: ['RESOLVED_FRAUD', 'CLOSED_INCONCLUSIVE'],
      RESOLVED_FRAUD: [],
      RESOLVED_FALSE_POSITIVE: [],
      CLOSED_INCONCLUSIVE: ['IN_INVESTIGATION'], // can re-open on new evidence
    };

    if (!allowedTransitions[c.status].includes(newStatus)) {
      throw new Error(`Invalid state transition from ${c.status} to ${newStatus}`);
    }

    const previousStatus = c.status;
    c.status = newStatus;
    c.updatedAt = new Date().toISOString();

    if (resolutionType) c.resolutionType = resolutionType;
    if (resolutionSummary) c.resolutionSummary = resolutionSummary;

    c.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: user.name,
      action: 'STATUS_TRANSITION',
      details: `Status transitioned from ${previousStatus} to ${newStatus}.${notes ? ' Note: ' + notes : ''}`,
    });

    if (notes) {
      c.notes.push({
        id: `note-${Date.now()}`,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        text: notes,
        createdAt: new Date().toISOString(),
      });
    }

    this.logAudit({
      userId: user.id,
      userName: user.name,
      action: 'CASE_STATUS_TRANSITION',
      resource: 'CASE',
      resourceId: caseId,
      details: { from: previousStatus, to: newStatus, resolutionType, resolutionSummary },
      ipAddress: '127.0.0.1',
    });

    return c;
  }

  public createCaseFromAlert(alertId: string, user: User, title?: string, priority: InvestigationCase['priority'] = 'HIGH'): InvestigationCase {
    const alert = this.alerts.get(alertId);
    if (!alert) throw new Error(`Alert ${alertId} not found`);

    const newCaseId = `CASE-2026-${String(this.cases.size + 1).padStart(3, '0')}`;
    const newCase: InvestigationCase = {
      id: newCaseId,
      caseId: newCaseId,
      title: title || `Investigation: ${alert.title}`,
      status: 'OPEN',
      priority: priority,
      assignedTo: user.id,
      assignedToName: user.name,
      associatedAlertIds: [alert.id],
      targetEntities: alert.evidenceTrace.matchedEntities.map(e => ({ id: e.id, type: e.type, label: e.label })),
      notes: [
        {
          id: `note-${Date.now()}`,
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          text: `Case opened from Alert ${alert.alertId}. Initial Risk Score: ${alert.riskScore}/100.`,
          createdAt: new Date().toISOString(),
        },
      ],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: user.name,
          action: 'CASE_CREATED',
          details: `Promoted from Alert ${alert.alertId} (${alert.title}).`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cases.set(newCase.id, newCase);
    alert.status = 'CONVERTED_TO_CASE';
    alert.caseId = newCase.id;

    this.logAudit({
      userId: user.id,
      userName: user.name,
      action: 'CASE_CREATED_FROM_ALERT',
      resource: 'CASE',
      resourceId: newCase.id,
      details: { alertId, title: newCase.title, priority },
      ipAddress: '127.0.0.1',
    });

    return newCase;
  }
}

// Global Singleton Instance
export const db = new DatabaseStore();
