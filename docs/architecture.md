# FraudLens — Architectural Specification & Foundations of AI Guide

## 1. System Overview
**FraudLens** is an explainable fraud ring surveillance platform built on **Symbolic Artificial Intelligence**, **Forward Chaining Inference**, and **Knowledge Graph Pattern Matching**.

Unlike black-box neural networks that predict uninterpretable risk scores, FraudLens produces mathematically sound, deterministic, and auditable **Explanation Traces** connecting base topological facts to legal conclusions. This compliance property satisfies statutory requirements under FinCEN Bank Secrecy Act (BSA), USA PATRIOT Act Section 314(b), and European Union GDPR Article 22.

---

## 2. Relational Schema (PostgreSQL / Prisma ORM)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  name         String
  passwordHash String
  role         UserRole      @default(ANALYST)
  department   String
  createdAt    DateTime      @default(now())
  cases        InvestigationCase[]
}

enum UserRole {
  ADMIN
  INVESTIGATOR
  ANALYST
  AUDITOR
}

model Customer {
  id          String        @id @default(uuid())
  customerId  String        @unique
  firstName   String
  lastName    String
  email       String
  phone       String
  ssnMasked   String
  riskScore   Int           @default(0)
  status      CustomerStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
  accounts    Account[]
}

enum CustomerStatus {
  ACTIVE
  FLAGGED
  SUSPENDED
}

model Account {
  id            String        @id @default(uuid())
  accountNumber String        @unique
  customerId    String
  customer      Customer      @relation(fields: [customerId], references: [id])
  accountType   String
  balance       Decimal       @db.Decimal(14, 2)
  currency      String        @default("USD")
  status        AccountStatus @default(ACTIVE)
  createdAt     DateTime      @default(now())
  sentTxs       Transaction[] @relation("SourceAccount")
  receivedTxs   Transaction[] @relation("TargetAccount")
}

enum AccountStatus {
  ACTIVE
  FROZEN
  RESTRICTED
}

model Transaction {
  id              String        @id @default(uuid())
  transactionId   String        @unique
  sourceAccountId String
  sourceAccount   Account       @relation("SourceAccount", fields: [sourceAccountId], references: [id])
  targetAccountId String?
  targetAccount   Account?      @relation("TargetAccount", fields: [targetAccountId], references: [id])
  merchantId      String?
  amount          Decimal       @db.Decimal(14, 2)
  currency        String        @default("USD")
  timestamp       DateTime      @default(now())
  type            String
  status          String
  deviceId        String?
  ipAddress       String?
  isSuspicious    Boolean       @default(false)
  notes           String?
}

model Alert {
  id                String       @id @default(uuid())
  alertId           String       @unique
  title             String
  severity          String
  status            String       @default("NEW")
  riskScore         Int
  primaryEntityId   String
  primaryEntityType String
  evidenceTrace     Json
  createdAt         DateTime     @default(now())
  caseId            String?
  case              InvestigationCase? @relation(fields: [caseId], references: [id])
}

model InvestigationCase {
  id            String       @id @default(uuid())
  caseId        String       @unique
  title         String
  status        CaseStatus   @default(OPEN)
  priority      String       @default("HIGH")
  assignedToId  String
  assignedTo    User         @relation(fields: [assignedToId], references: [id])
  alerts        Alert[]
  notes         Json
  timeline      Json
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

enum CaseStatus {
  OPEN
  IN_INVESTIGATION
  PENDING_SAR
  RESOLVED_FRAUD
  RESOLVED_FALSE_POSITIVE
  CLOSED_INCONCLUSIVE
}
```

---

## 3. Knowledge Graph Ontology & Cypher Queries (Neo4j)

### Node Labels
- `:Customer` `{id, name, email, phone, riskScore}`
- `:Account` `{id, accountNumber, balance, currency}`
- `:Transaction` `{id, amount, timestamp, isSuspicious}`
- `:Device` `{id, fingerprint, isJailbroken, type}`
- `:IPAddress` `{ip, isDatacenter, isVpn, country}`
- `:Merchant` `{id, name, chargebackRate, riskLevel}`

### Directed Relationship Schema
- `(:Customer)-[:OWNS]->(:Account)`
- `(:Account)-[:INITIATED]->(:Transaction)`
- `(:Transaction)-[:RECEIVED]->(:Account)`
- `(:Transaction)-[:RECEIVED]->(:Merchant)`
- `(:Account)-[:USED_DEVICE]->(:Device)`
- `(:Account)-[:USED_IP]->(:IPAddress)`

### Representative Cypher Queries

#### Multi-Account Device Multiplexing (FR-01)
```cypher
MATCH (c:Customer)-[:OWNS]->(a:Account)-[:USED_DEVICE]->(d:Device)
WITH d, collect(DISTINCT c) AS customers, collect(DISTINCT a) AS accounts
WHERE size(customers) >= $maxAccountsPerDevice
RETURN d.id AS deviceId, d.fingerprint AS fingerprint, size(customers) AS customerCount, accounts;
```

#### Circular Money Laundering Cycle (FR-13)
```cypher
MATCH path = (a1:Account)-[:INITIATED]->(t1:Transaction)-[:RECEIVED]->
             (a2:Account)-[:INITIATED]->(t2:Transaction)-[:RECEIVED]->
             (a3:Account)-[:INITIATED]->(t3:Transaction)-[:RECEIVED]->(a1)
WHERE duration.inHours(t1.timestamp, t3.timestamp).hours <= $maxCycleHours
  AND t1.amount >= $minCycleAmount
RETURN a1.accountNumber, a2.accountNumber, a3.accountNumber, t1.amount, t2.amount, t3.amount;
```

---

## 4. Symbolic AI: Forward Chaining Proof & Traceability

### Algorithm Steps:
1. **Working Memory Initialization**: Base graph facts $f \in \mathcal{F}_{\text{graph}}$ are asserted into Working Memory $\mathcal{WM}_0$.
2. **Match Phase**: Graph pattern conditions $\text{Premise}(R_i)$ are evaluated against $\mathcal{WM}_t$.
3. **Conflict Resolution**: Satisfied rules are sorted by specificity $\sigma(R_i)$ and severity weight $w(R_i)$.
4. **Action Phase**: Derivations $\text{Conclusion}(R_i)$ are asserted into $\mathcal{WM}_{t+1}$.
5. **Convergence / Fixed Point**: If $\mathcal{WM}_{t+1} \setminus \mathcal{WM}_t = \emptyset$, deduction terminates.
