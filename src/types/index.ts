/**
 * FraudLens — Shared Domain Types and Data Contracts
 * Foundations of AI Project: Explainable Fraud Ring Detection System
 */

export type EntityType = 
  | 'CUSTOMER' 
  | 'ACCOUNT' 
  | 'TRANSACTION' 
  | 'CARD' 
  | 'MERCHANT' 
  | 'DEVICE' 
  | 'IP_ADDRESS' 
  | 'EMAIL' 
  | 'PHONE' 
  | 'ADDRESS';

export type RelationshipType = 
  | 'OWNS' 
  | 'INITIATED' 
  | 'RECEIVED' 
  | 'USED_DEVICE' 
  | 'USED_IP' 
  | 'USES_CARD' 
  | 'ASSOCIATED_EMAIL' 
  | 'ASSOCIATED_PHONE' 
  | 'REGISTERED_ADDRESS';

export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'NEW' | 'UNDER_REVIEW' | 'ESCALATED' | 'DISMISSED' | 'CONVERTED_TO_CASE';

export type CaseStatus = 'OPEN' | 'IN_INVESTIGATION' | 'PENDING_SAR' | 'RESOLVED_FRAUD' | 'RESOLVED_FALSE_POSITIVE' | 'CLOSED_INCONCLUSIVE';

export type UserRole = 'ADMIN' | 'INVESTIGATOR' | 'ANALYST' | 'AUDITOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  properties: Record<string, any>;
  riskScore?: number;
  isFlagged?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label: string;
  properties?: Record<string, any>;
  isFlagged?: boolean;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CustomerEntity {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ssnMasked: string;
  dateOfBirth: string;
  riskScore: number;
  status: 'ACTIVE' | 'FLAGGED' | 'SUSPENDED';
  accounts: string[];
  createdAt: string;
}

export interface AccountEntity {
  id: string;
  accountNumber: string;
  customerId: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'BUSINESS';
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'RESTRICTED';
  createdAt: string;
}

export interface TransactionEntity {
  id: string;
  transactionId: string;
  sourceAccountId: string;
  targetAccountId?: string;
  merchantId?: string;
  amount: number;
  currency: string;
  timestamp: string;
  type: 'TRANSFER' | 'CARD_PURCHASE' | 'ATM_WITHDRAWAL' | 'ACH_CREDIT';
  status: 'SETTLED' | 'PENDING' | 'DECLINED' | 'FLAGGED';
  deviceId?: string;
  ipAddress?: string;
  isSuspicious: boolean;
  notes?: string;
}

export interface DeviceEntity {
  id: string;
  deviceId: string;
  fingerprint: string;
  deviceType: 'MOBILE_IOS' | 'MOBILE_ANDROID' | 'DESKTOP_MAC' | 'DESKTOP_WIN' | 'EMULATOR';
  isJailbroken: boolean;
  firstSeen: string;
  lastSeen: string;
}

export interface IpAddressEntity {
  id: string;
  ip: string;
  isVpn: boolean;
  isDatacenter: boolean;
  country: string;
  city: string;
  asn: string;
}

export interface MerchantEntity {
  id: string;
  merchantName: string;
  categoryCode: string;
  category: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  chargebackRate: number;
}

// ==========================================
// SYMBOLIC AI & FORWARD CHAINING STRUCTURES
// ==========================================

export interface Fact {
  id: string;
  predicate: string;
  subject: string;
  object?: string;
  attributes?: Record<string, any>;
  source: 'GRAPH_EXTRACT' | 'INFERRED';
  timestamp: string;
  confidence: number;
}

export interface RuleParameter {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  value: any;
  defaultValue: any;
  unit?: string;
}

export interface ProductionRule {
  id: string; // e.g., 'FR-01'
  ruleCode: string;
  name: string;
  category: 'SHARED_INFRASTRUCTURE' | 'RAPID_VELOCITY' | 'RING_TOPOLOGY' | 'MERCHANT_COLLUSION' | 'ACCOUNT_TAKEOVER';
  severity: RiskSeverity;
  weight: number; // 1 - 100
  description: string;
  explanationTemplate: string;
  isEnabled: boolean;
  parameters: RuleParameter[];
  patternCypherHint: string;
  premisesDescription: string[];
  conclusionDescription: string;
  matchedCount: number;
  lastExecutedAt?: string;
}

export interface EvidenceGraphTrace {
  ruleId: string;
  ruleName: string;
  severity: RiskSeverity;
  weight: number;
  timestamp: string;
  matchedEntities: { id: string; type: EntityType; label: string }[];
  matchedEdges: { source: string; target: string; type: RelationshipType }[];
  matchedFacts: Fact[];
  summary: string;
  recommendation: string;
}

export interface FraudAlert {
  id: string;
  alertId: string;
  title: string;
  severity: RiskSeverity;
  status: AlertStatus;
  riskScore: number;
  primaryEntityId: string;
  primaryEntityType: EntityType;
  primaryEntityLabel: string;
  triggeredRules: {
    ruleId: string;
    ruleName: string;
    severity: RiskSeverity;
    weight: number;
    explanation: string;
  }[];
  evidenceTrace: EvidenceGraphTrace;
  assignedTo?: string;
  caseId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FraudRingCluster {
  id: string;
  ringId: string;
  name: string;
  topologyType: 'CIRCULAR_CYCLE' | 'SYNTHETIC_MESH' | 'HUB_AND_SPOKE' | 'MERCHANT_COLLUSION' | 'BURST_TAKEOVER';
  severity: RiskSeverity;
  aggregateRiskScore: number;
  entityCount: number;
  transactionCount: number;
  totalVolume: number;
  entities: { id: string; type: EntityType; label: string; roleInRing?: string }[];
  relevantTransactions: TransactionEntity[];
  triggeredRules: string[];
  firstActivity: string;
  latestActivity: string;
  explanation: string;
  caseCreated: boolean;
}

export interface InvestigationNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface CaseTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface InvestigationCase {
  id: string;
  caseId: string;
  title: string;
  status: CaseStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo: string;
  assignedToName: string;
  associatedAlertIds: string[];
  associatedRingId?: string;
  targetEntities: { id: string; type: EntityType; label: string }[];
  notes: InvestigationNote[];
  timeline: CaseTimelineEvent[];
  resolutionSummary?: string;
  resolutionType?: 'SAR_FILED' | 'ACCOUNTS_FROZEN' | 'EXONERATED_FALSE_POSITIVE' | 'INSUFFICIENT_EVIDENCE';
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
}

export interface InferenceCycleStep {
  cycle: number;
  ruleId: string;
  ruleName: string;
  matchedPremises: string[];
  newInferredFactsCount: number;
  inferredConclusions: string[];
  executionTimeMs: number;
}

export interface ForwardChainingExecutionReport {
  executionId: string;
  timestamp: string;
  status: 'COMPLETED_FIXED_POINT' | 'MAX_ITERATIONS_REACHED';
  iterationsCount: number;
  initialFactsCount: number;
  finalFactsCount: number;
  rulesEvaluated: number;
  rulesTriggered: number;
  totalAlertsGenerated: number;
  totalRingsDetected: number;
  executionDurationMs: number;
  cycleSteps: InferenceCycleStep[];
}
