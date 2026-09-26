import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { Button } from '../../../components/common/Button';
import { Card } from '../../../components/common/Card';
import { Alert } from '../../../components/common/LayoutComponents';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCheck,
  Trash2,
  CheckCircle,
  Download,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const UploadStatementPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [parseMeta, setParseMeta] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setPreviewData(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setPreviewData(null);
    }
  };

  const handleParse = async () => {
    if (!selectedFile) {
      setError('Please select a CSV, Excel, or PDF bank statement file.');
      return;
    }

    try {
      setParsing(true);
      setError('');

      const formData = new FormData();
      formData.append('statement', selectedFile);

      const res = await api.post('/transactions/upload-parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPreviewData(res.data.preview || []);
      setParseMeta({
        fileName: res.data.fileName,
        totalRowsDetected: res.data.totalRowsDetected,
        validRows: res.data.validRows,
      });
    } catch (err) {
      setError(err.message || 'Failed to parse uploaded statement. Check format.');
    } finally {
      setParsing(false);
    }
  };

  const handleRemoveRow = (previewId) => {
    setPreviewData((prev) => prev.filter((r) => r.previewId !== previewId));
  };

  const handleConfirmImport = async () => {
    if (!previewData || previewData.length === 0) {
      setError('No valid rows available to import.');
      return;
    }

    try {
      setImporting(true);
      setError('');

      const res = await api.post('/transactions/import', {
        transactions: previewData,
        source: selectedFile?.name.split('.').pop() || 'upload',
      });

      setSuccessMsg(`Successfully imported ${res.data.importedCount} transactions! Redirecting to analysis...`);
      setTimeout(() => {
        navigate('/transactions');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Import failed. Please check rows.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Upload Bank Statement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Parse CSV, Excel (.xlsx), or PDF statements with intelligent column mapping and risk pre-screening.
          </p>
        </div>

        <a
          href="/sample_statement.csv"
          download="sample_bank_statement.csv"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-subtle"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Download Sample CSV</span>
        </a>
      </div>

      {error && (
        <Alert type="error" title="Processing Error">
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert type="success" title="Import Completed">
          {successMsg}
        </Alert>
      )}

      {/* Upload Drop Zone Card */}
      {!previewData && (
        <Card>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-8 sm:p-12 text-center transition-colors bg-slate-50/50 hover:bg-brand-50/20 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls,.pdf"
              className="hidden"
            />

            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-base font-semibold text-slate-900">
              {selectedFile ? selectedFile.name : 'Choose or drag & drop bank statement'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Supported formats: <strong>CSV, Excel (.xlsx / .xls), PDF</strong>. Statements are processed strictly in your local session and encrypted in your database.
            </p>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel / CSV
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-rose-600" /> Bank PDF
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-blue-600" /> Auto Normalizer
              </span>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-5 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-brand-600 text-white flex items-center justify-center font-bold">
                  {selectedFile.name.split('.').pop()?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{selectedFile.name}</p>
                  <p className="text-slate-400 font-mono text-[11px]">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={parsing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleParse();
                  }}
                >
                  Analyze & Preview Statement
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Statement Preview & Confirmation Section */}
      {previewData && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-card">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Statement Preview: {parseMeta?.fileName}
                </h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  {previewData.length} valid rows identified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review detected entries. Remove any erroneous rows before importing into ledger.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPreviewData(null);
                  setSelectedFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle}
                isLoading={importing}
                onClick={handleConfirmImport}
              >
                Import {previewData.length} Transactions
              </Button>
            </div>
          </div>

          {/* Interactive Preview Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider z-10">
                  <tr>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Description / Narration</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3 text-right">Debit (-)</th>
                    <th className="py-3 px-3 text-right">Credit (+)</th>
                    <th className="py-3 px-3 text-right">Balance</th>
                    <th className="py-3 px-3">Payment Mode</th>
                    <th className="py-3 px-3 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.map((row) => (
                    <tr key={row.previewId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {formatDate(row.date)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium max-w-sm truncate">
                        {row.description}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded ${
                            row.type === 'credit'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-red-600 font-medium whitespace-nowrap font-mono">
                        {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 font-medium whitespace-nowrap font-mono">
                        {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-mono whitespace-nowrap">
                        {row.balance > 0 ? formatCurrency(row.balance) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap uppercase text-[10px]">
                        {row.paymentMode}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.previewId)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Remove row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
