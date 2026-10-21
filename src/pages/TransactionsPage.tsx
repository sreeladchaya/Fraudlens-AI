/**
 * FraudLens — Transaction Explorer
 * Ledger of financial transactions, graph relationships, and suspicious pattern markers.
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { TransactionEntity } from '../types/index.ts';
import { StatusBadge } from '../components/common/Badge.tsx';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ transactions: TransactionEntity[] }>(
        `/api/transactions?flaggedOnly=${flaggedOnly}&type=${typeFilter}`
      );
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [flaggedOnly, typeFilter]);

  const filtered = transactions.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.transactionId.toLowerCase().includes(q) ||
      t.sourceAccountId.toLowerCase().includes(q) ||
      (t.targetAccountId && t.targetAccountId.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Transaction Surveillance Ledger</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audited transactions, cross-account wires, card authorisations, and structuring indicators
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Tx ID, account or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-full text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Transaction Types</option>
            <option value="TRANSFER">Account Wire / Transfer</option>
            <option value="CARD_PURCHASE">Card Purchase</option>
            <option value="ACH_CREDIT">ACH Credit</option>
            <option value="ATM_WITHDRAWAL">ATM Withdrawal</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={flaggedOnly}
              onChange={e => setFlaggedOnly(e.target.checked)}
              className="rounded text-rose-600 focus:ring-0"
            />
            <span className="font-semibold text-rose-700">Flagged Only</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                <th className="py-2.5 px-4 font-semibold">Tx ID</th>
                <th className="py-2.5 px-4 font-semibold">Flow & Counterparty</th>
                <th className="py-2.5 px-4 font-semibold">Amount</th>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">Status & Indicators</th>
                <th className="py-2.5 px-4 font-semibold">Forensic Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading ledger...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No transactions found.</td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {tx.transactionId}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{tx.sourceAccountId}</span>
                        {tx.targetAccountId && (
                          <>
                            <span className="text-slate-400">➔</span>
                            <span className="font-semibold">{tx.targetAccountId}</span>
                          </>
                        )}
                        {tx.merchantId && (
                          <>
                            <span className="text-slate-400">➔</span>
                            <span className="text-emerald-700">{tx.merchantId}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold tabular-nums text-slate-900 whitespace-nowrap">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {tx.type}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={tx.status} />
                        {tx.isSuspicious && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            SUSPICIOUS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {tx.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
