import { Transaction } from '../models/transaction.model.js';
import { Analysis } from '../models/analysis.model.js';
import { ApiError } from '../utils/apiError.js';
import { analysisService } from './analysis.service.js';
import { getDemoTransactions } from '../utils/demoData.js';

class TransactionService {
  /**
   * Import normalized transactions in batch
   */
  async importTransactions(userId, rawTransactions, source = 'import') {
    if (!Array.isArray(rawTransactions) || rawTransactions.length === 0) {
      throw ApiError.badRequest('No valid transactions provided for import.');
    }

    const imported = [];
    const errors = [];

    // Pre-fetch existing transactionIds for this user to avoid collisions
    const existingTxns = await Transaction.find({ userId }).select('transactionId');
    const existingIdSet = new Set(existingTxns.map((t) => t.transactionId.toUpperCase()));

    let idCounter = Date.now();

    for (let i = 0; i < rawTransactions.length; i++) {
      const raw = rawTransactions[i];
      try {
        let txnId = raw.transactionId ? String(raw.transactionId).trim() : `TXN${idCounter++}`;
        // Ensure uniqueness
        if (existingIdSet.has(txnId.toUpperCase())) {
          txnId = `${txnId}_${Math.floor(100 + Math.random() * 900)}`;
        }
        existingIdSet.add(txnId.toUpperCase());

        const parsedDate = new Date(raw.date);
        if (isNaN(parsedDate.getTime())) {
          throw new Error(`Row ${i + 1}: Invalid date`);
        }

        let amount = Number(raw.amount);
        let debit = Number(raw.debit || 0);
        let credit = Number(raw.credit || 0);
        let type = raw.type ? raw.type.toLowerCase() : '';

        if (!type) {
          if (debit > 0) {
            type = 'debit';
            amount = debit;
          } else if (credit > 0) {
            type = 'credit';
            amount = credit;
          } else {
            type = 'debit';
          }
        }

        if (isNaN(amount) || amount <= 0) {
          if (debit > 0) amount = debit;
          else if (credit > 0) amount = credit;
          else amount = 100;
        }

        const normalized = {
          userId,
          transactionId: txnId,
          date: parsedDate,
          description: String(raw.description || 'Transaction Transfer').trim(),
          amount,
          type: type === 'credit' ? 'credit' : 'debit',
          debit: type === 'debit' ? (debit || amount) : 0,
          credit: type === 'credit' ? (credit || amount) : 0,
          balance: Number(raw.balance) || 0,
          paymentMode: String(raw.paymentMode || 'TRANSFER').toUpperCase().trim(),
          sender: String(raw.sender || (type === 'credit' ? 'Counterparty' : 'Self / Account Holder')).trim(),
          receiver: String(raw.receiver || (type === 'debit' ? 'Counterparty' : 'Self / Account Holder')).trim(),
          referenceNumber: String(raw.referenceNumber || `REF${Math.floor(100000000 + Math.random() * 900000000)}`).trim(),
          riskScore: 0,
          riskLevel: 'Normal',
          indicators: [],
          isFlagged: false,
          source,
        };

        imported.push(normalized);
      } catch (err) {
        errors.push(err.message);
      }
    }

    if (imported.length === 0) {
      throw ApiError.badRequest('Failed to import any transactions.', errors);
    }

    const saved = await Transaction.insertMany(imported);

    // Run batch risk assessment on the user's transactions
    const allUserTxns = await Transaction.find({ userId }).sort({ date: 1 });
    for (const txn of saved) {
      try {
        const evalResult = analysisService.evaluateRiskRules(txn, allUserTxns);
        txn.riskScore = evalResult.riskScore;
        txn.riskLevel = evalResult.riskLevel;
        txn.indicators = evalResult.indicators;
        txn.isFlagged = evalResult.riskScore >= 50;
        await txn.save();

        await Analysis.findOneAndUpdate(
          { userId, transactionId: txn.transactionId },
          {
            userId,
            transactionId: txn.transactionId,
            riskScore: evalResult.riskScore,
            riskLevel: evalResult.riskLevel,
            indicators: evalResult.indicators,
            explanation: evalResult.explanation,
            relatedTransactions: evalResult.relatedTransactions,
            moneyFlowTrail: evalResult.moneyFlowTrail,
          },
          { upsert: true }
        );
      } catch (e) {
        console.warn(`[Analysis On Import] Warning for txn ${txn.transactionId}: ${e.message}`);
      }
    }

    return {
      importedCount: saved.length,
      errorsCount: errors.length,
      errors,
      transactions: saved,
    };
  }

  /**
   * Search, filter, paginate user transactions
   */
  async getTransactions(userId, query) {
    const {
      page = 1,
      limit = 20,
      search = '',
      type = '',
      riskLevel = '',
      minAmount = '',
      maxAmount = '',
      startDate = '',
      endDate = '',
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    const filter = { userId };

    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sender: { $regex: search, $options: 'i' } },
        { receiver: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (type && (type === 'credit' || type === 'debit')) {
      filter.type = type;
    }

    if (riskLevel && riskLevel !== 'all') {
      filter.riskLevel = riskLevel;
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort(sortOptions).skip(skip).limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    return {
      transactions,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async getTransactionById(userId, id) {
    const txn = await Transaction.findOne({ userId, _id: id });
    if (!txn) {
      throw ApiError.notFound('Transaction not found');
    }

    const analysis = await Analysis.findOne({ userId, transactionId: txn.transactionId });

    return {
      transaction: txn,
      analysis,
    };
  }

  async deleteTransaction(userId, id) {
    const txn = await Transaction.findOneAndDelete({ userId, _id: id });
    if (!txn) {
      throw ApiError.notFound('Transaction not found');
    }
    await Analysis.deleteOne({ userId, transactionId: txn.transactionId });
    return { message: 'Transaction deleted successfully.' };
  }

  /**
   * Seed realistic fictional demo dataset
   */
  async seedDemoData(userId) {
    // Clear previous demo transactions
    await Transaction.deleteMany({ userId, source: 'demo' });

    const demoTxns = getDemoTransactions(userId);
    const saved = await Transaction.insertMany(demoTxns);

    // Run analyses and save
    const allUserTxns = await Transaction.find({ userId }).sort({ date: 1 });
    for (const txn of saved) {
      const evalResult = analysisService.evaluateRiskRules(txn, allUserTxns);
      txn.riskScore = evalResult.riskScore;
      txn.riskLevel = evalResult.riskLevel;
      txn.indicators = evalResult.indicators;
      txn.isFlagged = evalResult.riskScore >= 50;
      await txn.save();

      await Analysis.findOneAndUpdate(
        { userId, transactionId: txn.transactionId },
        {
          userId,
          transactionId: txn.transactionId,
          riskScore: evalResult.riskScore,
          riskLevel: evalResult.riskLevel,
          indicators: evalResult.indicators,
          explanation: evalResult.explanation,
          relatedTransactions: evalResult.relatedTransactions,
          moneyFlowTrail: evalResult.moneyFlowTrail,
        },
        { upsert: true }
      );
    }

    return {
      count: saved.length,
      message: 'Demo transactions loaded successfully with realistic risk patterns and flow trails.',
    };
  }

  async clearAllTransactions(userId) {
    await Transaction.deleteMany({ userId });
    await Analysis.deleteMany({ userId });
    return { message: 'All transactions cleared successfully.' };
  }
}

export const transactionService = new TransactionService();
