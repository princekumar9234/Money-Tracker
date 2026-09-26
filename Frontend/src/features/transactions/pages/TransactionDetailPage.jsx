import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { RiskBadge } from '../../../components/common/RiskBadge';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { Alert, Skeleton } from '../../../components/common/LayoutComponents';
import {
  ArrowLeft,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  Hash,
  Sparkles,
  ExternalLink,
  BotMessageSquare,
  AlertTriangle,
} from 'lucide-react';

export const TransactionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/transactions/${id}`);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve transaction details');
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    if (!data?.transaction?.transactionId) return;
    try {
      setAnalyzing(true);
      const res = await api.post(`/analysis/${data.transaction.transactionId}`);
      setData((prev) => ({
        ...prev,
        analysis: res.data,
      }));
    } catch (err) {
      alert(err.message || 'Re-analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data?.transaction) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto text-center py-12">
        <Alert type="error" title="Transaction Not Found">
          {error || 'Unable to locate this transaction record in your account.'}
        </Alert>
        <Link to="/transactions">
          <Button variant="outline" size="sm" icon={ArrowLeft}>
            Back to Transactions
          </Button>
        </Link>
      </div>
    );
  }

  const { transaction: txn, analysis } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Transaction Analysis: {txn.transactionId}
              </h1>
              <RiskBadge level={txn.riskLevel} score={txn.riskScore} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Audited ledger entry and algorithmic pattern verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            isLoading={analyzing}
            onClick={handleReanalyze}
            icon={Sparkles}
          >
            Re-Analyze AI
          </Button>
          <Link to={`/trace?txn=${txn.transactionId}`}>
            <Button variant="primary" size="sm" icon={GitBranch}>
              Trace Money Flow
            </Button>
          </Link>
        </div>
      </div>

      {/* Mandatory Disclaimer Alert */}
      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <div>
          <strong>Important Compliance Disclaimer:</strong> This analysis indicates risk patterns only and does not establish that funds are illegal or constitute black money. All claims are grounded strictly in your uploaded ledger.
        </div>
      </div>

      {/* Grid: Transaction Information & AI Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transaction Information Card */}
        <Card title="Transaction Information" subtitle="Recorded ledger attributes">
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono font-bold text-slate-900">{txn.transactionId}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Execution Date</span>
              <span className="font-medium text-slate-800">{formatDateTime(txn.date)}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Transfer Type</span>
              <span className="font-semibold uppercase text-brand-700">{txn.type}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Amount</span>
              <span
                className={`text-base font-bold ${
                  txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {txn.type === 'credit' ? '+' : '-'}
                {formatCurrency(txn.amount)}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Account Balance</span>
              <span className="font-mono text-slate-800">{formatCurrency(txn.balance)}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Payment Mode</span>
              <span className="font-semibold uppercase text-slate-700">{txn.paymentMode}</span>
            </div>

            <div className="py-1.5 border-b border-slate-100">
              <span className="text-slate-500 block mb-1">Originator (Sender)</span>
              <span className="font-medium text-slate-900 block truncate">{txn.sender}</span>
            </div>

            <div className="py-1.5 border-b border-slate-100">
              <span className="text-slate-500 block mb-1">Beneficiary (Receiver)</span>
              <span className="font-medium text-slate-900 block truncate">{txn.receiver}</span>
            </div>

            <div className="py-1.5 border-b border-slate-100">
              <span className="text-slate-500 block mb-1">Reference / UTR</span>
              <span className="font-mono text-slate-700 block truncate">
                {txn.referenceNumber || 'N/A'}
              </span>
            </div>

            <div className="pt-1">
              <span className="text-slate-500 block mb-1">Narration / Description</span>
              <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-200">
                {txn.description}
              </p>
            </div>
          </div>
        </Card>

        {/* Right: AI Risk Analysis & Evidence Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="AI Risk & Pattern Analysis"
            subtitle="Calculated by MoneyTrace pattern detection engine"
            action={<RiskBadge level={analysis?.riskLevel || txn.riskLevel} score={analysis?.riskScore ?? txn.riskScore} size="lg" />}
          >
            <div className="space-y-5 text-xs">
              {/* Risk Score Progress Bar */}
              <div>
                <div className="flex items-center justify-between font-semibold mb-1.5">
                  <span className="text-slate-700">Calculated Risk Index</span>
                  <span className="font-mono font-bold text-slate-900">
                    {analysis?.riskScore ?? txn.riskScore} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      (analysis?.riskScore ?? txn.riskScore) >= 75
                        ? 'bg-red-500'
                        : (analysis?.riskScore ?? txn.riskScore) >= 55
                        ? 'bg-amber-500'
                        : (analysis?.riskScore ?? txn.riskScore) >= 40
                        ? 'bg-yellow-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${analysis?.riskScore ?? txn.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Suspicious Indicators Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Identified Risk Indicators:
                </span>
                <ul className="space-y-1.5">
                  {(analysis?.indicators || txn.indicators || []).map((indicator, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Human-Readable Explanation */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  AI Risk Explanation:
                </span>
                <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100 text-slate-800 leading-relaxed font-sans">
                  "{analysis?.explanation || 'This transaction was analyzed for velocity, rapid movement, and structuring threshold indicators.'}"
                </div>
              </div>

              {/* Related Transactions Evidence Section */}
              {analysis?.relatedTransactions && analysis.relatedTransactions.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                    Correlated Transactions Trail (Evidence):
                  </span>
                  <div className="space-y-2">
                    {analysis.relatedTransactions.map((rel, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-brand-700">
                              {rel.transactionId}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {formatDate(rel.date)}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">{rel.relationReason}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-semibold ${
                              rel.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {rel.type === 'credit' ? '+' : '-'}
                            {formatCurrency(rel.amount)}
                          </span>
                          <p className="text-[10px] text-slate-400 uppercase">{rel.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Trail Button */}
              <div className="pt-2">
                <Link to={`/trace?txn=${txn.transactionId}`}>
                  <Button variant="secondary" size="md" className="w-full" icon={GitBranch}>
                    Launch Interactive Flow Visualizer for {txn.transactionId}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
