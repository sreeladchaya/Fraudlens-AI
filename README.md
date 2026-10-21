# FraudLens — Explainable Fraud Ring Detection System
**Foundations of Artificial Intelligence (Symbolic AI, Knowledge Graphs, & Rule-Based Reasoning)**

FraudLens is an enterprise financial crime surveillance platform designed to identify coordinated fraud rings through knowledge graph pattern matching and symbolic AI forward-chaining deduction.

---

## 🌟 Key Features

1. **Symbolic AI Forward-Chaining Inference Engine**:
   - Working Fact Base (Working Memory) populated from multi-entity financial graph ontology.
   - Fixed-point bounded inference cycle with deduplication and cycle prevention.
   - Comprehensive catalogue of **27 Production Detection Rules** covering:
     - Shared Infrastructure & Synthetic Identities (`FR-01` to `FR-06`)
     - Rapid & Structured Velocity / Smurfing (`FR-07` to `FR-12`)
     - Knowledge Graph Topology & Ring Cycles (`FR-13` to `FR-18`)
     - Merchant & POS Collusion (`FR-19` to `FR-22`)
     - Account Takeover & Behavioral Drift (`FR-23` to `FR-27`)
   - Transparent, non-blackbox **Evidence Graph Traces** explaining why each finding was derived.

2. **Interactive Cytoscape.js Knowledge Graph Explorer**:
   - Multi-hop neighbor expansion and traversal.
   - Force-directed (COSE), Concentric, Breadth-First, and Circle layouts.
   - Entity type filtering (Customer, Account, Device, IP, Merchant, Transaction).
   - Side drawer with full ontology attributes and risk analysis.

3. **Coordinated Fraud Ring Explorer**:
   - Automated detection of candidate syndicates:
     - **The Pegasus Ring**: 4 Synthetic identities sharing 1 jailbroken iPhone & datacenter IP performing structured smurfing below $10,000 BSA threshold.
     - **The Ouroboros Ring**: 3-hop directed circular money round-tripping cycle ($A \to B \to C \to A$) within 36 hours.
     - **The Hydra Merchant Ring**: Collusive merchant receiving rapid micro-authorizations from multi-instance emulator testing stolen cards.
     - **The Shadow Takeover Ring**: Impossible geolocation transit jump from London to Lagos VPN followed by immediate beneficiary drain.

4. **Forensic Case Management & SIU Workflows**:
   - Validated state machine: `OPEN` ➔ `IN_INVESTIGATION` ➔ `PENDING_SAR` ➔ `RESOLVED_FRAUD` / `RESOLVED_FALSE_POSITIVE`.
   - Investigation notes journal with author role badges and timestamped chain-of-custody.
   - Direct promotion from Alerts and Rings into Case Dossiers.

5. **Regulatory Compliance & Reports**:
   - Summary statistics and ring metrics.
   - CSV exports for alerts and rules.
   - Print-ready FinCEN SAR confidential dossier formatting.

6. **Academic FOAI Viva Defense Companion**:
   - Interactive viva preparation module with mathematical proofs, symbolic reasoning formulas, and examiner question & answer defenses.

---

## 🚀 Quick Start & Local Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Full-Stack Application (Port 3000)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Demo Credentials
| Role | Email | Password | Persona |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@fraudlens.io` | `FraudLens2026!` | Dr. Sarah Al-Mansoor (AI Governance) |
| **Investigator** | `investigator@fraudlens.io` | `FraudLens2026!` | James Reynolds, CFE (SIU Lead) |
| **Analyst** | `analyst@fraudlens.io` | `FraudLens2026!` | Maya Lin (AML Surveillance) |
| **Auditor** | `auditor@fraudlens.io` | `FraudLens2026!` | Edward Hayes (Compliance) |

*(One-click demo buttons are available on the login page for instant authentication).*

---

## 📚 Viva Defense Reference

- **Why Forward Chaining?** Continuous transaction surveillance is data-driven; as new facts arrive from graph events, forward chaining derives all conclusions without needing a pre-specified target hypothesis.
- **Why Symbolic AI instead of Neural Networks?** Regulators under FinCEN and GDPR Art. 22 prohibit blackbox account freezes without auditable proof. Symbolic AI provides an invariant chain of evidence.
- **Termination Guarantee**: Monotonic Working Memory accumulation and fact deduplication ensure execution reaches a Fixed Point in bounded $O(R \cdot |WM|^k)$ time.
