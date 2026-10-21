/**
 * FraudLens — Authentication & Login Page
 * Enterprise banking security portal with demo identity selection.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldAlert, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { UserRole } from '../types/index.ts';

export const LoginPage: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setError(null);
    setIsLoading(true);
    try {
      await quickLogin(role);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-blue-700 text-white shadow-xs mb-3">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">FraudLens</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explainable Fraud Ring Detection & Knowledge Graph Surveillance Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-lg sm:px-8 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="investigator@fraudlens.io"
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded w-full text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded w-full text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 text-xs font-semibold bg-blue-700 text-white rounded hover:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate to Surveillance Console'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Sign-Ins */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">
              Quick Demonstration Personas (One-Click)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                disabled={isLoading}
                className="p-2.5 text-left border border-slate-200 rounded bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900">Dr. Sarah Al-Mansoor</div>
                <div className="text-[10px] text-blue-700 font-mono">ADMIN / AI GOV</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('INVESTIGATOR')}
                disabled={isLoading}
                className="p-2.5 text-left border border-slate-200 rounded bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900">James Reynolds, CFE</div>
                <div className="text-[10px] text-blue-700 font-mono">INVESTIGATOR / SIU</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('ANALYST')}
                disabled={isLoading}
                className="p-2.5 text-left border border-slate-200 rounded bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900">Maya Lin</div>
                <div className="text-[10px] text-slate-600 font-mono">AML ANALYST</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('AUDITOR')}
                disabled={isLoading}
                className="p-2.5 text-left border border-slate-200 rounded bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900">Edward Hayes</div>
                <div className="text-[10px] text-slate-600 font-mono">COMPLIANCE AUDITOR</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500 font-mono">
          Demo Default Password: <strong className="text-slate-800">FraudLens2026!</strong>
        </div>
      </div>
    </div>
  );
};
