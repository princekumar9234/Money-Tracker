import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { RiskBadge } from '../../../components/common/RiskBadge';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Skeleton, EmptyState } from '../../../components/common/LayoutComponents';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Sparkles,
  UploadCloud,
  Database,
  Trash2,
  Calendar,
} from 'lucide-react';

export const TransactionsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [riskLevel, setRiskLevel] = useState(searchParams.get('riskLevel') || '');
  const [minAmount, setMinAmount] = useState(searchParams.get('minAmount') || '');
  const [maxAmount, setMaxAmount] = useState(searchParams.get('maxAmount') || '');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.set('page', page);
      query.set('limit', 15);
      if (search) query.set('search', search);
      if (type) query.set('type', type);
      if (riskLevel) query.set('riskLevel', riskLevel);
      if (minAmount) query.set('minAmount', minAmount);
      if (maxAmount) query.set('maxAmount', maxAmount);
      query.set('sortBy', sortBy);
      query.set('sortOrder', sortOrder);

      const res = await api.get(`/transactions?${query.toString()}`);
      setTransactions(res.data || []);
      if (res.meta) {
        setMeta(res.meta);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, riskLevel, minAmount, maxAmount, sortBy, sortOrder]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const resetFilters = () => {
    setSearch('');
    setType('');
    setRiskLevel('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and inspect risk indicators across your audited records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/upload-statement">
            <Button size="sm" variant="outline" icon={UploadCloud}>
              Import Statements
            </Button>
          </Link>
          <Link to="/unusual-transactions">
            <Button size="sm" variant="secondary" icon={Sparkles}>
              View Risk Anomalies
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[220px]">
            <Input
              placeholder="Search by ID, narration, sender, receiver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
              className="text-xs"
            />
          </div>

          {/* Type Filter */}
          <div className="w-36">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Types</option>
              <option value="credit">Credits (+ Inflow)</option>
              <option value="debit">Debits (- Outflow)</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="w-40">
            <select
              value={riskLevel}
              onChange={(e) => {
                setRiskLevel(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Risk Tiers</option>
              <option value="High Risk">High Risk</option>
              <option value="Medium Risk">Medium Risk</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Low Risk">Low Risk</option>
              <option value="Normal">Normal</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="w-36">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full text-xs rounded-lg border border-slate-300 py-2.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="riskScore-desc">Highest Risk Score</option>
            </select>
          </div>

          <Button type="submit" size="md" variant="primary">
            Filter
          </Button>

          {(search || type || riskLevel || minAmount || maxAmount) && (
            <Button type="button" size="md" variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
          )}
        </form>
      </div>

      {/* Transactions Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10" count={6} />
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/75">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Origin / Recipient</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Risk Tier</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((txn) => (
                    <tr
                      key={txn._id}
                      onClick={() => navigate(`/transactions/${txn._id}`)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-brand-700 whitespace-nowrap">
                        {txn.transactionId}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(txn.date)}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-xs truncate">
                        {txn.description}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-[160px] truncate">
                        {txn.type === 'credit' ? txn.sender : txn.receiver}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                        {txn.paymentMode || 'TRANSFER'}
                      </td>
                      <td className="py-3 px-4 font-semibold whitespace-nowrap">
                        <span
                          className={txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}
                        >
                          {txn.type === 'credit' ? '+' : '-'}
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <RiskBadge level={txn.riskLevel} score={txn.riskScore} size="sm" />
                      </td>
                      <td
                        className="py-3 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/trace?txn=${txn.transactionId}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Trace Money Flow Trail"
                          >
                            <GitBranch className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/transactions/${txn._id}`}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                          >
                            Analyze
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/40">
              <div>
                Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} records
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                >
                  Prev
                </Button>
                <span className="px-2 font-mono font-medium text-slate-700">
                  {meta.page} / {meta.totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  icon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="No transactions matched"
            description="Try changing your search parameters, clearing filters, or uploading a statement."
            action={
              <Button size="sm" variant="outline" onClick={resetFilters}>
                Clear All Filters
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};
