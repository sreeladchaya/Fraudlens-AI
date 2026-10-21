/**
 * FraudLens — Authentication Context & Provider
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { apiClient } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isInvestigator: boolean;
  isAnalyst: boolean;
  isAuditor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkCurrentUser = async () => {
    const token = apiClient.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiClient.get<{ user: User }>('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      apiClient.clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkCurrentUser();

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiClient.post<{ token: string; user: User }>('/api/auth/login', {
      email,
      password,
    });
    apiClient.setToken(data.token);
    setUser(data.user);
  };

  const quickLogin = async (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      ADMIN: 'admin@fraudlens.io',
      INVESTIGATOR: 'investigator@fraudlens.io',
      ANALYST: 'analyst@fraudlens.io',
      AUDITOR: 'auditor@fraudlens.io',
    };
    await login(emailMap[role], 'FraudLens2026!');
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    quickLogin,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isInvestigator: user?.role === 'INVESTIGATOR' || user?.role === 'ADMIN',
    isAnalyst: user?.role === 'ANALYST' || user?.role === 'INVESTIGATOR' || user?.role === 'ADMIN',
    isAuditor: user?.role === 'AUDITOR' || user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
