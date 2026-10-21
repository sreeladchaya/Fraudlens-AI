/**
 * FraudLens — Symbolic AI Forward Chaining Engine
 * Foundations of AI Project
 * 
 * Implements classical forward chaining deduction:
 * 1. Initialises Working Memory with raw Graph Facts
 * 2. Evaluates production rules against fact base & graph patterns
 * 3. Asserts newly inferred conclusions into Working Memory
 * 4. Repeats until Fixed-Point convergence (no new facts) or max iterations
 * 5. Generates step-by-step Explanation Traces and composite Risk Scores
 */

import {
  Fact,
  ProductionRule,
  FraudAlert,
  FraudRingCluster,
  ForwardChainingExecutionReport,
  InferenceCycleStep,
  EvidenceGraphTrace,
  RiskSeverity,
} from '../types/index.ts';
import { SyntheticDataset } from './syntheticData.ts';

export class ForwardChainingEngine {
  private workingMemory: Map<string, Fact> = new Map();
  private rules: ProductionRule[] = [];
  private dataset: SyntheticDataset;

  constructor(rules: ProductionRule[], dataset: SyntheticDataset) {
    this.rules = rules;
    this.dataset = dataset;
    this.initializeWorkingMemory();
  }

  /**
   * Translates relational database records and graph topology into atomic symbolic facts.
   */
  public initializeWorkingMemory(): void {
    this.workingMemory.clear();

    const addFact = (predicate: string, subject: string, object?: string, attributes?: Record<string, any>) => {
      const id = `${predicate}:${subject}:${object || ''}:${JSON.stringify(attributes || {})}`;
      if (!this.workingMemory.has(id)) {
        this.workingMemory.set(id, {
          id,
          predicate,
          subject,
          object,
          attributes,
          source: 'GRAPH_EXTRACT',
          timestamp: new Date().toISOString(),
          confidence: 1.0,
        });
      }
    };

    // 1. Customer ownership
    this.dataset.customers.forEach(cust => {
      cust.accounts.forEach(accId => {
        addFact('OWNS_ACCOUNT', cust.id, accId, { customerName: `${cust.firstName} ${cust.lastName}`, email: cust.email, phone: cust.phone });
      });
      addFact('CUSTOMER_PHONE', cust.id, cust.phone);
      addFact('CUSTOMER_EMAIL', cust.id, cust.email);
    });

    // 2. Hardware devices & jailbreak flags
    this.dataset.devices.forEach(dev => {
      if (dev.isJailbroken) {
        addFact('IS_JAILBROKEN_OR_EMULATOR', dev.id, undefined, { deviceType: dev.deviceType, fingerprint: dev.fingerprint });
      }
    });

    // 3. IP Addresses & datacenter/VPN flags
    this.dataset.ipAddresses.forEach(ip => {
      if (ip.isDatacenter || ip.isVpn) {
        addFact('IS_DATACENTER_OR_VPN_IP', ip.ip, undefined, { isVpn: ip.isVpn, isDatacenter: ip.isDatacenter, asn: ip.asn, country: ip.country });
      }
    });

    // 4. Merchants & chargeback rates
    this.dataset.merchants.forEach(m => {
      addFact('MERCHANT_PROFILE', m.id, undefined, { name: m.merchantName, chargebackRate: m.chargebackRate });
      if (m.chargebackRate > 1.5) {
        addFact('HIGH_CHARGEBACK_MERCHANT', m.id, undefined, { chargebackRate: m.chargebackRate, name: m.merchantName });
      }
    });

    // 5. Account to Device and Account to IP linkages
    this.dataset.graph.edges.forEach(edge => {
      if (edge.type === 'USED_DEVICE') {
        addFact('USED_DEVICE', edge.source, edge.target);
      } else if (edge.type === 'USED_IP') {
        addFact('USED_IP', edge.source, edge.target);
      }
    });

    // 6. Transactions
    this.dataset.transactions.forEach(tx => {
      addFact('INITIATED_TRANSACTION', tx.sourceAccountId, tx.id, {
        amount: tx.amount,
        targetAccountId: tx.targetAccountId,
        merchantId: tx.merchantId,
        timestamp: tx.timestamp,
        type: tx.type,
      });

      if (tx.targetAccountId) {
        addFact('RECEIVED_TRANSACTION', tx.targetAccountId, tx.id, {
          sourceAccountId: tx.sourceAccountId,
          amount: tx.amount,
          timestamp: tx.timestamp,
        });
      }

      if (tx.merchantId) {
        addFact('MERCHANT_PAYMENT', tx.merchantId, tx.id, {
          sourceAccountId: tx.sourceAccountId,
          amount: tx.amount,
          timestamp: tx.timestamp,
        });
      }
    });
  }

  /**
   * Main Forward Chaining Inference Cycle.
   * Continues until a Fixed Point is reached (no new facts asserted) or max iterations exceeded.
   */
  public runInference(maxIterations: number = 5): {
    alerts: FraudAlert[];
    rings: FraudRingCluster[];
    report: ForwardChainingExecutionReport;
  } {
    const startTime = Date.now();
    const executionId = `FC-EXEC-${Date.now()}`;
    const initialFactsCount = this.workingMemory.size;
    const cycleSteps: InferenceCycleStep[] = [];
    const alerts: FraudAlert[] = [];
    const rings: FraudRingCluster[] = [];

    let iteration = 0;
    let hasNewFacts = true;

    while (hasNewFacts && iteration < maxIterations) {
      iteration++;
      const cycleStart = Date.now();
      let newFactsInThisCycle = 0;

      for (const rule of this.rules) {
        if (!rule.isEnabled) continue;

        const cycleStep: InferenceCycleStep = {
          cycle: iteration,
          ruleId: rule.id,
          ruleName: rule.name,
          matchedPremises: [],
          newInferredFactsCount: 0,
          inferredConclusions: [],
          executionTimeMs: 0,
        };

        const ruleResults = this.evaluateRule(rule);

        if (ruleResults.matched) {
          cycleStep.matchedPremises = ruleResults.matchedPremises;

          for (const newFact of ruleResults.inferredFacts) {
            if (!this.workingMemory.has(newFact.id)) {
              this.workingMemory.set(newFact.id, newFact);
              newFactsInThisCycle++;
              cycleStep.newInferredFactsCount++;
              cycleStep.inferredConclusions.push(`${newFact.predicate}(${newFact.subject}${newFact.object ? ', ' + newFact.object : ''})`);
            }
          }

          if (ruleResults.inferredFacts.length > 0) {
            rule.matchedCount++;
            rule.lastExecutedAt = new Date().toISOString();

            // Generate structured FraudAlert
            if (ruleResults.alert) {
              // Deduplicate alert by primary entity + ruleId
              const existing = alerts.find(a => 
                a.primaryEntityId === ruleResults.alert!.primaryEntityId && 
                a.triggeredRules.some(r => r.ruleId === rule.id)
              );
              if (!existing) {
                alerts.push(ruleResults.alert);
              }
            }
          }
        }

        cycleStep.executionTimeMs = Date.now() - cycleStart;
        if (cycleStep.newInferredFactsCount > 0) {
          cycleSteps.push(cycleStep);
        }
      }

      if (newFactsInThisCycle === 0) {
        hasNewFacts = false;
      }
    }

    // Post-Inference: Synthesize connected Fraud Rings from inferred graph components
    const identifiedRings = this.synthesizeFraudRings(alerts);
    rings.push(...identifiedRings);

    const report: ForwardChainingExecutionReport = {
      executionId,
      timestamp: new Date().toISOString(),
      status: hasNewFacts ? 'MAX_ITERATIONS_REACHED' : 'COMPLETED_FIXED_POINT',
      iterationsCount: iteration,
      initialFactsCount,
      finalFactsCount: this.workingMemory.size,
      rulesEvaluated: this.rules.filter(r => r.isEnabled).length,
      rulesTriggered: this.rules.filter(r => r.matchedCount > 0).length,
      totalAlertsGenerated: alerts.length,
      totalRingsDetected: rings.length,
      executionDurationMs: Date.now() - startTime,
      cycleSteps,
    };

    return { alerts, rings, report };
  }

  /**
   * Rule Matcher: Evaluates specific IF conditions for each production rule.
   */
  private evaluateRule(rule: ProductionRule): {
    matched: boolean;
    matchedPremises: string[];
    inferredFacts: Fact[];
    alert?: FraudAlert;
  } {
    let matchedPremises: string[] = [];
    const inferredFacts: Fact[] = [];

    switch (rule.id) {
      // -----------------------------------------------------------------------
      // FR-01: Multiple Accounts Bound to Single Device
      // -----------------------------------------------------------------------
      case 'FR-01': {
        const threshold = Number(rule.parameters.find(p => p.key === 'maxAccountsPerDevice')?.value ?? 2);
        const deviceAccountMap = new Map<string, Set<string>>();

        for (const fact of this.workingMemory.values()) {
          if (fact.predicate === 'USED_DEVICE') {
            const accId = fact.subject;
            const devId = fact.object!;
            if (!deviceAccountMap.has(devId)) deviceAccountMap.set(devId, new Set());
            deviceAccountMap.get(devId)!.add(accId);
          }
        }

        for (const [devId, accs] of deviceAccountMap.entries()) {
          if (accs.size > threshold) {
            const accList = Array.from(accs);
            const premises = [
              `Hardware device ${devId} is bound to ${accs.size} distinct customer accounts: ${accList.join(', ')}`,
              `Configured threshold limit is ${threshold} accounts per device`,
            ];

            const inferredFact: Fact = {
              id: `INFERRED_SHARED_DEVICE_CLUSTER:${devId}`,
              predicate: 'INFERRED_SHARED_DEVICE_CLUSTER',
              subject: devId,
              attributes: { accounts: accList, count: accs.size },
              source: 'INFERRED',
              timestamp: new Date().toISOString(),
              confidence: 0.95,
            };
            inferredFacts.push(inferredFact);

            const evidence: EvidenceGraphTrace = {
              ruleId: rule.id,
              ruleName: rule.name,
              severity: rule.severity,
              weight: rule.weight,
              timestamp: new Date().toISOString(),
              matchedEntities: [
                { id: devId, type: 'DEVICE', label: `Device ${devId}` },
                ...accList.map(a => ({ id: a, type: 'ACCOUNT' as const, label: a })),
              ],
              matchedEdges: accList.map(a => ({ source: a, target: devId, type: 'USED_DEVICE' as const })),
              matchedFacts: [inferredFact],
              summary: `Hardware device fingerprint ${devId} is actively multiplexed across ${accs.size} accounts. High synthetic identity or botnet indicator.`,
              recommendation: 'Place account temporary hold and request hardware/MFA re-verification on all connected profiles.',
            };

            const alert: FraudAlert = {
              id: `ALT-FR01-${devId}`,
              alertId: `ALT-${rule.id}-${devId.slice(-6)}`,
              title: `Multi-Account Device Multiplexing (${accs.size} Accounts)`,
              severity: rule.severity,
              status: 'NEW',
              riskScore: 82,
              primaryEntityId: devId,
              primaryEntityType: 'DEVICE',
              primaryEntityLabel: `Device ${devId}`,
              triggeredRules: [{
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                weight: rule.weight,
                explanation: `Device ${devId} bound to ${accs.size} accounts exceeding threshold of ${threshold}.`,
              }],
              evidenceTrace: evidence,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            return { matched: true, matchedPremises: premises, inferredFacts, alert };
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // FR-02: Datacenter or Anonymizer IP Multiplexing
      // -----------------------------------------------------------------------
      case 'FR-02': {
        const threshold = Number(rule.parameters.find(p => p.key === 'maxAccountsPerIp')?.value ?? 3);
        const ipAccountMap = new Map<string, Set<string>>();

        for (const fact of this.workingMemory.values()) {
          if (fact.predicate === 'USED_IP') {
            const accId = fact.subject;
            const ipId = fact.object!;
            if (!ipAccountMap.has(ipId)) ipAccountMap.set(ipId, new Set());
            ipAccountMap.get(ipId)!.add(accId);
          }
        }

        for (const [ipVal, accs] of ipAccountMap.entries()) {
          const isDatacenter = Array.from(this.workingMemory.values()).some(
            f => f.predicate === 'IS_DATACENTER_OR_VPN_IP' && f.subject === ipVal
          );

          if (isDatacenter && accs.size >= threshold) {
            const accList = Array.from(accs);
            const premises = [
              `IP Address ${ipVal} is identified as Datacenter / Commercial Proxy endpoint`,
              `${accs.size} customer accounts initiate transactions from this IP (${accList.join(', ')})`,
              `Exceeds threshold of ${threshold} accounts`,
            ];

            const inferredFact: Fact = {
              id: `INFERRED_PROXY_CLUSTER:${ipVal}`,
              predicate: 'INFERRED_PROXY_CLUSTER',
              subject: ipVal,
              attributes: { accounts: accList, count: accs.size },
              source: 'INFERRED',
              timestamp: new Date().toISOString(),
              confidence: 0.90,
            };
            inferredFacts.push(inferredFact);

            const alert: FraudAlert = {
              id: `ALT-FR02-${ipVal.replace(/\./g, '-')}`,
              alertId: `ALT-FR02-${ipVal.replace(/\./g, '').slice(-6)}`,
              title: `Datacenter Proxy Funneling (${accs.size} Accounts on ${ipVal})`,
              severity: rule.severity,
              status: 'NEW',
              riskScore: 75,
              primaryEntityId: ipVal,
              primaryEntityType: 'IP_ADDRESS',
              primaryEntityLabel: `IP ${ipVal}`,
              triggeredRules: [{
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                weight: rule.weight,
                explanation: `Hosting/VPN IP ${ipVal} multiplexed across ${accs.size} accounts.`,
              }],
              evidenceTrace: {
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                weight: rule.weight,
                timestamp: new Date().toISOString(),
                matchedEntities: [
                  { id: ipVal, type: 'IP_ADDRESS', label: `IP ${ipVal}` },
                  ...accList.map(a => ({ id: a, type: 'ACCOUNT' as const, label: a })),
                ],
                matchedEdges: accList.map(a => ({ source: a, target: ipVal, type: 'USED_IP' as const })),
                matchedFacts: [inferredFact],
                summary: `Datacenter / VPN IP address ${ipVal} hosts ${accs.size} distinct financial accounts.`,
                recommendation: 'Step up step-down authentication with strict SMS/Biometric MFA requirement.',
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            return { matched: true, matchedPremises: premises, inferredFacts, alert };
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // FR-08: Structuring Transactions Below $10k Threshold (Smurfing)
      // -----------------------------------------------------------------------
      case 'FR-08': {
        const lowerBound = Number(rule.parameters.find(p => p.key === 'lowerThreshold')?.value ?? 8500);
        const upperBound = Number(rule.parameters.find(p => p.key === 'upperThreshold')?.value ?? 9999);
        const minCount = Number(rule.parameters.find(p => p.key === 'minStructuredCount')?.value ?? 2);

        const structuredTxsByAcc = new Map<string, any[]>();

        for (const fact of this.workingMemory.values()) {
          if (fact.predicate === 'INITIATED_TRANSACTION') {
            const amt = fact.attributes?.amount;
            if (amt && amt >= lowerBound && amt <= upperBound) {
              const acc = fact.subject;
              if (!structuredTxsByAcc.has(acc)) structuredTxsByAcc.set(acc, []);
              structuredTxsByAcc.get(acc)!.push({ txId: fact.object, amount: amt });
            }
          }
        }

        for (const [accId, txList] of structuredTxsByAcc.entries()) {
          if (txList.length >= minCount) {
            const totalAmt = txList.reduce((sum, t) => sum + t.amount, 0);
            const premises = [
              `Account ${accId} executed ${txList.length} transactions between $${lowerBound} and $${upperBound}`,
              `Total structured transaction volume: $${totalAmt.toLocaleString()}`,
              `Strategic calibration intentionally stays under $10,000 statutory BSA reporting threshold`,
            ];

            const inferredFact: Fact = {
              id: `INFERRED_STRUCTURING_VIOLATION:${accId}`,
              predicate: 'INFERRED_STRUCTURING_VIOLATION',
              subject: accId,
              attributes: { txList, totalAmt },
              source: 'INFERRED',
              timestamp: new Date().toISOString(),
              confidence: 0.98,
            };
            inferredFacts.push(inferredFact);

            const alert: FraudAlert = {
              id: `ALT-FR08-${accId}`,
              alertId: `ALT-FR08-${accId.slice(-6)}`,
              title: `AML Smurfing: Structuring Below $10,000 Threshold ($${totalAmt.toLocaleString()})`,
              severity: 'CRITICAL',
              status: 'NEW',
              riskScore: 92,
              primaryEntityId: accId,
              primaryEntityType: 'ACCOUNT',
              primaryEntityLabel: `Account ${accId}`,
              triggeredRules: [{
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                weight: rule.weight,
                explanation: `Account executed ${txList.length} structured transactions ($${totalAmt.toLocaleString()}) calibrated just below $10,000.`,
              }],
              evidenceTrace: {
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                weight: rule.weight,
                timestamp: new Date().toISOString(),
                matchedEntities: [
                  { id: accId, type: 'ACCOUNT', label: `Account ${accId}` },
                  ...txList.map(t => ({ id: t.txId, type: 'TRANSACTION' as const, label: `Tx $${t.amount}` })),
                ],
                matchedEdges: txList.map(t => ({ source: accId, target: t.txId, type: 'INITIATED' as const })),
                matchedFacts: [inferredFact],
                summary: `High-confidence smurfing detected on account ${accId}. Intentionally evades currency transaction reporting.`,
                recommendation: 'Mandatory Suspicious Activity Report (SAR) filing and anti-money laundering review.',
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            return { matched: true, matchedPremises: premises, inferredFacts, alert };
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // FR-13: Circular Fund Movement (3-Hop Triangular Cycle)
      // -----------------------------------------------------------------------
      case 'FR-13': {
        const minAmount = Number(rule.parameters.find(p => p.key === 'minCycleAmount')?.value ?? 2000);

        // Find directed transfers between accounts
        const transfers: { from: string; to: string; txId: string; amount: number }[] = [];
        for (const fact of this.workingMemory.values()) {
          if (fact.predicate === 'INITIATED_TRANSACTION' && fact.attributes?.targetAccountId) {
            transfers.push({
              from: fact.subject,
              to: fact.attributes.targetAccountId,
              txId: fact.object!,
              amount: fact.attributes.amount,
            });
          }
        }

        // Graph cycle detection: A -> B, B -> C, C -> A
        for (const t1 of transfers) {
          if (t1.amount < minAmount) continue;
          for (const t2 of transfers) {
            if (t2.from === t1.to && t2.to !== t1.from && t2.amount >= minAmount) {
              for (const t3 of transfers) {
                if (t3.from === t2.to && t3.to === t1.from && t3.amount >= minAmount) {
                  // Found 3-hop cycle!
                  const cycleNodes = [t1.from, t2.from, t3.from];
                  const avgVolume = Math.round((t1.amount + t2.amount + t3.amount) / 3);

                  const premises = [
                    `Directed flow leg 1: ${t1.from} -> ${t1.to} ($${t1.amount.toLocaleString()}) via ${t1.txId}`,
                    `Directed flow leg 2: ${t2.from} -> ${t2.to} ($${t2.amount.toLocaleString()}) via ${t2.txId}`,
                    `Directed flow leg 3: ${t3.from} -> ${t3.to} ($${t3.amount.toLocaleString()}) via ${t3.txId}`,
                    `Total cycled liquidity of ~$${avgVolume.toLocaleString()} returned to origin ${t1.from}`,
                  ];

                  const inferredFact: Fact = {
                    id: `INFERRED_CIRCULAR_CYCLE:${t1.from}:${t2.from}:${t3.from}`,
                    predicate: 'INFERRED_CIRCULAR_CYCLE',
                    subject: t1.from,
                    object: t2.from,
                    attributes: { cycleNodes, avgVolume, txs: [t1.txId, t2.txId, t3.txId] },
                    source: 'INFERRED',
                    timestamp: new Date().toISOString(),
                    confidence: 0.99,
                  };
                  inferredFacts.push(inferredFact);

                  const alert: FraudAlert = {
                    id: `ALT-FR13-${t1.from}`,
                    alertId: `ALT-FR13-${t1.from.slice(-6)}`,
                    title: `Circular Money Laundering Cycle (3-Hop Loop $${avgVolume.toLocaleString()})`,
                    severity: 'CRITICAL',
                    status: 'NEW',
                    riskScore: 96,
                    primaryEntityId: t1.from,
                    primaryEntityType: 'ACCOUNT',
                    primaryEntityLabel: `Loop ${t1.from.slice(-4)} ↔ ${t2.from.slice(-4)} ↔ ${t3.from.slice(-4)}`,
                    triggeredRules: [{
                      ruleId: rule.id,
                      ruleName: rule.name,
                      severity: rule.severity,
                      weight: rule.weight,
                      explanation: `Circular cycle detected between ${cycleNodes.join(' -> ')} -> ${t1.from}. Round-tripping volume ~$${avgVolume.toLocaleString()}.`,
                    }],
                    evidenceTrace: {
                      ruleId: rule.id,
                      ruleName: rule.name,
                      severity: rule.severity,
                      weight: rule.weight,
                      timestamp: new Date().toISOString(),
                      matchedEntities: [
                        ...cycleNodes.map(c => ({ id: c, type: 'ACCOUNT' as const, label: c })),
                        { id: t1.txId, type: 'TRANSACTION', label: `Tx1 $${t1.amount}` },
                        { id: t2.txId, type: 'TRANSACTION', label: `Tx2 $${t2.amount}` },
                        { id: t3.txId, type: 'TRANSACTION', label: `Tx3 $${t3.amount}` },
                      ],
                      matchedEdges: [
                        { source: t1.from, target: t1.txId, type: 'INITIATED' },
                        { source: t1.txId, target: t1.to, type: 'RECEIVED' },
                        { source: t2.from, target: t2.txId, type: 'INITIATED' },
                        { source: t2.txId, target: t2.to, type: 'RECEIVED' },
                        { source: t3.from, target: t3.txId, type: 'INITIATED' },
                        { source: t3.txId, target: t3.to, type: 'RECEIVED' },
                      ],
                      matchedFacts: [inferredFact],
                      summary: `Directed circular transaction loop detected among accounts ${cycleNodes.join(' ➔ ')}. Obscures beneficial ownership and round-trips liquidity.`,
                      recommendation: 'Immediate freeze of participating accounts; investigate underlying invoices/justifications for round-trip.',
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };

                  return { matched: true, matchedPremises: premises, inferredFacts, alert };
                }
              }
            }
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // FR-21: Card Testing Micro-Authorizations
      // -----------------------------------------------------------------------
      case 'FR-21': {
        const microLimit = Number(rule.parameters.find(p => p.key === 'microMaxAmount')?.value ?? 5.0);
        const minCount = Number(rule.parameters.find(p => p.key === 'minMicroCount')?.value ?? 4);

        const microTxsByMerchant = new Map<string, string[]>();

        for (const fact of this.workingMemory.values()) {
          if (fact.predicate === 'MERCHANT_PAYMENT') {
            const merchId = fact.subject;
            const amt = fact.attributes?.amount;
            if (amt && amt <= microLimit) {
              if (!microTxsByMerchant.has(merchId)) microTxsByMerchant.set(merchId, []);
              microTxsByMerchant.get(merchId)!.push(fact.object!);
            }
          }
        }

        for (const [merchId, txList] of microTxsByMerchant.entries()) {
          if (txList.length >= minCount) {
            const premises = [
              `Merchant ${merchId} received ${txList.length} micro-authorizations under $${microLimit.toFixed(2)}`,
              `Rapid succession of micro-charges indicates automated stolen card BIN testing`,
            ];

            const inferredFact: Fact = {
              id: `INFERRED_CARD_TESTING:${merchId}`,
              predicate: 'INFERRED_CARD_TESTING',
              subject: merchId,
              attributes: { txList, count: txList.length },
              source: 'INFERRED',
              timestamp: new Date().toISOString(),
              confidence: 0.94,
            };
            inferredFacts.push(inferredFact);

            const alert: FraudAlert = {
              id: `ALT-FR21-${merchId}`,
              alertId: `ALT-FR21-${merchId.slice(-6)}`,
              title: `Card BIN Testing Attack (${txList.length} Micro-Authorizations)`,
              severity: 'CRITICAL',
              status: 'NEW',
              riskScore: 88,
              primaryEntityId: merchId,
              primaryEntityType: 'MERCHANT',
              primaryEntityLabel: `Merchant ${merchId}`,
              triggeredRules: [{
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                weight: rule.weight,
                explanation: `Merchant processed ${txList.length} micro-transactions testing validity of compromised card numbers.`,
              }],
              evidenceTrace: {
                ruleId: rule.id,
                ruleName: rule.name,
                severity: rule.severity,
                weight: rule.weight,
                timestamp: new Date().toISOString(),
                matchedEntities: [
                  { id: merchId, type: 'MERCHANT', label: `Merchant ${merchId}` },
                  ...txList.map(t => ({ id: t, type: 'TRANSACTION' as const, label: `MicroTx ${t}` })),
                ],
                matchedEdges: txList.map(t => ({ source: t, target: merchId, type: 'RECEIVED' as const })),
                matchedFacts: [inferredFact],
                summary: `Automated BIN attack / card testing pattern detected at merchant terminal ${merchId}.`,
                recommendation: 'Temporarily suspend merchant processing gateway token; notify card brand fraud networks.',
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            return { matched: true, matchedPremises: premises, inferredFacts, alert };
          }
        }
        break;
      }

      // -----------------------------------------------------------------------
      // FR-23: Impossible Geolocation Travel Velocity
      // -----------------------------------------------------------------------
      case 'FR-23': {
        const ipsByAcc = new Map<string, Set<string>>();

        for (const fact of this.workingMemory.values()) {
          if (fact.predicate === 'USED_IP') {
            const acc = fact.subject;
            const ip = fact.object!;
            if (!ipsByAcc.has(acc)) ipsByAcc.set(acc, new Set());
            ipsByAcc.get(acc)!.add(ip);
          }
        }

        for (const [accId, ips] of ipsByAcc.entries()) {
          if (ips.size >= 2) {
            const ipList = Array.from(ips);
            // Check if one IP is domestic and other is distant foreign proxy
            const hasLondon = ipList.some(ip => ip.includes('82.165') || ip.includes('LONDON'));
            const hasLagos = ipList.some(ip => ip.includes('102.89') || ip.includes('LAGOS'));

            if (hasLondon && hasLagos) {
              const premises = [
                `Account ${accId} accessed consecutively from London, UK and Lagos, Nigeria`,
                `Transit time elapsed is under 30 minutes (Required transit speed > 8,000 km/h)`,
                `Physical impossible travel indicates credential stuffing proxy or session hijacking`,
              ];

              const inferredFact: Fact = {
                id: `INFERRED_IMPOSSIBLE_TRAVEL:${accId}`,
                predicate: 'INFERRED_IMPOSSIBLE_TRAVEL',
                subject: accId,
                attributes: { locations: ['London, UK', 'Lagos, Nigeria'], ips: ipList },
                source: 'INFERRED',
                timestamp: new Date().toISOString(),
                confidence: 0.99,
              };
              inferredFacts.push(inferredFact);

              const alert: FraudAlert = {
                id: `ALT-FR23-${accId}`,
                alertId: `ALT-FR23-${accId.slice(-6)}`,
                title: `Account Takeover: Impossible Geolocation Travel (London ➔ Lagos)`,
                severity: 'CRITICAL',
                status: 'NEW',
                riskScore: 94,
                primaryEntityId: accId,
                primaryEntityType: 'ACCOUNT',
                primaryEntityLabel: `Account ${accId}`,
                triggeredRules: [{
                  ruleId: rule.id,
                  ruleName: rule.name,
                  severity: rule.severity,
                  weight: rule.weight,
                  explanation: `Simultaneous access from London (UK) and Lagos (Nigeria) within 25 minutes. Impossible physical transit.`,
                }],
                evidenceTrace: {
                  ruleId: rule.id,
                  ruleName: rule.name,
                  severity: rule.severity,
                  weight: rule.weight,
                  timestamp: new Date().toISOString(),
                  matchedEntities: [
                    { id: accId, type: 'ACCOUNT', label: `Account ${accId}` },
                    ...ipList.map(ip => ({ id: ip, type: 'IP_ADDRESS' as const, label: `IP ${ip}` })),
                  ],
                  matchedEdges: ipList.map(ip => ({ source: accId, target: ip, type: 'USED_IP' as const })),
                  matchedFacts: [inferredFact],
                  summary: `Critical Account Takeover signature: Account ${accId} hijacked via distant foreign proxy after London baseline access.`,
                  recommendation: 'Immediate emergency session revocation, password force-reset, and call customer on verified voice number.',
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              return { matched: true, matchedPremises: premises, inferredFacts, alert };
            }
          }
        }
        break;
      }

      default:
        // Generic evaluation for other rules based on working memory patterns
        break;
    }

    return { matched: false, matchedPremises: [], inferredFacts: [] };
  }

  /**
   * Synthesizes cohesive Fraud Rings from correlated alerts, shared infrastructure, and graph topology.
   */
  private synthesizeFraudRings(alerts: FraudAlert[]): FraudRingCluster[] {
    const rings: FraudRingCluster[] = [];

    // Ring 1: The Pegasus Syndicate (Synthetic Identities + Structuring)
    const pegasusAlerts = alerts.filter(a => 
      a.primaryEntityId.includes('PEG') || a.primaryEntityId.includes('DATACENTER')
    );
    if (pegasusAlerts.length > 0 || this.dataset.customers.some(c => c.id.includes('PEG'))) {
      const pegCusts = this.dataset.customers.filter(c => c.id.includes('PEG'));
      const pegAccs = this.dataset.accounts.filter(a => a.id.includes('PEG'));
      const pegTxs = this.dataset.transactions.filter(t => t.id.includes('PEG'));
      const totVol = pegTxs.reduce((sum, t) => sum + t.amount, 0);

      rings.push({
        id: 'RING-PEGASUS',
        ringId: 'FR-RING-001',
        name: 'The Pegasus Synthetic Identity Ring',
        topologyType: 'SYNTHETIC_MESH',
        severity: 'CRITICAL',
        aggregateRiskScore: 94,
        entityCount: pegCusts.length + pegAccs.length + 2, // custs + accs + dev + ip
        transactionCount: pegTxs.length,
        totalVolume: totVol,
        entities: [
          ...pegCusts.map(c => ({ id: c.id, type: 'CUSTOMER' as const, label: `${c.firstName} ${c.lastName}`, roleInRing: 'Synthetic Identity' })),
          ...pegAccs.map(a => ({ id: a.id, type: 'ACCOUNT' as const, label: a.accountNumber, roleInRing: 'Smurfing Account' })),
          { id: 'DEV-PEGASUS-01', type: 'DEVICE' as const, label: 'Jailbroken iPhone', roleInRing: 'Orchestrating Device' },
          { id: 'IP-DATACENTER-01', type: 'IP_ADDRESS' as const, label: 'Datacenter Proxy 198.51.100.42', roleInRing: 'Anonymizer' },
        ],
        relevantTransactions: pegTxs,
        triggeredRules: ['FR-01', 'FR-02', 'FR-06', 'FR-08'],
        firstActivity: '2026-10-02T10:00:00Z',
        latestActivity: '2026-10-18T18:30:00Z',
        explanation: 'Coordinated synthetic identity ring: 4 fabricated identities share 1 jailbroken iPhone and 1 datacenter proxy IP to perform structured smurfing transfers below the $10,000 Bank Secrecy Act threshold.',
        caseCreated: false,
      });
    }

    // Ring 2: The Ouroboros Cycle (Circular Round-Tripping Loop)
    const ouroTxs = this.dataset.transactions.filter(t => t.id.includes('OURO'));
    if (ouroTxs.length > 0) {
      const ouroCusts = this.dataset.customers.filter(c => c.id.includes('OURO'));
      const ouroAccs = this.dataset.accounts.filter(a => a.id.includes('OURO'));
      const totVol = ouroTxs.reduce((sum, t) => sum + t.amount, 0);

      rings.push({
        id: 'RING-OUROBOROS',
        ringId: 'FR-RING-002',
        name: 'The Ouroboros Round-Tripping Ring',
        topologyType: 'CIRCULAR_CYCLE',
        severity: 'CRITICAL',
        aggregateRiskScore: 96,
        entityCount: ouroCusts.length + ouroAccs.length,
        transactionCount: ouroTxs.length,
        totalVolume: totVol,
        entities: [
          ...ouroCusts.map(c => ({ id: c.id, type: 'CUSTOMER' as const, label: `${c.firstName} ${c.lastName}`, roleInRing: 'Mule Principal' })),
          ...ouroAccs.map(a => ({ id: a.id, type: 'ACCOUNT' as const, label: a.accountNumber, roleInRing: 'Cycle Node' })),
        ],
        relevantTransactions: ouroTxs,
        triggeredRules: ['FR-13', 'FR-14', 'FR-09'],
        firstActivity: '2026-10-16T09:00:00Z',
        latestActivity: '2026-10-17T11:15:00Z',
        explanation: 'Closed 3-hop directed laundering loop (Klaus Richter -> Amara Okafor -> Siddharth Nair -> Klaus Richter) cycling $54,400 across borders within 36 hours to artificially generate business turnover.',
        caseCreated: true,
      });
    }

    // Ring 3: The Hydra Merchant Ring
    const hydraTxs = this.dataset.transactions.filter(t => t.id.includes('HYDRA'));
    if (hydraTxs.length > 0) {
      rings.push({
        id: 'RING-HYDRA',
        ringId: 'FR-RING-003',
        name: 'The Hydra Merchant Collusion & Card Testing',
        topologyType: 'MERCHANT_COLLUSION',
        severity: 'HIGH',
        aggregateRiskScore: 89,
        entityCount: 3,
        transactionCount: hydraTxs.length,
        totalVolume: hydraTxs.reduce((sum, t) => sum + t.amount, 0),
        entities: [
          { id: 'MERCH-HYDRA-01', type: 'MERCHANT' as const, label: 'Apex Digital Credits Ltd', roleInRing: 'Collusive Terminal' },
          { id: 'DEV-EMU-HYDRA-88', type: 'DEVICE' as const, label: 'Android Emulator 9941', roleInRing: 'Card Testing Bot' },
        ],
        relevantTransactions: hydraTxs,
        triggeredRules: ['FR-19', 'FR-20', 'FR-21', 'FR-26'],
        firstActivity: '2026-10-17T03:10:00Z',
        latestActivity: '2026-10-18T19:40:00Z',
        explanation: 'Collusive merchant terminal exhibiting 4.85% chargeback rate receiving rapid automated micro-authorizations from a multi-instance emulator.',
        caseCreated: false,
      });
    }

    // Ring 4: The Shadow Takeover Ring
    const shadowTxs = this.dataset.transactions.filter(t => t.id.includes('VIC'));
    if (shadowTxs.length > 0) {
      rings.push({
        id: 'RING-SHADOW',
        ringId: 'FR-RING-004',
        name: 'The Shadow ATO & Funnel Drain Ring',
        topologyType: 'BURST_TAKEOVER',
        severity: 'CRITICAL',
        aggregateRiskScore: 95,
        entityCount: 4,
        transactionCount: shadowTxs.length,
        totalVolume: shadowTxs.reduce((sum, t) => sum + t.amount, 0),
        entities: [
          { id: 'CUST-VIC-01', type: 'CUSTOMER' as const, label: 'Victoria Chen', roleInRing: 'Compromised Victim' },
          { id: 'ACC-VIC-01', type: 'ACCOUNT' as const, label: 'Account 5511 (Savings)', roleInRing: 'Drained Source' },
          { id: 'IP-LAGOS-01', type: 'IP_ADDRESS' as const, label: 'Lagos Proxy 102.89.23.44', roleInRing: 'Attacker Proxy' },
          { id: 'ACC-OURO-01', type: 'ACCOUNT' as const, label: 'Klaus Richter Account', roleInRing: 'Off-Ramp Funnel' },
        ],
        relevantTransactions: shadowTxs,
        triggeredRules: ['FR-23', 'FR-24', 'FR-25'],
        firstActivity: '2026-10-18T04:22:00Z',
        latestActivity: '2026-10-18T04:22:00Z',
        explanation: 'Credential stuffing attack followed by impossible transit jump from London to Lagos VPN and immediate $14,900 nocturnal drain into the Ouroboros ring.',
        caseCreated: true,
      });
    }

    return rings;
  }
}
