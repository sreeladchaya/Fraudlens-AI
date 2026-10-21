/**
 * FraudLens — Application Top Navigation Bar
 * Conforms strictly to the 3-Zone Top Bar Contract in Universal Frontend Design
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldAlert, Play, RotateCcw, LogOut, ChevronDown } from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'graph' 
  | 'rings' 
  | 'alerts' 
  | 'cases' 
  | 'rules' 
  | 'customers' 
  | 'transactions' 
  | 'reports' 
  | 'admin' 
  | 'viva';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onRunEngine: () => void;
  isEngineRunning?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onRunEngine,
  isEngineRunning,
}) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  const navLinks: { tab: NavTab; label: string }[] = [
    { tab: 'dashboard', label: 'Dashboard' },
    { tab: 'graph', label: 'Knowledge Graph' },
    { tab: 'rings', label: 'Fraud Rings' },
    { tab: 'alerts', label: 'Alerts' },
    { tab: 'cases', label: 'Cases' },
    { tab: 'rules', label: 'Rule Engine' },
    { tab: 'customers', label: 'Customers' },
    { tab: 'transactions', label: 'Transactions' },
    { tab: 'reports', label: 'Reports' },
    { tab: 'viva', label: 'Viva Guide' },
  ];

  if (user?.role === 'ADMIN' || user?.role === 'AUDITOR') {
    navLinks.push({ tab: 'admin', label: 'Admin & Audit' });
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="w-full px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center text-white shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <button
            onClick={() => onSelectTab('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-700 transition-colors cursor-pointer text-left"
          >
            FraudLens
          </button>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 overflow-x-auto py-2">
          {navLinks.map(link => {
            const isActive = currentTab === link.tab;
            return (
              <button
                key={link.tab}
                onClick={() => onSelectTab(link.tab)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-blue-700 border-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRunEngine}
            disabled={isEngineRunning}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
              isEngineRunning
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-800 active:bg-blue-900'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isEngineRunning ? 'animate-spin' : ''}`} />
            <span>{isEngineRunning ? 'Reasoning...' : 'Run Forward Chaining'}</span>
          </button>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-semibold text-slate-700">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{user?.name}</div>
                <div className="text-[10px] text-slate-500 font-mono uppercase">{user?.role}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1.5">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono border border-blue-200">
                      {user?.role} · {user?.department}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSelectTab('viva');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span>FOAI Viva Defense Guide</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-2 border-t border-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation row */}
      <div className="lg:hidden flex items-center gap-3 px-6 py-2 border-t border-slate-100 overflow-x-auto bg-slate-50">
        {navLinks.map(link => (
          <button
            key={link.tab}
            onClick={() => onSelectTab(link.tab)}
            className={`text-xs whitespace-nowrap px-2.5 py-1 rounded transition-colors ${
              currentTab === link.tab
                ? 'bg-blue-700 text-white font-medium'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};
