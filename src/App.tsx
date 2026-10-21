/**
 * FraudLens — Explainable Fraud Ring Detection System
 * Main Application Orchestrator
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header, NavTab } from './components/layout/Header.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { GraphExplorerPage } from './pages/GraphExplorerPage.tsx';
import { FraudRingsPage } from './pages/FraudRingsPage.tsx';
import { AlertsPage } from './pages/AlertsPage.tsx';
import { CasesPage } from './pages/CasesPage.tsx';
import { RulesPage } from './pages/RulesPage.tsx';
import { CustomersPage } from './pages/CustomersPage.tsx';
import { TransactionsPage } from './pages/TransactionsPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { VivaGuidePage } from './pages/VivaGuidePage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { apiClient } from './lib/api.ts';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [navParams, setNavParams] = useState<any>(null);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [engineNotification, setEngineNotification] = useState<string | null>(null);

  const handleNavigate = (tab: NavTab, params?: any) => {
    setCurrentTab(tab);
    setNavParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRunGlobalEngine = async () => {
    setIsEngineRunning(true);
    try {
      const res = await apiClient.post<any>('/api/rules/run-engine');
      setEngineNotification(
        `Forward Chaining cycle completed in ${res.report.executionDurationMs}ms (${res.alertsCount} alerts, ${res.ringsCount} rings active)`
      );
      setTimeout(() => setEngineNotification(null), 5000);
    } catch (err: any) {
      alert(`Inference failed: ${err.message}`);
    } finally {
      setIsEngineRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Initializing FraudLens Surveillance Engine...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        onRunEngine={handleRunGlobalEngine}
        isEngineRunning={isEngineRunning}
      />

      {engineNotification && (
        <div className="bg-blue-700 text-white text-xs px-6 py-2.5 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="font-medium">{engineNotification}</span>
          <button
            onClick={() => setEngineNotification(null)}
            className="text-blue-200 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex-1">
        {currentTab === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {currentTab === 'graph' && (
          <GraphExplorerPage
            initialRingId={navParams?.ringId}
            onNavigateToCase={caseId => handleNavigate('cases', { caseId })}
          />
        )}
        {currentTab === 'rings' && <FraudRingsPage onNavigate={handleNavigate} />}
        {currentTab === 'alerts' && (
          <AlertsPage onNavigate={handleNavigate} selectedAlertId={navParams?.selectedAlertId} />
        )}
        {currentTab === 'cases' && <CasesPage />}
        {currentTab === 'rules' && <RulesPage onEngineTriggered={() => {}} />}
        {currentTab === 'customers' && <CustomersPage />}
        {currentTab === 'transactions' && <TransactionsPage />}
        {currentTab === 'reports' && <ReportsPage />}
        {currentTab === 'admin' && <AdminPage />}
        {currentTab === 'viva' && <VivaGuidePage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
