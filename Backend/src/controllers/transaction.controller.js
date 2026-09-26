import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';
import { transactionService } from '../services/transaction.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

// Helper to normalize column names from any bank statement format
export const normalizeRow = (rawRow) => {
  const row = {};
  for (const key of Object.keys(rawRow)) {
    row[key.toLowerCase().trim().replace(/[^a-z0-9]/g, '')] = rawRow[key];
  }

  // Find Date column
  const dateKey = Object.keys(row).find((k) =>
    ['date', 'txndate', 'transactiondate', 'valuedate', 'postdate', 'bookingdate'].includes(k)
  );
  const rawDate = dateKey ? row[dateKey] : rawRow.date || rawRow.Date;

  // Find Description / Narration
  const descKey = Object.keys(row).find((k) =>
    ['description', 'narration', 'particulars', 'remarks', 'details', 'transactionremarks'].includes(k)
  );
  const description = descKey ? row[descKey] : rawRow.description || rawRow.Description || 'Bank Transaction';

  // Find Debit
  const debitKey = Object.keys(row).find((k) =>
    ['debit', 'debitamount', 'dr', 'withdrawal', 'withdrawalamount', 'spent'].includes(k)
  );
  const debitVal = debitKey && row[debitKey] !== '' && row[debitKey] !== undefined ? Math.abs(parseFloat(String(row[debitKey]).replace(/,/g, ''))) : 0;

  // Find Credit
  const creditKey = Object.keys(row).find((k) =>
    ['credit', 'creditamount', 'cr', 'deposit', 'depositamount', 'received'].includes(k)
  );
  const creditVal = creditKey && row[creditKey] !== '' && row[creditKey] !== undefined ? Math.abs(parseFloat(String(row[creditKey]).replace(/,/g, ''))) : 0;

  // Find generic Amount
  const amountKey = Object.keys(row).find((k) => ['amount', 'txnamount', 'total'].includes(k));
  let amount = 0;
  if (!isNaN(debitVal) && debitVal > 0) amount = debitVal;
  else if (!isNaN(creditVal) && creditVal > 0) amount = creditVal;
  else if (amountKey && row[amountKey]) {
    amount = Math.abs(parseFloat(String(row[amountKey]).replace(/,/g, '')));
  }

  // Determine Type
  let type = 'debit';
  const typeKey = Object.keys(row).find((k) => ['type', 'txntype', 'drcr'].includes(k));
  if (typeKey && row[typeKey]) {
    const val = String(row[typeKey]).toLowerCase();
    if (val.includes('cr') || val.includes('credit') || val.includes('deposit')) type = 'credit';
    else type = 'debit';
  } else if (creditVal > 0 && debitVal === 0) {
    type = 'credit';
  }

  // Find Balance
  const balKey = Object.keys(row).find((k) => ['balance', 'closingbalance', 'runningbalance', 'availbal'].includes(k));
  const balance = balKey && row[balKey] ? parseFloat(String(row[balKey]).replace(/,/g, '')) : 0;

  // Find Reference No / UTR / Cheque
  const refKey = Object.keys(row).find((k) => ['referencenumber', 'refno', 'utr', 'chequeno', 'chqno', 'txnid'].includes(k));
  const referenceNumber = refKey && row[refKey] ? String(row[refKey]).trim() : '';

  // Find Payment Mode
  let paymentMode = 'TRANSFER';
  const descStr = String(description).toUpperCase();
  if (descStr.includes('UPI')) paymentMode = 'UPI';
  else if (descStr.includes('NEFT')) paymentMode = 'NEFT';
  else if (descStr.includes('IMPS')) paymentMode = 'IMPS';
  else if (descStr.includes('RTGS')) paymentMode = 'RTGS';
  else if (descStr.includes('ATM') || descStr.includes('CASH')) paymentMode = 'CASH';
  else if (descStr.includes('POS') || descStr.includes('CARD')) paymentMode = 'CARD';

  return {
    date: rawDate || new Date().toISOString().split('T')[0],
    description: String(description).trim(),
    amount: !isNaN(amount) && amount > 0 ? amount : 0,
    type,
    debit: type === 'debit' ? (debitVal || amount) : 0,
    credit: type === 'credit' ? (creditVal || amount) : 0,
    balance: !isNaN(balance) ? balance : 0,
    paymentMode,
    sender: type === 'credit' ? String(description).split(/[-/:]/)[0]?.trim() || 'Counterparty' : 'Self / Account Holder',
    receiver: type === 'debit' ? String(description).split(/[-/:]/)[0]?.trim() || 'Counterparty' : 'Self / Account Holder',
    referenceNumber,
  };
};

export const parseUploadedFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No statement file was uploaded.');
    }

    const { mimetype, originalname, buffer } = req.file;
    const fileExt = originalname.split('.').pop().toLowerCase();
    let rawRows = [];

    if (fileExt === 'csv' || mimetype === 'text/csv') {
      const csvString = buffer.toString('utf-8');
      const parsed = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: 'greedy',
      });
      rawRows = parsed.data;
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rawRows = XLSX.utils.sheet_to_json(sheet);
    } else if (fileExt === 'pdf') {
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text || '';
      const lines = text.split('\n').filter((l) => l.trim().length > 0);

      // Intelligent regex line parsing for bank statement lines (Date, description, amounts)
      const dateRegex = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/;
      const amountRegex = /([\d,]+\.\d{2})/g;

      for (const line of lines) {
        const dateMatch = line.match(dateRegex);
        const amounts = line.match(amountRegex);
        if (dateMatch && amounts && amounts.length >= 1) {
          const date = dateMatch[0];
          const cleanAmounts = amounts.map((a) => parseFloat(a.replace(/,/g, '')));
          const desc = line.replace(dateRegex, '').replace(amountRegex, '').trim();

          rawRows.push({
            date,
            description: desc || 'Bank Statement Entry',
            amount: cleanAmounts[0],
            debit: amounts.length > 1 ? cleanAmounts[0] : 0,
            credit: amounts.length > 2 ? cleanAmounts[1] : 0,
            balance: cleanAmounts[cleanAmounts.length - 1] || 0,
          });
        }
      }
    } else {
      throw ApiError.badRequest(`Unsupported file format .${fileExt}. Please upload CSV, XLSX, or PDF.`);
    }

    if (!rawRows || rawRows.length === 0) {
      throw ApiError.badRequest('Could not extract any rows from the uploaded statement.');
    }

    // Normalize and preview
    const normalizedRows = rawRows
      .map((r, idx) => ({ ...normalizeRow(r), previewId: `row_${idx + 1}` }))
      .filter((r) => r.amount > 0);

    return ApiResponse.success(res, 'File parsed successfully for preview', {
      fileName: originalname,
      totalRowsDetected: rawRows.length,
      validRows: normalizedRows.length,
      preview: normalizedRows,
    });
  } catch (error) {
    next(error);
  }
};

export const importTransactions = async (req, res, next) => {
  try {
    const { transactions, source } = req.body;
    const result = await transactionService.importTransactions(req.user._id, transactions, source);
    return ApiResponse.created(res, `Successfully imported ${result.importedCount} transactions.`, result);
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactions(req.user._id, req.query);
    return ApiResponse.success(res, 'Transactions fetched successfully', result.transactions, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactionById(req.user._id, req.params.id);
    return ApiResponse.success(res, 'Transaction details retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const result = await transactionService.deleteTransaction(req.user._id, req.params.id);
    return ApiResponse.success(res, result.message);
  } catch (error) {
    next(error);
  }
};

export const seedDemoTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.seedDemoData(req.user._id);
    return ApiResponse.success(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const clearAllTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.clearAllTransactions(req.user._id);
    return ApiResponse.success(res, result.message);
  } catch (error) {
    next(error);
  }
};
