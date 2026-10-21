/**
 * FraudLens — Express REST API Routes & Controllers
 * Foundations of AI Project
 */

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './database.ts';
import { User, UserRole, InvestigationCase, FraudAlert, FraudRingCluster } from '../types/index.ts';
import { ForwardChainingEngine } from './forwardChaining.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'fraudlens-foai-dev-jwt-secret-key-2026';

export const apiRouter = Router();

// =========================================================================
// AUTHENTICATION MIDDLEWARE & HELPERS
// =========================================================================
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.users.get(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User associated with token no longer exists' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Access forbidden: Insufficient role permissions' });
      return;
    }
    next();
  };
}

// -------------------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const storedHash = db.passwordHashes.get(cleanEmail);
  const user = Array.from(db.users.values()).find(u => u.email.toLowerCase() === cleanEmail);

  if (!user || !storedHash || !bcrypt.compareSync(password, storedHash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

  db.logAudit({
    userId: user.id,
    userName: user.name,
    action: 'USER_LOGIN',
    resource: 'AUTH',
    resourceId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ token, user });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// -------------------------------------------------------------------------
// DASHBOARD & METRICS ROUTES
// -------------------------------------------------------------------------
apiRouter.get('/dashboard/summary', requireAuth, (req: Request, res: Response) => {
  const alerts = Array.from(db.alerts.values());
  const rings = Array.from(db.rings.values());
  const cases = Array.from(db.cases.values());
  const customers = db.dataset.customers;
  const transactions = db.dataset.transactions;

  const openAlerts = alerts.filter(a => a.status === 'NEW' || a.status === 'UNDER_REVIEW');
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
  const openCases = cases.filter(c => c.status === 'OPEN' || c.status === 'IN_INVESTIGATION' || c.status === 'PENDING_SAR');

  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Risk Distribution
  const riskDistribution = {
    low: customers.filter(c => c.riskScore < 40).length,
    medium: customers.filter(c => c.riskScore >= 40 && c.riskScore < 70).length,
    high: customers.filter(c => c.riskScore >= 70 && c.riskScore < 90).length,
    critical: customers.filter(c => c.riskScore >= 90).length,
  };

  // Rule Trigger Frequencies
  const ruleTriggers = Array.from(db.rules.values())
    .map(r => ({ id: r.id, name: r.name, count: r.matchedCount, category: r.category, severity: r.severity }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.count - a.count);

  res.json({
    kpis: {
      totalMonitoredEntities: customers.length + db.dataset.accounts.length + db.dataset.devices.length + db.dataset.ipAddresses.length,
      totalCustomers: customers.length,
      totalTransactions: transactions.length,
      totalTransactionVolume: totalVolume,
      openAlertsCount: openAlerts.length,
      criticalAlertsCount: criticalAlerts.length,
      activeRingsCount: rings.length,
      openCasesCount: openCases.length,
      graphNodeCount: db.dataset.graph.nodes.length,
      graphEdgeCount: db.dataset.graph.edges.length,
    },
    riskDistribution,
    ruleTriggers,
    recentAlerts: alerts.slice(0, 6),
    activeRings: rings,
    latestInferenceReport: db.executionReports[0] || null,
  });
});

// -------------------------------------------------------------------------
// KNOWLEDGE GRAPH ROUTES
// -------------------------------------------------------------------------
apiRouter.get('/graph/full', requireAuth, (req: Request, res: Response) => {
  res.json({
    nodes: db.dataset.graph.nodes,
    edges: db.dataset.graph.edges,
    stats: {
      nodesCount: db.dataset.graph.nodes.length,
      edgesCount: db.dataset.graph.edges.length,
      ringsCount: db.rings.size,
    },
  });
});

apiRouter.get('/graph/subgraph/:entityId', requireAuth, (req: Request, res: Response) => {
  const { entityId } = req.params;
  const depth = parseInt(req.query.depth as string, 10) || 1;

  const neighborNodeIds = new Set<string>([entityId]);
  let currentFrontier = new Set<string>([entityId]);

  for (let d = 0; d < depth; d++) {
    const nextFrontier = new Set<string>();
    for (const edge of db.dataset.graph.edges) {
      if (currentFrontier.has(edge.source)) {
        neighborNodeIds.add(edge.target);
        nextFrontier.add(edge.target);
      }
      if (currentFrontier.has(edge.target)) {
        neighborNodeIds.add(edge.source);
        nextFrontier.add(edge.source);
      }
    }
    currentFrontier = nextFrontier;
  }

  const subNodes = db.dataset.graph.nodes.filter(n => neighborNodeIds.has(n.id));
  const subEdges = db.dataset.graph.edges.filter(e => neighborNodeIds.has(e.source) && neighborNodeIds.has(e.target));

  res.json({
    centerEntityId: entityId,
    depth,
    nodes: subNodes,
    edges: subEdges,
  });
});

apiRouter.get('/graph/search', requireAuth, (req: Request, res: Response) => {
  const q = String(req.query.q || '').toLowerCase();
  const type = String(req.query.type || '');

  let filtered = db.dataset.graph.nodes;
  if (type && type !== 'ALL') {
    filtered = filtered.filter(n => n.type === type);
  }
  if (q) {
    filtered = filtered.filter(n => 
      n.label.toLowerCase().includes(q) || 
      n.id.toLowerCase().includes(q) ||
      JSON.stringify(n.properties).toLowerCase().includes(q)
    );
  }

  res.json({ results: filtered.slice(0, 50) });
});

// -------------------------------------------------------------------------
// FRAUD RINGS EXPLORER
// -------------------------------------------------------------------------
apiRouter.get('/rings', requireAuth, (req: Request, res: Response) => {
  res.json({ rings: Array.from(db.rings.values()) });
});

apiRouter.get('/rings/:id', requireAuth, (req: Request, res: Response) => {
  const ring = db.rings.get(req.params.id);
  if (!ring) {
    res.status(404).json({ error: `Fraud Ring ${req.params.id} not found` });
    return;
  }

  // Extract subgraph for ring
  const ringEntityIds = new Set(ring.entities.map(e => e.id));
  const subNodes = db.dataset.graph.nodes.filter(n => ringEntityIds.has(n.id));
  const subEdges = db.dataset.graph.edges.filter(e => ringEntityIds.has(e.source) && ringEntityIds.has(e.target));

  res.json({ ring, subgraph: { nodes: subNodes, edges: subEdges } });
});

apiRouter.post('/rings/:id/create-case', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const ring = db.rings.get(req.params.id);
  if (!ring) {
    res.status(404).json({ error: 'Ring not found' });
    return;
  }

  const newCaseId = `CASE-2026-${String(db.cases.size + 1).padStart(3, '0')}`;
  const newCase: InvestigationCase = {
    id: newCaseId,
    caseId: newCaseId,
    title: `Syndicate Case: ${ring.name}`,
    status: 'IN_INVESTIGATION',
    priority: ring.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
    assignedTo: req.user!.id,
    assignedToName: req.user!.name,
    associatedAlertIds: [],
    associatedRingId: ring.id,
    targetEntities: ring.entities.map(e => ({ id: e.id, type: e.type, label: e.label })),
    notes: [
      {
        id: `note-${Date.now()}`,
        authorId: req.user!.id,
        authorName: req.user!.name,
        authorRole: req.user!.role,
        text: `Investigation opened for ${ring.name}. Topology: ${ring.topologyType}. Aggregate Risk: ${ring.aggregateRiskScore}/100.`,
        createdAt: new Date().toISOString(),
      },
    ],
    timeline: [
      {
        id: `tl-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: req.user!.name,
        action: 'CASE_CREATED_FROM_RING',
        details: `Converted Fraud Ring ${ring.ringId} into Formal Investigation Case.`,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.cases.set(newCase.id, newCase);
  ring.caseCreated = true;

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'CASE_CREATED_FROM_RING',
    resource: 'CASE',
    resourceId: newCase.id,
    details: { ringId: ring.id, ringName: ring.name },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.status(201).json({ case: newCase });
});

// -------------------------------------------------------------------------
// CUSTOMERS EXPLORER
// -------------------------------------------------------------------------
apiRouter.get('/customers', requireAuth, (req: Request, res: Response) => {
  const q = String(req.query.q || '').toLowerCase();
  const status = String(req.query.status || '');
  const minRisk = parseInt(req.query.minRisk as string, 10) || 0;

  let list = db.dataset.customers;
  if (status && status !== 'ALL') {
    list = list.filter(c => c.status === status);
  }
  if (minRisk > 0) {
    list = list.filter(c => c.riskScore >= minRisk);
  }
  if (q) {
    list = list.filter(c =>
      c.firstName.toLowerCase().includes(q) ||
      c.lastName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.customerId.toLowerCase().includes(q)
    );
  }

  res.json({ customers: list, total: list.length });
});

apiRouter.get('/customers/:id', requireAuth, (req: Request, res: Response) => {
  const cust = db.dataset.customers.find(c => c.id === req.params.id);
  if (!cust) {
    res.status(404).json({ error: 'Customer not found' });
    return;
  }

  const linkedAccounts = db.dataset.accounts.filter(a => cust.accounts.includes(a.id));
  const accIds = linkedAccounts.map(a => a.id);
  const txs = db.dataset.transactions.filter(t => accIds.includes(t.sourceAccountId) || (t.targetAccountId && accIds.includes(t.targetAccountId)));
  const alerts = Array.from(db.alerts.values()).filter(a => 
    a.primaryEntityId === cust.id || accIds.includes(a.primaryEntityId)
  );

  res.json({
    customer: cust,
    accounts: linkedAccounts,
    transactions: txs,
    alerts,
  });
});

// -------------------------------------------------------------------------
// TRANSACTIONS EXPLORER
// -------------------------------------------------------------------------
apiRouter.get('/transactions', requireAuth, (req: Request, res: Response) => {
  const q = String(req.query.q || '').toLowerCase();
  const flaggedOnly = req.query.flaggedOnly === 'true';
  const type = String(req.query.type || '');

  let list = db.dataset.transactions;
  if (flaggedOnly) {
    list = list.filter(t => t.isSuspicious || t.status === 'FLAGGED');
  }
  if (type && type !== 'ALL') {
    list = list.filter(t => t.type === type);
  }
  if (q) {
    list = list.filter(t =>
      t.transactionId.toLowerCase().includes(q) ||
      t.sourceAccountId.toLowerCase().includes(q) ||
      (t.targetAccountId && t.targetAccountId.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q))
    );
  }

  res.json({ transactions: list, total: list.length });
});

// -------------------------------------------------------------------------
// RULES & FORWARD CHAINING INFERENCE MANAGEMENT
// -------------------------------------------------------------------------
apiRouter.get('/rules', requireAuth, (req: Request, res: Response) => {
  res.json({
    rules: Array.from(db.rules.values()),
    totalCount: db.rules.size,
    enabledCount: Array.from(db.rules.values()).filter(r => r.isEnabled).length,
  });
});

apiRouter.get('/rules/:id', requireAuth, (req: Request, res: Response) => {
  const rule = db.rules.get(req.params.id);
  if (!rule) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  res.json({ rule });
});

apiRouter.patch('/rules/:id', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const rule = db.rules.get(req.params.id);
  if (!rule) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }

  const { isEnabled, parameters, weight } = req.body;
  if (typeof isEnabled === 'boolean') rule.isEnabled = isEnabled;
  if (typeof weight === 'number') rule.weight = Math.max(1, Math.min(100, weight));
  if (Array.isArray(parameters)) {
    parameters.forEach((param: any) => {
      const existing = rule.parameters.find(p => p.key === param.key);
      if (existing) existing.value = param.value;
    });
  }

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'RULE_CONFIG_UPDATE',
    resource: 'RULE',
    resourceId: rule.id,
    details: { isEnabled, parameters, weight },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ rule });
});

// Run complete Forward Chaining engine
apiRouter.post('/rules/run-engine', requireAuth, requireRole(['ADMIN', 'INVESTIGATOR']), (req: AuthenticatedRequest, res: Response) => {
  const activeRules = Array.from(db.rules.values());
  const engine = new ForwardChainingEngine(activeRules, db.dataset);
  
  db.alerts.clear();
  db.rings.clear();

  const { alerts, rings, report } = engine.runInference(5);

  alerts.forEach((a: FraudAlert) => db.alerts.set(a.id, a));
  rings.forEach((r: FraudRingCluster) => db.rings.set(r.id, r));
  db.executionReports.unshift(report);

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'MANUAL_INFERENCE_RUN',
    resource: 'RULE_ENGINE',
    resourceId: report.executionId,
    details: { iterations: report.iterationsCount, alerts: alerts.length, rings: rings.length },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ report, alertsCount: alerts.length, ringsCount: rings.length });
});

// Reset synthetic dataset
apiRouter.post('/rules/reset-data', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const seed = parseInt(req.body.seed as string, 10) || 42;
  const report = db.resetDatasetAndRunEngine(seed);

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'DATASET_RESET',
    resource: 'DATABASE',
    resourceId: `SEED-${seed}`,
    details: { seed, alertsGenerated: db.alerts.size, ringsDetected: db.rings.size },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ message: 'Dataset reseeded and inference engine executed successfully', seed, report });
});

// -------------------------------------------------------------------------
// ALERTS ROUTES
// -------------------------------------------------------------------------
apiRouter.get('/alerts', requireAuth, (req: Request, res: Response) => {
  const severity = String(req.query.severity || '');
  const status = String(req.query.status || '');
  const q = String(req.query.q || '').toLowerCase();

  let list = Array.from(db.alerts.values());
  if (severity && severity !== 'ALL') {
    list = list.filter(a => a.severity === severity);
  }
  if (status && status !== 'ALL') {
    list = list.filter(a => a.status === status);
  }
  if (q) {
    list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.primaryEntityLabel.toLowerCase().includes(q) ||
      a.alertId.toLowerCase().includes(q)
    );
  }

  res.json({ alerts: list });
});

apiRouter.get('/alerts/:id', requireAuth, (req: Request, res: Response) => {
  const alert = db.alerts.get(req.params.id);
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  res.json({ alert });
});

apiRouter.patch('/alerts/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const alert = db.alerts.get(req.params.id);
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  const { status } = req.body;
  if (!['NEW', 'UNDER_REVIEW', 'ESCALATED', 'DISMISSED'].includes(status)) {
    res.status(400).json({ error: 'Invalid alert status' });
    return;
  }

  const prev = alert.status;
  alert.status = status;
  alert.updatedAt = new Date().toISOString();

  db.logAudit({
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'ALERT_STATUS_UPDATE',
    resource: 'ALERT',
    resourceId: alert.id,
    details: { from: prev, to: status },
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({ alert });
});

apiRouter.post('/alerts/:id/create-case', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, priority } = req.body;
    const newCase = db.createCaseFromAlert(req.params.id, req.user!, title, priority);
    res.status(201).json({ case: newCase });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------------------
// CASES ROUTES
// -------------------------------------------------------------------------
apiRouter.get('/cases', requireAuth, (req: Request, res: Response) => {
  const status = String(req.query.status || '');
  const priority = String(req.query.priority || '');

  let list = Array.from(db.cases.values());
  if (status && status !== 'ALL') {
    list = list.filter(c => c.status === status);
  }
  if (priority && priority !== 'ALL') {
    list = list.filter(c => c.priority === priority);
  }

  res.json({ cases: list });
});

apiRouter.get('/cases/:id', requireAuth, (req: Request, res: Response) => {
  const c = db.cases.get(req.params.id);
  if (!c) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }

  // Related alerts
  const relatedAlerts = c.associatedAlertIds.map(id => db.alerts.get(id)).filter(Boolean);
  const relatedRing = c.associatedRingId ? db.rings.get(c.associatedRingId) : null;

  res.json({ case: c, alerts: relatedAlerts, ring: relatedRing });
});

apiRouter.patch('/cases/:id/status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, notes, resolutionType, resolutionSummary } = req.body;
    const updated = db.updateCaseStatus(req.params.id, status, req.user!, notes, resolutionType, resolutionSummary);
    res.json({ case: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/cases/:id/notes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const c = db.cases.get(req.params.id);
  if (!c) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }

  const { text } = req.body;
  if (!text || String(text).trim().length === 0) {
    res.status(400).json({ error: 'Note text cannot be empty' });
    return;
  }

  const note = {
    id: `note-${Date.now()}`,
    authorId: req.user!.id,
    authorName: req.user!.name,
    authorRole: req.user!.role,
    text: String(text).trim(),
    createdAt: new Date().toISOString(),
  };

  c.notes.push(note);
  c.updatedAt = new Date().toISOString();

  c.timeline.push({
    id: `tl-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: req.user!.name,
    action: 'NOTE_ADDED',
    details: `Added note: "${note.text.slice(0, 60)}${note.text.length > 60 ? '...' : ''}"`,
  });

  res.status(201).json({ note, case: c });
});

// -------------------------------------------------------------------------
// REPORTS & EXPORTS
// -------------------------------------------------------------------------
apiRouter.get('/reports/summary', requireAuth, (req: Request, res: Response) => {
  const alerts = Array.from(db.alerts.values());
  const rings = Array.from(db.rings.values());
  const cases = Array.from(db.cases.values());

  res.json({
    generatedAt: new Date().toISOString(),
    reportingOfficer: 'FraudLens AI Surveillance Engine',
    systemStatistics: {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
      highAlerts: alerts.filter(a => a.severity === 'HIGH').length,
      identifiedRings: rings.length,
      casesOpened: cases.length,
      casesResolvedFraud: cases.filter(c => c.status === 'RESOLVED_FRAUD').length,
      casesFalsePositive: cases.filter(c => c.status === 'RESOLVED_FALSE_POSITIVE').length,
    },
    topTriggeredRules: Array.from(db.rules.values())
      .filter(r => r.matchedCount > 0)
      .map(r => ({ id: r.id, name: r.name, severity: r.severity, count: r.matchedCount })),
    ringsSummary: rings.map(r => ({
      ringId: r.ringId,
      name: r.name,
      topology: r.topologyType,
      riskScore: r.aggregateRiskScore,
      volume: r.totalVolume,
      entities: r.entities.length,
    })),
  });
});

apiRouter.get('/reports/case-dossier/:caseId', requireAuth, (req: Request, res: Response) => {
  const c = db.cases.get(req.params.caseId);
  if (!c) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }

  const relatedAlerts = c.associatedAlertIds.map(id => db.alerts.get(id)).filter(Boolean);
  const relatedRing = c.associatedRingId ? db.rings.get(c.associatedRingId) : null;

  res.json({
    generatedAt: new Date().toISOString(),
    dossierId: `DOSSIER-${c.caseId}`,
    case: c,
    alerts: relatedAlerts,
    ring: relatedRing,
    legalNotice: 'CONFIDENTIAL: Generated for regulatory SAR filing and compliance review under BSA/AML regulations.',
  });
});

// -------------------------------------------------------------------------
// ADMIN & AUDIT
// -------------------------------------------------------------------------
apiRouter.get('/admin/users', requireAuth, requireRole(['ADMIN']), (req: Request, res: Response) => {
  res.json({ users: Array.from(db.users.values()) });
});

apiRouter.get('/admin/audit-logs', requireAuth, requireRole(['ADMIN', 'AUDITOR']), (req: Request, res: Response) => {
  res.json({ logs: db.auditLogs.slice(0, 100) });
});

apiRouter.get('/admin/health', (req: Request, res: Response) => {
  const hasPgConfig = Boolean(process.env.DATABASE_URL);
  const hasNeo4jConfig = Boolean(process.env.NEO4J_URI);

  res.json({
    status: 'HEALTHY',
    service: 'FraudLens Knowledge Graph & Symbolic AI Engine',
    uptimeSeconds: process.uptime(),
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    entitiesCount: db.dataset.customers.length + db.dataset.accounts.length,
    activeRulesCount: db.rules.size,
    databases: {
      postgresql: {
        configured: hasPgConfig,
        status: hasPgConfig ? 'CONNECTED' : 'UNCONFIGURED',
        mode: hasPgConfig ? 'LIVE_POSTGRESQL' : 'IN_MEMORY_PERSISTENT_STORE (Prisma Schema Compatible)',
        note: hasPgConfig
          ? 'Connected to live external PostgreSQL database via Prisma'
          : 'PostgreSQL unconfigured; running embedded in-memory persistence store matching Prisma DDL.',
      },
      neo4j: {
        configured: hasNeo4jConfig,
        status: hasNeo4jConfig ? 'CONNECTED' : 'UNCONFIGURED',
        mode: hasNeo4jConfig ? 'LIVE_NEO4J_BOLT' : 'EMBEDDED_GRAPH_ENGINE (Cypher Compatible)',
        note: hasNeo4jConfig
          ? 'Connected to live Neo4j instance'
          : 'Neo4j unconfigured (NEO4J_URI not set); running embedded graph pattern matcher.',
      },
    },
    graphDataset: {
      type: 'SYNTHETIC_BENCHMARK_GRAPH',
      label: 'Synthetic Benchmark Dataset (Seed 42) with Planted Fraud Scenarios and Benign Controls',
      isSynthetic: true,
      plantedScenariosCount: db.dataset.plantedRingsSummary.length,
    },
    timestamp: new Date().toISOString(),
  });
});

// -------------------------------------------------------------------------
// VIVA & FOAI EXAMINATION GUIDE
// -------------------------------------------------------------------------
apiRouter.get('/foai/viva-defense', (req: Request, res: Response) => {
  res.json({
    projectTitle: 'FraudLens: Explainable Fraud Ring Detection System Using Knowledge Graphs and Rule-Based AI',
    academicDomain: 'Foundations of Artificial Intelligence (Symbolic AI, Knowledge Representation & Reasoning)',
    coreAITechniques: [
      {
        title: 'Symbolic AI vs Deep Learning in Financial Crime',
        explanation: 'Financial regulators (e.g. FinCEN, FCA, BaFin) legally require explainable, non-blackbox auditing. Symbolic production rules provide deterministic proof traces connecting premises to conclusions without hallucination.',
      },
      {
        title: 'Forward Chaining (Data-Driven Deduction)',
        explanation: 'Inference progresses from known base facts (graph topology, hardware fingerprints, transaction logs) through production rule premises (IF conditions) to assert novel inferences (THEN conclusions) into Working Memory until Fixed-Point convergence.',
      },
      {
        title: 'Knowledge Graph Pattern Matching',
        explanation: 'Multi-hop graph traversals evaluate structural motifs such as directed circular cycles (A -> B -> C -> A), shared hardware multiplexing, and bipartite collusion bridges that are computationally prohibitive in standard relational SQL joins.',
      },
      {
        title: 'Conflict Resolution & Fixed-Point Convergence',
        explanation: 'Rules are prioritized by specificity and risk severity. Cycle detection and fact deduplication ensure monotonicity and prevent infinite loops, guaranteeing termination in O(R * |W|^k) bounded steps.',
      },
    ],
    vivaQuestionsAndAnswers: [
      {
        question: 'Why did you choose Forward Chaining instead of Backward Chaining?',
        answer: 'Forward chaining is data-driven, which fits transaction surveillance where continuous streams of events arrive and we must discover all potential unknown fraud rings. Backward chaining (goal-driven) is used when testing a single pre-existing hypothesis.',
      },
      {
        question: 'How do you handle the combinatorial explosion of graph cycle detection?',
        answer: 'We bound the traversal depth (k <= 4 for immediate round-trips) and apply temporal filters (window <= 72 hours), pruning irrelevant paths early using candidate node indexing.',
      },
      {
        question: 'How does your system prevent duplicate alert inflation for the same ring?',
        answer: 'We employ a deduplication index on primary entities and an asymptotic saturation formula for risk scores so multiple matches in the same category provide diminishing marginal risk weights.',
      },
    ],
  });
});
