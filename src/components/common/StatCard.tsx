/**
 * FraudLens — High-Density Metric Card
 * Foundations of AI Project
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: 'positive' | 'warning' | 'negative' | 'neutral';
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  onClick,
}) => {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-lg p-4 transition-all duration-150 ${
        isClickable ? 'cursor-pointer hover:border-blue-400 hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-600">{label}</span>
        <div className="p-1.5 bg-slate-50 border border-slate-100 rounded text-slate-700">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {value}
        </div>
        {badge && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${
              badge.variant === 'negative'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : badge.variant === 'warning'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : badge.variant === 'positive'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtext && (
        <div className="text-xs text-slate-500 mt-2 truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
