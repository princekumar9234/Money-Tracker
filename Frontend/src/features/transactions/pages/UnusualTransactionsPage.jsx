import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { RiskBadge } from '../../../components/common/RiskBadge';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

export const UnusualTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUnusual = async () => {
      try {
        const res = await api.get('/transactions/suspicious');
        setTransactions(res.data.data.transactions || []);
      } catch (err) {
        console.error('Failed to fetch unusual transactions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUnusual();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Unusual Transactions</h1>
        <p className="text-xs text-slate-500 mt-1">Review transactions flagged with medium or high risk indicators.</p>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No unusual transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(t.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 truncate max-w-[200px]">{t.description}</td>
                    <td className="px-4 py-3 font-mono">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3">
                      <RiskBadge riskLevel={t.riskLevel} riskScore={t.riskScore} />
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="secondary" size="sm" onClick={() => navigate(`/transactions/${t._id}`)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
