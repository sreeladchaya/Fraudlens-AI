/**
 * FraudLens — Customer Explorer
 * Searchable customer entity registry with linked accounts, devices, and risk scores.
 */

import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api.ts';
import { CustomerEntity, AccountEntity, TransactionEntity, FraudAlert } from '../types/index.ts';
import { SeverityBadge, StatusBadge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import { Search, Filter, User, CreditCard, Network, AlertTriangle } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<{
    customer: CustomerEntity;
    accounts: AccountEntity[];
    transactions: TransactionEntity[];
    alerts: FraudAlert[];
  } | null>(null);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ customers: CustomerEntity[] }>('/api/customers');
      setCustomers(res.customers);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSelectCustomer = async (id: string) => {
    setSelectedCustomerId(id);
    try {
      const res = await apiClient.get<any>(`/api/customers/${id}`);
      setCustomerDetail(res);
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    }
  };

  const filtered = customers.filter(c => {
    const matchesQuery =
      c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Customer Entity Explorer</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Legal identity records, account holdings, risk scores, and graph connectivity profiles
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, ID or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded w-full text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">Active (Normal)</option>
            <option value="FLAGGED">Flagged for Surveillance</option>
            <option value="SUSPENDED">Suspended / Frozen</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                <th className="py-2.5 px-4 font-semibold">Customer ID</th>
                <th className="py-2.5 px-4 font-semibold">Customer Name</th>
                <th className="py-2.5 px-4 font-semibold">Email & Phone</th>
                <th className="py-2.5 px-4 font-semibold">Risk Score</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Accounts</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading customers...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">No customer records found.</td>
                </tr>
              ) : (
                filtered.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{cust.customerId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {cust.firstName} {cust.lastName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      <div>{cust.email}</div>
                      <div className="text-[10px] text-slate-400">{cust.phone}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={cust.riskScore >= 70 ? 'text-rose-700' : 'text-slate-800'}>
                        {cust.riskScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={cust.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {cust.accounts.length} Accounts
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSelectCustomer(cust.id)}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                      >
                        Inspect Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Modal */}
      {selectedCustomerId && customerDetail && (
        <Modal
          isOpen={Boolean(selectedCustomerId)}
          onClose={() => {
            setSelectedCustomerId(null);
            setCustomerDetail(null);
          }}
          title={`Customer Profile: ${customerDetail.customer.firstName} ${customerDetail.customer.lastName}`}
          subtitle={`Customer ID: ${customerDetail.customer.customerId}`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Top Stat */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
              <div>
                <span className="text-slate-500 block">Surveillance Score</span>
                <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                  {customerDetail.customer.riskScore}/100
                </span>
              </div>
              <StatusBadge status={customerDetail.customer.status} />
            </div>

            {/* Account Holdings */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 uppercase tracking-wider block">
                Financial Accounts ({customerDetail.accounts.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {customerDetail.accounts.map(acc => (
                  <div key={acc.id} className="p-3 bg-white border border-slate-200 rounded">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-slate-900">{acc.accountNumber}</span>
                      <StatusBadge status={acc.status} />
                    </div>
                    <div className="text-slate-500 mt-1">
                      {acc.accountType} · Balance: <strong className="text-slate-900 font-mono">${acc.balance.toLocaleString()}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Alerts */}
            {customerDetail.alerts.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-rose-700 uppercase tracking-wider block">
                  Associated Surveillance Alerts ({customerDetail.alerts.length})
                </span>
                <div className="space-y-1.5">
                  {customerDetail.alerts.map(a => (
                    <div key={a.id} className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-900">
                      <div className="flex items-center justify-between font-semibold">
                        <span>{a.title}</span>
                        <SeverityBadge severity={a.severity} score={a.riskScore} />
                      </div>
                      <p className="text-rose-800 text-[11px] mt-0.5">{a.evidenceTrace.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
