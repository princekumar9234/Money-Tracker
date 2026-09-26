import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { RiskBadge } from '../../../components/common/RiskBadge';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { Alert, Skeleton, EmptyState } from '../../../components/common/LayoutComponents';
import {
  AlertTriangle,
  GitBranch,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const UnusualTransactionsPage = () => {
  const [loading, setLoading] = useState(true);
  const [riskyTxns, setRiskyTxns] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRiskyTransactions();
  }, []);

  const fetchRiskyTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/analysis/risky');
      setRiskyTxns(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch risky transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Unusual Transactions & Risk Detection
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
              {riskyTxns.length} Flagged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Algorithmic screening for rapid fund movement, structuring patterns, and value deviations.
          </p>
        </div>

        <Link to="/reports">
          <Button variant="primary" size="sm" icon={Sparkles}>
            Generate Risk Report
          </Button>
        </Link>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <p>
          <strong>Compliance Notice:</strong> This analysis indicates risk patterns only and does not establish that funds are illegal or constitute black money. Flagged items warrant manual or accounting review.
        </p>
      </div>

      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Risky Transactions Grid / List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28" count={4} />
        </div>
      ) : riskyTxns.length > 0 ? (
        <div className="space-y-4">
          {riskyTxns.map((txn) => (
            <Card
              key={txn._id}
              className="hover:border-slate-300 transition-all hover:shadow-card-hover"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Transaction core details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {txn.transactionId}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {formatDate(txn.date)}
                    </span>
                    <RiskBadge level={txn.riskLevel} score={txn.riskScore} size="sm" />
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {txn.paymentMode || 'TRANSFER'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800">{txn.description}</p>

                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span>
                      Party: <strong>{txn.type === 'credit' ? txn.sender : txn.receiver}</strong>
                    </span>
                    <span>•</span>
                    <span className="capitalize">Type: {txn.type}</span>
                  </div>

                  {/* Primary Indicator Reason */}
                  {txn.indicators && txn.indicators.length > 0 && (
                    <div className="mt-2 p-2.5 bg-red-50/60 rounded-lg border border-red-100 text-xs text-red-900 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Primary Flag:</strong> {txn.indicators[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right">
                    <span
                      className={`text-lg font-bold font-mono ${
                        txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {txn.type === 'credit' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Bal: {formatCurrency(txn.balance)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/trace?txn=${txn.transactionId}`}>
                      <Button variant="outline" size="sm" icon={GitBranch}>
                        Trace Flow
                      </Button>
                    </Link>
                    <Link to={`/transactions/${txn._id}`}>
                      <Button variant="secondary" size="sm">
                        View Analysis
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle}
          title="No suspicious indicators detected"
          description="Your transaction records currently show no high-risk anomalies, structuring patterns, or rapid fund dissipations."
          action={
            <Link to="/transactions">
              <Button size="sm" variant="outline">
                View All Transactions
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
};
