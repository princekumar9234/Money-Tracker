import React, { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/formatters';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { RiskBadge } from '../../../components/common/RiskBadge';
import { Modal } from '../../../components/common/Modal';
import { Alert, Skeleton, EmptyState } from '../../../components/common/LayoutComponents';
import {
  FileText,
  Download,
  Trash2,
  Sparkles,
  Eye,
  ShieldCheck,
  Printer,
  Calendar,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [error, setError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportPrintRef = useRef(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      setReports(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setError('');
      const res = await api.post('/reports', {
        title: `MoneyTrace Risk Audit Report — ${new Date().toLocaleDateString('en-IN')}`,
      });
      setReports((prev) => [res.data, ...prev]);
      setActiveReport(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report from history?')) return;
    try {
      await api.delete(`/reports/${reportId}`);
      setReports((prev) => prev.filter((r) => r._id !== reportId));
      if (activeReport?._id === reportId) {
        setActiveReport(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete report');
    }
  };

  const downloadPDF = async () => {
    if (!reportPrintRef.current) return;
    try {
      setExportingPdf(true);
      const canvas = await html2canvas(reportPrintRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MoneyTrace_Audit_Report_${activeReport?._id?.substring(0, 8)}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      // Fallback to browser print dialog
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Audit & Risk Reports
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              PDF Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate printable, exportable audit packages summarizing transaction risk trails and AI explanations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Sparkles}
          isLoading={generating}
          onClick={handleGenerateReport}
        >
          Generate Risk Report
        </Button>
      </div>

      {error && (
        <Alert type="error" title="Report Action Failed">
          {error}
        </Alert>
      )}

      {/* Reports History Table */}
      <Card title="Generated Report History" subtitle="Archived risk analysis records">
        {loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-12" count={3} />
          </div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-3">Report Title</th>
                  <th className="py-3 px-3">Date Created</th>
                  <th className="py-3 px-3">Flagged Entries</th>
                  <th className="py-3 px-3">Risk Overview</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-600" />
                        <span>{rep.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {formatDateTime(rep.createdAt)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-[11px]">
                        {rep.flaggedTransactions?.length || 0} Flagged
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-emerald-700 font-semibold">
                          {rep.riskSummary?.normalCount || 0} Normal
                        </span>
                        <span>•</span>
                        <span className="text-amber-700 font-semibold">
                          {rep.riskSummary?.mediumRiskCount || 0} Med
                        </span>
                        <span>•</span>
                        <span className="text-red-700 font-semibold">
                          {rep.riskSummary?.highRiskCount || 0} High
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => setActiveReport(rep)}
                        >
                          View
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(rep._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No reports generated yet"
            description="Click 'Generate Risk Report' to produce an executive risk audit document."
            action={
              <Button size="sm" onClick={handleGenerateReport} isLoading={generating}>
                Generate First Report
              </Button>
            }
          />
        )}
      </Card>

      {/* Report View Modal with PDF download & Printable view */}
      {activeReport && (
        <Modal
          isOpen={!!activeReport}
          onClose={() => setActiveReport(null)}
          title={activeReport.title}
          subtitle={`Generated on ${formatDateTime(activeReport.createdAt)}`}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs text-slate-500 font-mono">
                Report ID: {activeReport._id}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Printer}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  isLoading={exportingPdf}
                  onClick={downloadPDF}
                >
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Printable Document Container */}
            <div
              ref={reportPrintRef}
              className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-6"
            >
              {/* Document Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-slate-900">
                      MONEYTRACE AI
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                      Audit Report
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 italic">
                    "Understand where your money comes from and where it goes."
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <p className="font-semibold text-slate-900">Personal Financial Intelligence</p>
                  <p>Date: {formatDate(activeReport.createdAt)}</p>
                </div>
              </div>

              {/* Mandatory Compliance Disclaimer */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                <strong>Compliance Disclaimer:</strong> {activeReport.disclaimer}
              </div>

              {/* Transaction Summary Section */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3">
                  1. Ledger Financial Overview
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase">Total Credits</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(activeReport.transactionSummary?.totalIn)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase">Total Debits</span>
                    <span className="text-sm font-bold text-slate-800">
                      {formatCurrency(activeReport.transactionSummary?.totalOut)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase">Net Variance</span>
                    <span className="text-sm font-bold text-brand-700">
                      {formatCurrency(activeReport.transactionSummary?.netBalance)}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase">Transactions</span>
                    <span className="text-sm font-bold text-slate-900">
                      {activeReport.transactionSummary?.totalTransactions}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Distribution Breakdown */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3">
                  2. Risk Distribution & Anomaly Scoring
                </h4>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                    Normal: {activeReport.riskSummary?.normalCount || 0}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                    Low Risk: {activeReport.riskSummary?.lowRiskCount || 0}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-800 font-semibold border border-yellow-200">
                    Needs Review: {activeReport.riskSummary?.needsReviewCount || 0}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                    Medium Risk: {activeReport.riskSummary?.mediumRiskCount || 0}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-800 font-semibold border border-red-200">
                    High Risk: {activeReport.riskSummary?.highRiskCount || 0}
                  </span>
                </div>
              </div>

              {/* Flagged Transactions Table */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3">
                  3. Monitored Flagged Transactions
                </h4>
                {activeReport.flaggedTransactions?.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-500">
                        <tr>
                          <th className="py-2 px-3">ID</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3">Risk Score</th>
                          <th className="py-2 px-3">Primary Indicator Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeReport.flaggedTransactions.map((ft, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-mono font-bold">{ft.transactionId}</td>
                            <td className="py-2 px-3">{formatDate(ft.date)}</td>
                            <td className="py-2 px-3 font-mono font-bold">
                              {formatCurrency(ft.amount)}
                            </td>
                            <td className="py-2 px-3">
                              <RiskBadge level={ft.riskLevel} score={ft.riskScore} size="sm" />
                            </td>
                            <td className="py-2 px-3 text-slate-600 max-w-xs">{ft.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No transactions flagged for review.</p>
                )}
              </div>

              {/* AI Narrative Explanations */}
              <div>
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 mb-3">
                  4. Automated AI Narrative Analysis
                </h4>
                <div className="space-y-3">
                  {activeReport.aiExplanations?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <h5 className="font-bold text-slate-900 mb-1">{item.title}</h5>
                      <p className="text-slate-700 leading-relaxed text-[11px]">{item.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
