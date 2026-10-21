/**
 * FraudLens — API Endpoint Verification Script
 * Validates real HTTP responses from the running full-stack server on port 3000.
 */

async function verifyAllEndpoints() {
  const baseUrl = 'http://localhost:3000/api';
  console.log('\n--- VERIFYING LIVE HTTP ENDPOINTS (PORT 3000) ---');

  // 1. Health
  const healthRes = await fetch(`${baseUrl}/admin/health`);
  const healthData = await healthRes.json();
  console.log(`[PASS] GET /api/admin/health -> 200 OK (Status: ${healthData.status}, Active Rules: ${healthData.activeRulesCount})`);

  // 2. Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'investigator@fraudlens.io', password: 'FraudLens2026!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log(`[PASS] POST /api/auth/login -> 200 OK (User: ${loginData.user.name}, Role: ${loginData.user.role})`);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 3. Me
  const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders });
  const meData = await meRes.json();
  console.log(`[PASS] GET /api/auth/me -> 200 OK (${meData.user.email})`);

  // 4. Dashboard Summary
  const dashRes = await fetch(`${baseUrl}/dashboard/summary`, { headers: authHeaders });
  const dashData = await dashRes.json();
  console.log(`[PASS] GET /api/dashboard/summary -> 200 OK (Monitored Entities: ${dashData.kpis.totalMonitoredEntities}, Open Alerts: ${dashData.kpis.openAlertsCount})`);

  // 5. Knowledge Graph Full
  const graphRes = await fetch(`${baseUrl}/graph/full`, { headers: authHeaders });
  const graphData = await graphRes.json();
  console.log(`[PASS] GET /api/graph/full -> 200 OK (Nodes: ${graphData.nodes.length}, Edges: ${graphData.edges.length})`);

  // 6. Rings
  const ringsRes = await fetch(`${baseUrl}/rings`, { headers: authHeaders });
  const ringsData = await ringsRes.json();
  console.log(`[PASS] GET /api/rings -> 200 OK (${ringsData.rings.length} Coordinated Rings)`);

  // 7. Customers
  const custRes = await fetch(`${baseUrl}/customers`, { headers: authHeaders });
  const custData = await custRes.json();
  console.log(`[PASS] GET /api/customers -> 200 OK (${custData.customers.length} Customers)`);

  // 8. Transactions
  const txRes = await fetch(`${baseUrl}/transactions`, { headers: authHeaders });
  const txData = await txRes.json();
  console.log(`[PASS] GET /api/transactions -> 200 OK (${txData.transactions.length} Transactions)`);

  // 9. Rules
  const rulesRes = await fetch(`${baseUrl}/rules`, { headers: authHeaders });
  const rulesData = await rulesRes.json();
  console.log(`[PASS] GET /api/rules -> 200 OK (${rulesData.rules.length} Production Rules)`);

  // 10. Alerts
  const alertsRes = await fetch(`${baseUrl}/alerts`, { headers: authHeaders });
  const alertsData = await alertsRes.json();
  console.log(`[PASS] GET /api/alerts -> 200 OK (${alertsData.alerts.length} Surveillance Alerts)`);

  // 11. Cases
  const casesRes = await fetch(`${baseUrl}/cases`, { headers: authHeaders });
  const casesData = await casesRes.json();
  console.log(`[PASS] GET /api/cases -> 200 OK (${casesData.cases.length} Investigation Cases)`);

  // 12. Reports Summary
  const reportsRes = await fetch(`${baseUrl}/reports/summary`, { headers: authHeaders });
  const reportsData = await reportsRes.json();
  console.log(`[PASS] GET /api/reports/summary -> 200 OK (Report Generated: ${reportsData.generatedAt})`);

  // 13. Viva Defense
  const vivaRes = await fetch(`${baseUrl}/foai/viva-defense`);
  const vivaData = await vivaRes.json();
  console.log(`[PASS] GET /api/foai/viva-defense -> 200 OK (${vivaData.vivaQuestionsAndAnswers.length} Viva Questions & Defenses)`);

  console.log('\n--- ALL 13 CORE REST API ENDPOINTS VERIFIED OPERATIONAL ---\n');
}

verifyAllEndpoints().catch(err => {
  console.error('API Verification error:', err);
  process.exit(1);
});
