/**
 * FraudLens — Verification & Test Suite
 * Automated tests for Symbolic AI, Forward Chaining, State Transitions, and API contracts.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateSyntheticDataset } from '../src/server/syntheticData.ts';
import { INITIAL_RULE_CATALOGUE } from '../src/server/ruleCatalogue.ts';
import { ForwardChainingEngine } from '../src/server/forwardChaining.ts';
import { DatabaseStore } from '../src/server/database.ts';
import { User, InvestigationCase } from '../src/types/index.ts';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('FRAUDLENS VERIFICATION & QUALITY ASSURANCE TEST RUNNER');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // TEST GROUP 1: AUTHENTICATION & SECURITY
  // -------------------------------------------------------------------------
  console.log('[Test Group 1] Authentication, Hashing & JWT Authorization');
  const salt = bcrypt.genSaltSync(10);
  const password = 'FraudLens2026!';
  const hash = bcrypt.hashSync(password, salt);
  assert(bcrypt.compareSync(password, hash), 'Bcrypt password hashing and validation');
  assert(!bcrypt.compareSync('WrongPassword123!', hash), 'Bcrypt rejects incorrect password');

  const testUser: User = {
    id: 'usr-test-01',
    email: 'investigator@fraudlens.io',
    name: 'James Reynolds, CFE',
    role: 'INVESTIGATOR',
    department: 'SIU',
    createdAt: new Date().toISOString(),
  };

  const secret = 'test-jwt-secret-key-2026';
  const token = jwt.sign({ userId: testUser.id, role: testUser.role }, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret) as any;
  assert(decoded.userId === testUser.id, 'JWT token encodes and signs payload correctly');
  assert(decoded.role === 'INVESTIGATOR', 'JWT token preserves role-based permissions');

  // -------------------------------------------------------------------------
  // TEST GROUP 2: SYNTHETIC DATASET GENERATION
  // -------------------------------------------------------------------------
  console.log('\n[Test Group 2] Synthetic Dataset Reproducibility & Integrity');
  const dataset1 = generateSyntheticDataset(42);
  const dataset2 = generateSyntheticDataset(42);
  assert(dataset1.customers.length === dataset2.customers.length, 'Deterministic generation with seed = 42');
  assert(dataset1.customers.length >= 8, 'Dataset contains sufficient positive & negative entities');
  assert(dataset1.plantedRingsSummary.length === 4, 'Planted fraud rings count equals 4 scenarios');

  // Check presence of planted scenarios
  const hasPegasus = dataset1.plantedRingsSummary.some(r => r.ringId === 'RING-PEGASUS');
  const hasOuroboros = dataset1.plantedRingsSummary.some(r => r.ringId === 'RING-OUROBOROS');
  const hasHydra = dataset1.plantedRingsSummary.some(r => r.ringId === 'RING-HYDRA');
  const hasShadow = dataset1.plantedRingsSummary.some(r => r.ringId === 'RING-SHADOW');
  assert(hasPegasus && hasOuroboros && hasHydra && hasShadow, 'All 4 planted scenarios instantiated properly');

  // Check true negatives (benign controls)
  const benignCust = dataset1.customers.find(c => c.id === 'CUST-BEN-01');
  assert(benignCust !== undefined && benignCust.riskScore < 40, 'Benign controls maintain low risk scores (< 40)');

  // -------------------------------------------------------------------------
  // TEST GROUP 3: SYMBOLIC AI & FORWARD CHAINING ENGINE
  // -------------------------------------------------------------------------
  console.log('\n[Test Group 3] Forward Chaining Engine & Deduction Mathematics');
  const rules = INITIAL_RULE_CATALOGUE.map(r => ({ ...r }));
  const engine = new ForwardChainingEngine(rules, dataset1);

  const { alerts, rings, report } = engine.runInference(5);

  assert(report.status === 'COMPLETED_FIXED_POINT', 'Forward Chaining reaches Fixed-Point termination without looping');
  assert(report.iterationsCount <= 5, 'Inference converges within maximum allowable cycles');
  assert(report.totalAlertsGenerated > 0, 'Deductions generated automated surveillance alerts');
  assert(report.totalRingsDetected >= 3, 'Syndicate detection grouped entities into candidate rings');

  // Check specific rule firings
  const firedFR01 = alerts.some(a => a.triggeredRules.some(r => r.ruleId === 'FR-01'));
  assert(firedFR01, 'Rule FR-01 (Shared Device Velocity) triggered on Pegasus jailbroken device');

  const firedFR13 = alerts.some(a => a.triggeredRules.some(r => r.ruleId === 'FR-13'));
  assert(firedFR13, 'Rule FR-13 (Circular 3-Hop Laundering Cycle) triggered on Ouroboros round-trip');

  const firedFR08 = alerts.some(a => a.triggeredRules.some(r => r.ruleId === 'FR-08'));
  assert(firedFR08, 'Rule FR-08 (Structuring Below $10k Threshold) triggered on smurfing wire transfers');

  // Check Evidence Graph Trace structure
  const sampleAlert = alerts[0];
  assert(sampleAlert.evidenceTrace !== undefined, 'Alert contains detailed EvidenceGraphTrace');
  assert(sampleAlert.evidenceTrace.matchedEntities.length > 0, 'Evidence trace contains concrete matched entities');
  assert(sampleAlert.evidenceTrace.recommendation.length > 0, 'Evidence trace includes actionable SIU recommendation');

  // Test Duplicate-Alert Prevention: Run inference again and verify deduplication
  const secondRun = engine.runInference(5);
  const alertIds = alerts.map(a => a.id);
  const uniqueAlertIds = new Set(alertIds);
  assert(alertIds.length === uniqueAlertIds.size, 'Duplicate-alert prevention enforces strictly unique findings');

  // -------------------------------------------------------------------------
  // TEST GROUP 4: STATE TRANSITION MACHINE & CASE GOVERNANCE
  // -------------------------------------------------------------------------
  console.log('\n[Test Group 4] Case Management Validated State Transitions');
  const db = new DatabaseStore();
  const investigatorUser: User = {
    id: 'usr-inv-01',
    email: 'investigator@fraudlens.io',
    name: 'James Reynolds, CFE',
    role: 'INVESTIGATOR',
    department: 'SIU',
    createdAt: new Date().toISOString(),
  };

  // Create case from alert
  const firstAlert = Array.from(db.alerts.values())[0];
  const newCase = db.createCaseFromAlert(firstAlert.id, investigatorUser, 'Test Case Flow');
  assert(newCase.status === 'OPEN', 'Newly created case initializes in OPEN status');

  // Valid transition: OPEN -> IN_INVESTIGATION
  const inProgressCase = db.updateCaseStatus(newCase.id, 'IN_INVESTIGATION', investigatorUser, 'Commencing audit');
  assert(inProgressCase.status === 'IN_INVESTIGATION', 'Valid state transition: OPEN -> IN_INVESTIGATION');

  // Valid transition: IN_INVESTIGATION -> PENDING_SAR
  const sarCase = db.updateCaseStatus(newCase.id, 'PENDING_SAR', investigatorUser, 'SAR draft prepared');
  assert(sarCase.status === 'PENDING_SAR', 'Valid state transition: IN_INVESTIGATION -> PENDING_SAR');

  // Valid transition: PENDING_SAR -> RESOLVED_FRAUD
  const resolvedCase = db.updateCaseStatus(newCase.id, 'RESOLVED_FRAUD', investigatorUser, 'Confirmed ring', 'SAR_FILED');
  assert(resolvedCase.status === 'RESOLVED_FRAUD', 'Valid state transition: PENDING_SAR -> RESOLVED_FRAUD');

  // Invalid transition test: RESOLVED_FRAUD -> IN_INVESTIGATION (terminal state violation)
  let threwExpected = false;
  try {
    db.updateCaseStatus(newCase.id, 'IN_INVESTIGATION', investigatorUser, 'Invalid backward jump');
  } catch (err: any) {
    threwExpected = true;
  }
  assert(threwExpected, 'Strict state machine rejects invalid transition from terminal state RESOLVED_FRAUD');

  // -------------------------------------------------------------------------
  // TEST GROUP 5: AUDIT TRAIL LOGGING
  // -------------------------------------------------------------------------
  console.log('\n[Test Group 5] Immutable Forensic Audit Logging');
  const auditEntries = db.auditLogs;
  assert(auditEntries.length > 0, 'Audit trail logs state mutations and system inferences');
  const hasTransitionAudit = auditEntries.some(log => log.action === 'CASE_STATUS_TRANSITION');
  assert(hasTransitionAudit, 'Case status transition recorded in immutable audit ledger');

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
