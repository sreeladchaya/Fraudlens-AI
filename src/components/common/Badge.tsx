/**
 * FraudLens — Clean Status & Severity Indicators
 * Follows Zero-Pill & Metadata Discipline from Universal Frontend Design Constitution
 */

import React from 'react';
import { RiskSeverity } from '../../types/index.ts';

interface SeverityBadgeProps {
  severity: RiskSeverity;
  score?: number;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, score }) => {
  const configs: Record<RiskSeverity, { label: string; textClass: string; bgClass: string; borderClass: string }> = {
    LOW: {
      label: 'Low Risk',
      textClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
    },
    MEDIUM: {
      label: 'Medium Risk',
      textClass: 'text-amber-700',
      bgClass: 'bg-amber-50',
      borderClass: 'border-amber-200',
    },
    HIGH: {
      label: 'High Risk',
      textClass: 'text-orange-700',
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-200',
    },
    CRITICAL: {
      label: 'Critical Alert',
      textClass: 'text-rose-700',
      bgClass: 'bg-rose-50',
      borderClass: 'border-rose-200',
    },
  };

  const c = configs[severity] || configs.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded border ${c.bgClass} ${c.textClass} ${c.borderClass}`}>
      <span>{c.label}</span>
      {score !== undefined && (
        <>
          <span className="opacity-50">·</span>
          <span className="font-mono tabular-nums">{score}</span>
        </>
      )}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const formatStatus = (s: string) => {
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  let colorClass = 'text-slate-600 bg-slate-100 border-slate-200';
  if (status === 'ACTIVE' || status === 'SETTLED' || status === 'RESOLVED_FRAUD') {
    colorClass = 'text-blue-700 bg-blue-50 border-blue-200';
  } else if (status === 'NEW' || status === 'OPEN' || status === 'IN_INVESTIGATION') {
    colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (status === 'FLAGGED' || status === 'FROZEN' || status === 'SUSPENDED' || status === 'PENDING_SAR') {
    colorClass = 'text-rose-700 bg-rose-50 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${colorClass}`}>
      {formatStatus(status)}
    </span>
  );
};
