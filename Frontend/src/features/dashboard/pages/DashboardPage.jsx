import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { StatCard } from '../../../components/common/StatCard';
import { RiskBadge } from '../../../components/common/RiskBadge';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Skeleton, EmptyState } from '../../../components/common/LayoutComponents';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  AlertTriangle,
  ShieldCheck,
  GitBranch,
  BotMessageSquare,
  UploadCloud,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [seedingDemo, setSeedingDemo] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, txnRes] = await Promise.all([
        api.get('/ai/summary'),
        api.get('/transactions?limit=8&sortBy=date&sortOrder=desc'),
      ]);

      setSummary(sumRes.data);
      const txns = txnRes.data || [];
      setRecentTxns(txns);

      // Build daily/weekly aggregated chart data from recent transactions
      if (txns.length > 0) {
        const sortedForChart = [...txns].sort((a, b) => new Date(a.date) - new Date(b.date));
        const chartPoints = sortedForChart.map((t) => ({
          date: formatDate(t.date),
          inflow: t.type === 'credit' ? t.amount : 0,
          outflow: t.type === 'debit' ? t.amount : 0,
          balance: t.balance || 0,
        }));
        setChartData(chartPoints);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      setSeedingDemo(true);
      await api.post('/transactions/seed-demo');
      await fetchDashboardData();
    } catch (e) {
      alert(e.message || 'Failed to seed demo');
    } finally {
      setSeedingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 animate-pulse rounded-lg mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Skeleton className="h-28" count={6} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const hasTransactions = summary?.totalTransactions > 0;

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Financial Intelligence Dashboard
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time algorithmic risk detection and funds flow monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!hasTransactions && (
            <Button
              variant="outline"
              size="sm"
              icon={Database}
              isLoading={seedingDemo}
              onClick={handleSeedDemo}
            >
              Load Demo Data
            </Button>
          )}
          <Link to="/upload-statement">
            <Button variant="primary" size="sm" icon={UploadCloud}>
              Upload Statement
            </Button>
          </Link>
        </div>
      </div>

      {/* Mandatory Risk Disclaimer Banner */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
          <span>
            <strong>AI Intelligence Note:</strong> MoneyTrace AI evaluates statistical pattern deviations and velocity. Flagged items indicate <em>risk patterns for human review</em> and do not constitute legal conclusions.
          </span>
        </div>
        <Link to="/knowledge-base" className="hidden md:inline-block font-semibold text-brand-600 hover:underline shrink-0 ml-3">
          Learn More →
        </Link>
      </div>

      {/* 6 Metric Stat Cards (Total In, Total Out, Total Txns, Normal, Needs Review, High Risk) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <StatCard
          title="Total Money In"
          value={formatCurrency(summary?.totalIn || 0)}
          colorScheme="green"
          icon={ArrowDownLeft}
          subtext="Total inbound credits"
        />
        <StatCard
          title="Total Money Out"
          value={formatCurrency(summary?.totalOut || 0)}
          colorScheme="slate"
          icon={ArrowUpRight}
          subtext="Total outbound debits"
        />
        <StatCard
          title="Total Transactions"
          value={summary?.totalTransactions || 0}
          colorScheme="blue"
          icon={Receipt}
          subtext="Processed in ledger"
        />
        <StatCard
          title="Normal Status"
          value={summary?.riskCounts?.normal || 0}
          colorScheme="green"
          icon={ShieldCheck}
          subtext="Standard parameters"
        />
        <StatCard
          title="Needs Review"
          value={summary?.riskCounts?.needsReview || 0}
          colorScheme="amber"
          icon={AlertTriangle}
          subtext="Atypical timing/pattern"
        />
        <StatCard
          title="High Risk Indicators"
          value={summary?.riskCounts?.highRisk || 0}
          colorScheme="red"
          icon={AlertTriangle}
          subtext="Rapid velocity anomalies"
        />
      </div>

      {/* Main Grid: Chart & AI Insights Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Flow Chart */}
        <Card
          className="lg:col-span-2"
          title="Transaction Velocity & Inflow/Outflow Trends"
          subtitle="Chronological distribution of funds moving across accounts"
        >
          {chartData.length > 0 ? (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1">
                            <p className="font-semibold text-slate-300">{payload[0]?.payload?.date}</p>
                            <p className="text-emerald-400">Inflow: {formatCurrency(payload[0]?.value)}</p>
                            <p className="text-red-400">Outflow: {formatCurrency(payload[1]?.value)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="inflow"
                    name="Inflow (Credits)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#inflowGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outflow"
                    name="Outflow (Debits)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#outflowGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No chart data available"
              description="Upload your bank statement or load demo data to view financial velocity curves."
              action={
                <Button size="sm" onClick={handleSeedDemo}>
                  Load Demo Data
                </Button>
              }
            />
          )}
        </Card>

        {/* Right: AI Intelligence Assistant Quick Card */}
        <Card
          title="MoneyTrace Agent"
          subtitle="AI conversational financial assistant"
          action={
            <Link to="/ai-assistant" className="text-xs font-semibold text-brand-600 hover:underline">
              Open Chat →
            </Link>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-brand-50/60 rounded-xl border border-brand-100 text-xs text-brand-900 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-brand-700">
                <BotMessageSquare className="w-4 h-4" />
                <span>Automated Statement Assessment</span>
              </div>
              <p>{summary?.aiSummaryText || 'No transactions imported yet. Upload a statement to trigger automated risk analysis.'}</p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick Inquiries
              </span>
              <div className="space-y-1.5">
                {[
                  'Why was my transaction flagged?',
                  'Where did the recent funds go?',
                  'Find rapid fund movement patterns',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/ai-assistant?prompt=${encodeURIComponent(prompt)}`)}
                    className="w-full text-left p-2 rounded-lg border border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 text-xs text-slate-700 transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate">{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link to="/reports">
                <Button variant="outline" size="sm" className="w-full">
                  Generate Compliance Report
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card
        title="Recent Transactions & Audit Status"
        subtitle="Recently monitored ledger movements with risk badges"
        action={
          <Link to="/transactions" className="text-xs font-semibold text-brand-600 hover:underline">
            View All ({summary?.totalTransactions || 0}) →
          </Link>
        }
      >
        {recentTxns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Risk Assessment</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTxns.map((txn) => (
                  <tr key={txn._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {formatDate(txn.date)}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {txn.transactionId}
                    </td>
                    <td className="py-3 px-3 text-slate-800 max-w-xs truncate font-medium">
                      {txn.description}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold uppercase text-[10px] px-2 py-0.5 rounded ${
                          txn.type === 'credit'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold whitespace-nowrap">
                      <span className={txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}>
                        {txn.type === 'credit' ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <RiskBadge level={txn.riskLevel} score={txn.riskScore} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/trace?txn=${txn.transactionId}`}
                          className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Trace Money Flow"
                        >
                          <GitBranch className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/transactions/${txn._id}`}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-[11px]"
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
        ) : (
          <EmptyState
            title="No transactions yet"
            description="Upload your bank statement to begin personal transaction intelligence."
            action={
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="outline" onClick={handleSeedDemo}>
                  Load Demo Data
                </Button>
                <Link to="/upload-statement">
                  <Button size="sm" variant="primary">
                    Upload Statement
                  </Button>
                </Link>
              </div>
            }
          />
        )}
      </Card>
    </div>
  );
};
