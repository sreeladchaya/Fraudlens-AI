/**
 * FraudLens — Synthetic Dataset Generator
 * Foundations of AI Project
 * 
 * Generates reproducible financial entity graphs with controlled positive fraud ring
 * scenarios and realistic negative (benign) control samples.
 */

import {
  CustomerEntity,
  AccountEntity,
  TransactionEntity,
  DeviceEntity,
  IpAddressEntity,
  MerchantEntity,
  KnowledgeGraphData,
  GraphNode,
  GraphEdge,
} from '../types/index.ts';

export interface SyntheticDataset {
  customers: CustomerEntity[];
  accounts: AccountEntity[];
  transactions: TransactionEntity[];
  devices: DeviceEntity[];
  ipAddresses: IpAddressEntity[];
  merchants: MerchantEntity[];
  graph: KnowledgeGraphData;
  plantedRingsSummary: {
    ringId: string;
    name: string;
    scenarioType: string;
    description: string;
    expectedRules: string[];
    involvedEntityIds: string[];
  }[];
}

export function generateSyntheticDataset(seed: number = 42): SyntheticDataset {
  // Simple seeded pseudo-random generator (LCG)
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  const customers: CustomerEntity[] = [];
  const accounts: AccountEntity[] = [];
  const transactions: TransactionEntity[] = [];
  const devices: DeviceEntity[] = [];
  const ipAddresses: IpAddressEntity[] = [];
  const merchants: MerchantEntity[] = [];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Helper to add nodes
  const addNode = (node: GraphNode) => {
    if (!nodes.find(n => n.id === node.id)) {
      nodes.push(node);
    }
  };

  // Helper to add edges
  const addEdge = (edge: GraphEdge) => {
    if (!edges.find(e => e.id === edge.id)) {
      edges.push(edge);
    }
  };

  // =========================================================================
  // SCENARIO 1: THE PEGASUS RING (Synthetic Identity & Structuring)
  // 4 synthetic profiles, 1 jailbroken iPhone, 1 datacenter IP, structuring < $10k
  // =========================================================================
  const devPegasus: DeviceEntity = {
    id: 'DEV-PEGASUS-01',
    deviceId: 'DEV-PEGASUS-01',
    fingerprint: 'a89f-7c12-3341-jailbreak-ios',
    deviceType: 'MOBILE_IOS',
    isJailbroken: true,
    firstSeen: '2026-10-01T04:12:00Z',
    lastSeen: '2026-10-18T18:30:00Z',
  };
  devices.push(devPegasus);
  addNode({
    id: devPegasus.id,
    label: 'Jailbroken iPhone (Pegasus)',
    type: 'DEVICE',
    properties: { fingerprint: devPegasus.fingerprint, isJailbroken: true },
    riskScore: 85,
    isFlagged: true,
  });

  const ipPegasus: IpAddressEntity = {
    id: 'IP-DATACENTER-01',
    ip: '198.51.100.42',
    isVpn: true,
    isDatacenter: true,
    country: 'Seychelles',
    city: 'Victoria',
    asn: 'AS64512-HOSTING-PROXY',
  };
  ipAddresses.push(ipPegasus);
  addNode({
    id: ipPegasus.id,
    label: '198.51.100.42 (Datacenter VPN)',
    type: 'IP_ADDRESS',
    properties: { ip: ipPegasus.ip, isDatacenter: true, isVpn: true },
    riskScore: 78,
    isFlagged: true,
  });

  const pegasusCustomerDefs = [
    { id: 'CUST-PEG-01', first: 'Arthur', last: 'Pendelton', email: 'arthur.p.771@tempmail-vault.io', phone: '+1-555-019-8822', ssn: '***-**-4190' },
    { id: 'CUST-PEG-02', first: 'Marcus', last: 'Vance', email: 'marcus.v.992@tempmail-vault.io', phone: '+1-555-019-8822', ssn: '***-**-4191' },
    { id: 'CUST-PEG-03', first: 'Elena', last: 'Rostova', email: 'elena.r.331@tempmail-vault.io', phone: '+1-555-019-8822', ssn: '***-**-4192' },
    { id: 'CUST-PEG-04', first: 'Chloe', last: 'Sterling', email: 'chloe.s.554@tempmail-vault.io', phone: '+1-555-019-8822', ssn: '***-**-4193' },
  ];

  const pegasusAccountIds: string[] = [];

  pegasusCustomerDefs.forEach((def, idx) => {
    const cust: CustomerEntity = {
      id: def.id,
      customerId: def.id,
      firstName: def.first,
      lastName: def.last,
      email: def.email,
      phone: def.phone,
      ssnMasked: def.ssn,
      dateOfBirth: '1991-04-12',
      riskScore: 92,
      status: 'FLAGGED',
      accounts: [`ACC-PEG-0${idx + 1}`],
      createdAt: '2026-10-02T10:00:00Z',
    };
    customers.push(cust);
    addNode({
      id: cust.id,
      label: `${cust.firstName} ${cust.lastName}`,
      type: 'CUSTOMER',
      properties: { email: cust.email, phone: cust.phone, riskScore: 92 },
      riskScore: 92,
      isFlagged: true,
    });

    const acc: AccountEntity = {
      id: `ACC-PEG-0${idx + 1}`,
      accountNumber: `4100-8812-990${idx + 1}`,
      customerId: cust.id,
      accountType: 'CHECKING',
      balance: 1420.50,
      currency: 'USD',
      status: 'RESTRICTED',
      createdAt: '2026-10-02T10:15:00Z',
    };
    accounts.push(acc);
    pegasusAccountIds.push(acc.id);

    addNode({
      id: acc.id,
      label: `Account ${acc.accountNumber.slice(-4)}`,
      type: 'ACCOUNT',
      properties: { accountNumber: acc.accountNumber, balance: acc.balance },
      riskScore: 88,
      isFlagged: true,
    });

    // Edges
    addEdge({ id: `e-own-${cust.id}-${acc.id}`, source: cust.id, target: acc.id, type: 'OWNS', label: 'OWNS' });
    addEdge({ id: `e-dev-${acc.id}-${devPegasus.id}`, source: acc.id, target: devPegasus.id, type: 'USED_DEVICE', label: 'USED_DEVICE', isFlagged: true });
    addEdge({ id: `e-ip-${acc.id}-${ipPegasus.id}`, source: acc.id, target: ipPegasus.id, type: 'USED_IP', label: 'USED_IP', isFlagged: true });
  });

  // Structuring transactions (< $10,000 threshold smurfing)
  const structuringAmounts = [9400, 9850, 9600, 9250];
  structuringAmounts.forEach((amt, idx) => {
    const tx: TransactionEntity = {
      id: `TX-PEG-STRUCT-0${idx + 1}`,
      transactionId: `TX-PEG-STRUCT-0${idx + 1}`,
      sourceAccountId: idx < 2 ? pegasusAccountIds[0] : pegasusAccountIds[idx],
      targetAccountId: pegasusAccountIds[(idx + 1) % pegasusAccountIds.length],
      amount: amt,
      currency: 'USD',
      timestamp: `2026-10-15T14:${10 + idx * 12}:00Z`,
      type: 'TRANSFER',
      status: 'FLAGGED',
      deviceId: devPegasus.id,
      ipAddress: ipPegasus.ip,
      isSuspicious: true,
      notes: 'Structured wire just below $10,000 BSA threshold',
    };
    transactions.push(tx);

    addNode({
      id: tx.id,
      label: `Tx $${amt.toLocaleString()}`,
      type: 'TRANSACTION',
      properties: { amount: tx.amount, timestamp: tx.timestamp },
      riskScore: 90,
      isFlagged: true,
    });

    addEdge({ id: `e-tx-init-${tx.id}`, source: tx.sourceAccountId, target: tx.id, type: 'INITIATED', label: 'INITIATED', isFlagged: true });
    addEdge({ id: `e-tx-recv-${tx.id}`, source: tx.id, target: tx.targetAccountId!, type: 'RECEIVED', label: 'RECEIVED', isFlagged: true });
  });

  // =========================================================================
  // SCENARIO 2: THE OUROBOROS RING (Circular 3-Hop Fund Laundering Cycle)
  // A -> B -> C -> A within 36 hours for round-tripping liquidity
  // =========================================================================
  const ouroborosCustomerDefs = [
    { id: 'CUST-OURO-01', first: 'Klaus', last: 'Richter', email: 'klaus.richter@berlin-tech.de', phone: '+49-151-555-0181' },
    { id: 'CUST-OURO-02', first: 'Amara', last: 'Okafor', email: 'amara.okafor@lagos-global.org', phone: '+234-802-555-0192' },
    { id: 'CUST-OURO-03', first: 'Siddharth', last: 'Nair', email: 'siddharth.nair@mumbai-exp.in', phone: '+91-9820-555-014' },
  ];

  const ouroborosAccountIds: string[] = [];

  ouroborosCustomerDefs.forEach((def, idx) => {
    const cust: CustomerEntity = {
      id: def.id,
      customerId: def.id,
      firstName: def.first,
      lastName: def.last,
      email: def.email,
      phone: def.phone,
      ssnMasked: `***-**-770${idx}`,
      dateOfBirth: '1987-11-20',
      riskScore: 94,
      status: 'FLAGGED',
      accounts: [`ACC-OURO-0${idx + 1}`],
      createdAt: '2026-08-10T12:00:00Z',
    };
    customers.push(cust);
    addNode({
      id: cust.id,
      label: `${cust.firstName} ${cust.lastName}`,
      type: 'CUSTOMER',
      properties: { email: cust.email, riskScore: 94 },
      riskScore: 94,
      isFlagged: true,
    });

    const acc: AccountEntity = {
      id: `ACC-OURO-0${idx + 1}`,
      accountNumber: `7200-4491-000${idx + 1}`,
      customerId: cust.id,
      accountType: 'BUSINESS',
      balance: 18450.00,
      currency: 'USD',
      status: 'RESTRICTED',
      createdAt: '2026-08-10T14:30:00Z',
    };
    accounts.push(acc);
    ouroborosAccountIds.push(acc.id);

    addNode({
      id: acc.id,
      label: `Account ${acc.accountNumber.slice(-4)}`,
      type: 'ACCOUNT',
      properties: { accountNumber: acc.accountNumber, balance: acc.balance },
      riskScore: 95,
      isFlagged: true,
    });

    addEdge({ id: `e-own-${cust.id}-${acc.id}`, source: cust.id, target: acc.id, type: 'OWNS', label: 'OWNS' });
  });

  // Directed Loop: A -> B ($18,500), B -> C ($18,100), C -> A ($17,800)
  const cycleTxs = [
    { id: 'TX-OURO-CYC-01', from: ouroborosAccountIds[0], to: ouroborosAccountIds[1], amount: 18500, time: '2026-10-16T09:00:00Z' },
    { id: 'TX-OURO-CYC-02', from: ouroborosAccountIds[1], to: ouroborosAccountIds[2], amount: 18100, time: '2026-10-16T17:30:00Z' },
    { id: 'TX-OURO-CYC-03', from: ouroborosAccountIds[2], to: ouroborosAccountIds[0], amount: 17800, time: '2026-10-17T11:15:00Z' },
  ];

  cycleTxs.forEach((ctx, idx) => {
    const tx: TransactionEntity = {
      id: ctx.id,
      transactionId: ctx.id,
      sourceAccountId: ctx.from,
      targetAccountId: ctx.to,
      amount: ctx.amount,
      currency: 'USD',
      timestamp: ctx.time,
      type: 'TRANSFER',
      status: 'FLAGGED',
      isSuspicious: true,
      notes: `Circular Layering Leg ${idx + 1} of 3`,
    };
    transactions.push(tx);

    addNode({
      id: tx.id,
      label: `Tx $${tx.amount.toLocaleString()}`,
      type: 'TRANSACTION',
      properties: { amount: tx.amount, timestamp: tx.timestamp },
      riskScore: 96,
      isFlagged: true,
    });

    addEdge({ id: `e-init-${tx.id}`, source: ctx.from, target: tx.id, type: 'INITIATED', label: 'INITIATED', isFlagged: true });
    addEdge({ id: `e-recv-${tx.id}`, source: tx.id, target: ctx.to, type: 'RECEIVED', label: 'RECEIVED', isFlagged: true });
  });

  // =========================================================================
  // SCENARIO 3: THE HYDRA MERCHANT RING (Collusive POS & Stolen Card Testing)
  // Collusive merchant + 4 stolen cards on 1 emulator device + micro-authorizations
  // =========================================================================
  const devHydra: DeviceEntity = {
    id: 'DEV-EMU-HYDRA-88',
    deviceId: 'DEV-EMU-HYDRA-88',
    fingerprint: 'bluestacks-android-emu-9941',
    deviceType: 'EMULATOR',
    isJailbroken: true,
    firstSeen: '2026-10-10T02:00:00Z',
    lastSeen: '2026-10-18T19:40:00Z',
  };
  devices.push(devHydra);
  addNode({
    id: devHydra.id,
    label: 'Android Emulator 9941',
    type: 'DEVICE',
    properties: { fingerprint: devHydra.fingerprint, deviceType: 'EMULATOR' },
    riskScore: 88,
    isFlagged: true,
  });

  const merchantHydra: MerchantEntity = {
    id: 'MERCH-HYDRA-01',
    merchantName: 'Apex Digital Credits Ltd',
    categoryCode: '5734',
    category: 'Computer Software & Digital Downloads',
    riskLevel: 'HIGH',
    chargebackRate: 4.85, // Highly elevated
  };
  merchants.push(merchantHydra);
  addNode({
    id: merchantHydra.id,
    label: 'Apex Digital Credits (Merchant)',
    type: 'MERCHANT',
    properties: { name: merchantHydra.merchantName, chargebackRate: 4.85 },
    riskScore: 91,
    isFlagged: true,
  });

  // Stolen Card Testing Micro-Transactions ($1.50 - $3.75)
  const microAuths = [1.50, 2.25, 1.99, 3.10, 2.75];
  microAuths.forEach((amt, idx) => {
    const tx: TransactionEntity = {
      id: `TX-HYDRA-TEST-0${idx + 1}`,
      transactionId: `TX-HYDRA-TEST-0${idx + 1}`,
      sourceAccountId: `ACC-PEG-01`, // cross-linked token
      merchantId: merchantHydra.id,
      amount: amt,
      currency: 'USD',
      timestamp: `2026-10-17T03:${10 + idx * 3}:00Z`,
      type: 'CARD_PURCHASE',
      status: 'FLAGGED',
      deviceId: devHydra.id,
      isSuspicious: true,
      notes: 'Card BIN testing automated micro-authorization',
    };
    transactions.push(tx);

    addNode({
      id: tx.id,
      label: `MicroTx $${amt.toFixed(2)}`,
      type: 'TRANSACTION',
      properties: { amount: amt, type: 'CARD_PURCHASE' },
      riskScore: 82,
      isFlagged: true,
    });

    addEdge({ id: `e-h-init-${tx.id}`, source: devHydra.id, target: tx.id, type: 'USED_DEVICE', label: 'USED_DEVICE', isFlagged: true });
    addEdge({ id: `e-h-merch-${tx.id}`, source: tx.id, target: merchantHydra.id, type: 'RECEIVED', label: 'RECEIVED', isFlagged: true });
  });

  // =========================================================================
  // SCENARIO 4: THE SHADOW TAKEOVER (Impossible Geolocation Leap & Beneficiary Drain)
  // Legitimate user Victoria Chen in London -> Sudden Lagos VPN access -> $14,900 drain
  // =========================================================================
  const custVic: CustomerEntity = {
    id: 'CUST-VIC-01',
    customerId: 'CUST-VIC-01',
    firstName: 'Victoria',
    lastName: 'Chen',
    email: 'v.chen@london-advisory.co.uk',
    phone: '+44-20-7946-0193',
    ssnMasked: '***-**-9912',
    dateOfBirth: '1984-06-15',
    riskScore: 89,
    status: 'FLAGGED',
    accounts: ['ACC-VIC-01'],
    createdAt: '2024-03-12T09:00:00Z',
  };
  customers.push(custVic);
  addNode({
    id: custVic.id,
    label: 'Victoria Chen (Victim/ATO)',
    type: 'CUSTOMER',
    properties: { email: custVic.email, status: 'FLAGGED' },
    riskScore: 89,
    isFlagged: true,
  });

  const accVic: AccountEntity = {
    id: 'ACC-VIC-01',
    accountNumber: '9940-1200-5511',
    customerId: custVic.id,
    accountType: 'SAVINGS',
    balance: 850.00, // Drained from $15,750
    currency: 'USD',
    status: 'FROZEN',
    createdAt: '2024-03-12T09:30:00Z',
  };
  accounts.push(accVic);
  addNode({
    id: accVic.id,
    label: 'Account 5511 (Victoria)',
    type: 'ACCOUNT',
    properties: { accountNumber: accVic.accountNumber, balance: accVic.balance },
    riskScore: 89,
    isFlagged: true,
  });
  addEdge({ id: `e-own-vic`, source: custVic.id, target: accVic.id, type: 'OWNS', label: 'OWNS' });

  const ipLondon: IpAddressEntity = {
    id: 'IP-LONDON-01',
    ip: '82.165.197.1',
    isVpn: false,
    isDatacenter: false,
    country: 'United Kingdom',
    city: 'London',
    asn: 'AS5400-BT-CONSUMER',
  };
  ipAddresses.push(ipLondon);
  addNode({
    id: ipLondon.id,
    label: 'London BT IP (Home)',
    type: 'IP_ADDRESS',
    properties: { ip: ipLondon.ip, city: 'London', country: 'United Kingdom' },
    riskScore: 10,
    isFlagged: false,
  });

  const ipLagos: IpAddressEntity = {
    id: 'IP-LAGOS-01',
    ip: '102.89.23.44',
    isVpn: true,
    isDatacenter: true,
    country: 'Nigeria',
    city: 'Lagos',
    asn: 'AS37108-HOSTING-PROXY',
  };
  ipAddresses.push(ipLagos);
  addNode({
    id: ipLagos.id,
    label: 'Lagos Datacenter Proxy',
    type: 'IP_ADDRESS',
    properties: { ip: ipLagos.ip, city: 'Lagos', isDatacenter: true },
    riskScore: 86,
    isFlagged: true,
  });

  // Link IP edges showing impossible leap
  addEdge({ id: 'e-vic-ip-london', source: accVic.id, target: ipLondon.id, type: 'USED_IP', label: 'USED_IP' });
  addEdge({ id: 'e-vic-ip-lagos', source: accVic.id, target: ipLagos.id, type: 'USED_IP', label: 'USED_IP', isFlagged: true });

  const txVicDrain: TransactionEntity = {
    id: 'TX-VIC-DRAIN-01',
    transactionId: 'TX-VIC-DRAIN-01',
    sourceAccountId: accVic.id,
    targetAccountId: 'ACC-OURO-01', // Money funneling into ring 2
    amount: 14900,
    currency: 'USD',
    timestamp: '2026-10-18T04:22:00Z',
    type: 'TRANSFER',
    status: 'FLAGGED',
    ipAddress: ipLagos.ip,
    isSuspicious: true,
    notes: 'Immediate post-ATO beneficiary drain transfer executed at 04:22 AM',
  };
  transactions.push(txVicDrain);
  addNode({
    id: txVicDrain.id,
    label: 'Tx $14,900 (Drain)',
    type: 'TRANSACTION',
    properties: { amount: 14900, timestamp: txVicDrain.timestamp },
    riskScore: 98,
    isFlagged: true,
  });
  addEdge({ id: 'e-vic-drain-init', source: accVic.id, target: txVicDrain.id, type: 'INITIATED', label: 'INITIATED', isFlagged: true });
  addEdge({ id: 'e-vic-drain-recv', source: txVicDrain.id, target: 'ACC-OURO-01', type: 'RECEIVED', label: 'RECEIVED', isFlagged: true });

  // =========================================================================
  // NEGATIVE BASELINE CONTROLS (Legitimate Entities & Everyday Behavior)
  // Ensures realistic precision & recall: not every shared IP or device is fraud
  // =========================================================================
  const benignCustomers = [
    { id: 'CUST-BEN-01', first: 'David', last: 'Miller', email: 'd.miller@gmail.com', phone: '+1-555-442-1100' },
    { id: 'CUST-BEN-02', first: 'Sarah', last: 'Miller', email: 'sarah.miller@yahoo.com', phone: '+1-555-442-1101' },
    { id: 'CUST-BEN-03', first: 'Emily', last: 'Watson', email: 'emily.watson@stanford.edu', phone: '+1-555-881-2299' },
    { id: 'CUST-BEN-04', first: 'Carlos', last: 'Gomez', email: 'carlos.gomez@healthtech.com', phone: '+1-555-773-9912' },
    { id: 'CUST-BEN-05', first: 'Amina', last: 'Khoury', email: 'amina.khoury@globaldesign.studio', phone: '+1-555-661-4433' },
  ];

  const benignHomeIp: IpAddressEntity = {
    id: 'IP-BENIGN-HOME',
    ip: '74.125.19.102',
    isVpn: false,
    isDatacenter: false,
    country: 'United States',
    city: 'Seattle',
    asn: 'AS7922-COMCAST',
  };
  ipAddresses.push(benignHomeIp);
  addNode({
    id: benignHomeIp.id,
    label: 'Comcast Home Broadband (Seattle)',
    type: 'IP_ADDRESS',
    properties: { ip: benignHomeIp.ip, isDatacenter: false, isVpn: false },
    riskScore: 5,
    isFlagged: false,
  });

  const benignMerchant: MerchantEntity = {
    id: 'MERCH-COFFEE-01',
    merchantName: 'Artisan Roast Roastery',
    categoryCode: '5814',
    category: 'Fast Food & Coffee Shops',
    riskLevel: 'LOW',
    chargebackRate: 0.08,
  };
  merchants.push(benignMerchant);
  addNode({
    id: benignMerchant.id,
    label: 'Artisan Roast (Legit Merchant)',
    type: 'MERCHANT',
    properties: { name: benignMerchant.merchantName, chargebackRate: 0.08 },
    riskScore: 8,
    isFlagged: false,
  });

  benignCustomers.forEach((def, idx) => {
    const cust: CustomerEntity = {
      id: def.id,
      customerId: def.id,
      firstName: def.first,
      lastName: def.last,
      email: def.email,
      phone: def.phone,
      ssnMasked: `***-**-55${idx}0`,
      dateOfBirth: '1990-08-14',
      riskScore: 12,
      status: 'ACTIVE',
      accounts: [`ACC-BEN-0${idx + 1}`],
      createdAt: '2023-01-15T10:00:00Z',
    };
    customers.push(cust);
    addNode({
      id: cust.id,
      label: `${cust.firstName} ${cust.lastName}`,
      type: 'CUSTOMER',
      properties: { email: cust.email, riskScore: 12 },
      riskScore: 12,
      isFlagged: false,
    });

    const acc: AccountEntity = {
      id: `ACC-BEN-0${idx + 1}`,
      accountNumber: `1000-8800-440${idx + 1}`,
      customerId: cust.id,
      accountType: 'CHECKING',
      balance: 4250.75 + idx * 800,
      currency: 'USD',
      status: 'ACTIVE',
      createdAt: '2023-01-15T11:00:00Z',
    };
    accounts.push(acc);
    addNode({
      id: acc.id,
      label: `Account ${acc.accountNumber.slice(-4)}`,
      type: 'ACCOUNT',
      properties: { accountNumber: acc.accountNumber, balance: acc.balance },
      riskScore: 10,
      isFlagged: false,
    });

    addEdge({ id: `e-own-${cust.id}-${acc.id}`, source: cust.id, target: acc.id, type: 'OWNS', label: 'OWNS' });
    // Legitimate family sharing home IP
    addEdge({ id: `e-ben-ip-${acc.id}`, source: acc.id, target: benignHomeIp.id, type: 'USED_IP', label: 'USED_IP' });

    // Normal everyday transactions
    const legitTx: TransactionEntity = {
      id: `TX-BEN-0${idx + 1}`,
      transactionId: `TX-BEN-0${idx + 1}`,
      sourceAccountId: acc.id,
      merchantId: benignMerchant.id,
      amount: 14.50 + idx * 3.25,
      currency: 'USD',
      timestamp: `2026-10-18T08:${15 + idx * 8}:00Z`,
      type: 'CARD_PURCHASE',
      status: 'SETTLED',
      ipAddress: benignHomeIp.ip,
      isSuspicious: false,
      notes: 'Standard morning cafe authorization',
    };
    transactions.push(legitTx);

    addNode({
      id: legitTx.id,
      label: `Purchase $${legitTx.amount.toFixed(2)}`,
      type: 'TRANSACTION',
      properties: { amount: legitTx.amount, status: 'SETTLED' },
      riskScore: 5,
      isFlagged: false,
    });

    addEdge({ id: `e-ben-init-${legitTx.id}`, source: acc.id, target: legitTx.id, type: 'INITIATED', label: 'INITIATED' });
    addEdge({ id: `e-ben-merch-${legitTx.id}`, source: legitTx.id, target: benignMerchant.id, type: 'RECEIVED', label: 'RECEIVED' });
  });

  const plantedRingsSummary = [
    {
      ringId: 'RING-PEGASUS',
      name: 'The Pegasus Ring (Synthetic Identity & Smurfing)',
      scenarioType: 'SYNTHETIC_MESH',
      description: '4 synthetic customer profiles sharing 1 jailbroken iPhone hardware fingerprint and datacenter proxy IP, performing rapid structuring transfers under $10,000 threshold.',
      expectedRules: ['FR-01', 'FR-02', 'FR-06', 'FR-08'],
      involvedEntityIds: ['DEV-PEGASUS-01', 'IP-DATACENTER-01', ...pegasusCustomerDefs.map(c => c.id)],
    },
    {
      ringId: 'RING-OUROBOROS',
      name: 'The Ouroboros Cycle (Circular Round-Tripping Loop)',
      scenarioType: 'CIRCULAR_CYCLE',
      description: 'Directed 3-hop money laundering cycle across accounts (ACC-6101 -> ACC-6102 -> ACC-6103 -> ACC-6101) within 36 hours for capital layering.',
      expectedRules: ['FR-13', 'FR-14', 'FR-09'],
      involvedEntityIds: [...ouroborosAccountIds, ...cycleTxs.map(t => t.id)],
    },
    {
      ringId: 'RING-HYDRA',
      name: 'The Hydra Merchant Collusion & Card Testing',
      scenarioType: 'MERCHANT_COLLUSION',
      description: 'High chargeback merchant terminal colluding with multi-account emulator device executing automated micro-authorizations testing compromised credentials.',
      expectedRules: ['FR-19', 'FR-20', 'FR-21', 'FR-26'],
      involvedEntityIds: [devHydra.id, merchantHydra.id, ...microAuths.map((_, i) => `TX-HYDRA-TEST-0${i + 1}`)],
    },
    {
      ringId: 'RING-SHADOW',
      name: 'The Shadow Account Takeover & Rapid Drain',
      scenarioType: 'BURST_TAKEOVER',
      description: 'Legitimate account compromised via credential stuffing; impossible geolocation transit leap from London to Lagos VPN followed by immediate beneficiary addition and max funds drain.',
      expectedRules: ['FR-23', 'FR-24', 'FR-25'],
      involvedEntityIds: [custVic.id, accVic.id, ipLondon.id, ipLagos.id, txVicDrain.id],
    },
  ];

  return {
    customers,
    accounts,
    transactions,
    devices,
    ipAddresses,
    merchants,
    graph: { nodes, edges },
    plantedRingsSummary,
  };
}
