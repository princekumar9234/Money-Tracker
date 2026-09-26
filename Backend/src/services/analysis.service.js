import { Transaction } from '../models/transaction.model.js';
import { Analysis } from '../models/analysis.model.js';
import { ApiError } from '../utils/apiError.js';

class AnalysisService {
  /**
   * Run risk analysis on a single transaction for a user
   */
  async analyzeTransaction(userId, transactionId) {
    const txn = await Transaction.findOne({ userId, transactionId });
    if (!txn) {
      throw ApiError.notFound(`Transaction ${transactionId} not found`);
    }

    // Retrieve surrounding transactions for context (window around this txn date)
    const allUserTxns = await Transaction.find({ userId }).sort({ date: 1 });

    const analysisResult = this.evaluateRiskRules(txn, allUserTxns);

    // Save or update Analysis model
    const savedAnalysis = await Analysis.findOneAndUpdate(
      { userId, transactionId },
      {
        userId,
        transactionId,
        riskScore: analysisResult.riskScore,
        riskLevel: analysisResult.riskLevel,
        indicators: analysisResult.indicators,
        explanation: analysisResult.explanation,
        disclaimer: 'This analysis indicates risk patterns only and does not establish that funds are illegal or constitute black money.',
        relatedTransactions: analysisResult.relatedTransactions,
        moneyFlowTrail: analysisResult.moneyFlowTrail,
      },
      { upsert: true, new: true }
    );

    // Also update transaction model risk attributes
    txn.riskScore = analysisResult.riskScore;
    txn.riskLevel = analysisResult.riskLevel;
    txn.indicators = analysisResult.indicators;
    txn.isFlagged = analysisResult.riskScore >= 50;
    await txn.save();

    return savedAnalysis;
  }

  /**
   * Evaluate algorithmic AML & risk rules against transaction dataset
   */
  evaluateRiskRules(currentTxn, allTxns) {
    const indicators = [];
    const relatedTransactions = [];
    let score = 5; // Base normal score

    const amounts = allTxns.map((t) => t.amount).filter((a) => a > 0);
    const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : currentTxn.amount;
    const isVeryHighValue = currentTxn.amount >= 200000;
    const isHighValue = currentTxn.amount >= 75000;

    // Rule 1: High value anomaly
    if (currentTxn.amount > avgAmount * 3 && currentTxn.amount >= 50000) {
      score += 25;
      indicators.push(
        `Unusually high amount: ₹${currentTxn.amount.toLocaleString('en-IN')} is ${(currentTxn.amount / avgAmount).toFixed(1)}x greater than historic average (₹${Math.round(avgAmount).toLocaleString('en-IN')})`
      );
    } else if (isVeryHighValue) {
      score += 20;
      indicators.push(`High single-transfer amount: ₹${currentTxn.amount.toLocaleString('en-IN')} exceeds standard velocity thresholds`);
    }

    // Rule 2: Rapid fund movement (credit followed by debit or vice versa within 3 hours)
    const currentDate = new Date(currentTxn.date).getTime();
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    const nearbyTxns = allTxns.filter((t) => {
      if (t.transactionId === currentTxn.transactionId) return false;
      const diff = Math.abs(new Date(t.date).getTime() - currentDate);
      return diff <= THREE_HOURS_MS;
    });

    const isCredit = currentTxn.type === 'credit';
    const complementaryType = isCredit ? 'debit' : 'credit';

    const rapidCounterparts = nearbyTxns.filter((t) => t.type === complementaryType);

    if (rapidCounterparts.length > 0) {
      const sumCounterparts = rapidCounterparts.reduce((sum, t) => sum + t.amount, 0);
      const ratio = currentTxn.amount > 0 ? Math.min(sumCounterparts / currentTxn.amount, currentTxn.amount / sumCounterparts) : 0;

      if (ratio > 0.6) {
        score += 35;
        indicators.push(
          `Rapid fund movement: ${isCredit ? 'Incoming deposit' : 'Outgoing debit'} of ₹${currentTxn.amount.toLocaleString('en-IN')} was closely matched by ${rapidCounterparts.length} opposing transfer(s) totaling ₹${sumCounterparts.toLocaleString('en-IN')} within 3 hours.`
        );
        rapidCounterparts.forEach((rt) => {
          relatedTransactions.push({
            transactionId: rt.transactionId,
            date: rt.date,
            amount: rt.amount,
            type: rt.type,
            sender: rt.sender,
            receiver: rt.receiver,
            relationReason: 'Rapid counterpart transfer occurring within 3-hour window',
          });
        });
      }
    }

    // Rule 3: Repeated transfers / Structuring indicators (transfers just under ₹50,000 or same amounts)
    const sameAmountTxns = allTxns.filter((t) => {
      if (t.transactionId === currentTxn.transactionId) return false;
      const diff = Math.abs(new Date(t.date).getTime() - currentDate);
      return diff <= ONE_DAY_MS && Math.abs(t.amount - currentTxn.amount) < 100;
    });

    if (sameAmountTxns.length >= 1) {
      score += 20;
      indicators.push(
        `Multiple identical or near-identical transfers detected: ${sameAmountTxns.length + 1} transactions of approx ₹${currentTxn.amount.toLocaleString('en-IN')} within 24 hours.`
      );
      sameAmountTxns.forEach((st) => {
        if (!relatedTransactions.some((r) => r.transactionId === st.transactionId)) {
          relatedTransactions.push({
            transactionId: st.transactionId,
            date: st.date,
            amount: st.amount,
            type: st.type,
            sender: st.sender,
            receiver: st.receiver,
            relationReason: 'Near-identical amount within same 24-hour window',
          });
        }
      });
    }

    // Rule 4: Structuring threshold check (₹45,000 - ₹49,999)
    if (currentTxn.amount >= 45000 && currentTxn.amount < 50000) {
      score += 15;
      indicators.push(`Amount (₹${currentTxn.amount.toLocaleString('en-IN')}) is positioned just beneath standard statutory cash/reporting thresholds (₹50,000).`);
    }

    // Rule 5: Unusual timing (1:00 AM to 4:30 AM)
    const hour = new Date(currentTxn.date).getHours();
    if (hour >= 1 && hour <= 4) {
      score += 15;
      indicators.push(`Unusual transaction timing: executed at ${hour.toString().padStart(2, '0')}:${new Date(currentTxn.date).getMinutes().toString().padStart(2, '0')} outside normal business hours.`);
    }

    // Rule 6: Unusual concentration of cash withdrawals / unverified entities
    if (currentTxn.paymentMode === 'CASH' && currentTxn.amount >= 20000) {
      score += 15;
      indicators.push('High-value cash transaction, which limits traceable digital audit trails.');
    }

    // Clamp score
    score = Math.min(Math.max(score, 5), 98);

    // Determine Risk Level
    let riskLevel = 'Normal';
    if (score >= 75) {
      riskLevel = 'High Risk';
    } else if (score >= 55) {
      riskLevel = 'Medium Risk';
    } else if (score >= 40) {
      riskLevel = 'Needs Review';
    } else if (score >= 20) {
      riskLevel = 'Low Risk';
    } else {
      riskLevel = 'Normal';
    }

    // Generate human-readable explanation
    let explanation = '';
    if (riskLevel === 'High Risk') {
      explanation = `Based on the available transaction data, transaction ${currentTxn.transactionId} was flagged with High Risk (${score}/100) because the transaction value (₹${currentTxn.amount.toLocaleString('en-IN')}) exhibits atypical velocity patterns, including rapid subsequent/preceding fund movement and high deviation from historical baseline transactions.`;
    } else if (riskLevel === 'Medium Risk') {
      explanation = `Based on the available transaction data, transaction ${currentTxn.transactionId} has been designated as Medium Risk (${score}/100). The transaction presents notable pattern anomalies, such as repetitive tranches or values clustering near reporting thresholds, warranting financial verification.`;
    } else if (riskLevel === 'Needs Review') {
      explanation = `Transaction ${currentTxn.transactionId} contains indicators that may warrant review (${score}/100), such as unusual execution timing or deviation from standard merchant categories.`;
    } else if (riskLevel === 'Low Risk') {
      explanation = `Transaction ${currentTxn.transactionId} demonstrates minor variance (${score}/100) but generally aligns with acceptable peer transfer and merchant patterns.`;
    } else {
      explanation = `Transaction ${currentTxn.transactionId} appears completely consistent with standard financial activity (${score}/100). No irregular velocity or structuring indicators were detected.`;
    }

    // Build flow trail graph nodes & edges
    const nodes = [
      { id: 'source', label: currentTxn.sender || 'Sender', type: 'source', role: 'Originator' },
      { id: 'target', label: currentTxn.receiver || 'Recipient', type: 'target', role: 'Beneficiary' },
    ];
    const edges = [
      {
        source: 'source',
        target: 'target',
        amount: currentTxn.amount,
        date: currentTxn.date,
        transactionId: currentTxn.transactionId,
        label: `₹${currentTxn.amount.toLocaleString('en-IN')}`,
      },
    ];

    relatedTransactions.forEach((rt, idx) => {
      const relatedId = `rel_${idx + 1}`;
      const isOutgoingFromSelf = rt.type === 'debit';
      const label = isOutgoingFromSelf ? (rt.receiver || 'Downstream Beneficiary') : (rt.sender || 'Upstream Sender');
      nodes.push({
        id: relatedId,
        label,
        type: isOutgoingFromSelf ? 'destination' : 'source',
        role: isOutgoingFromSelf ? 'Outbound Destination' : 'Inbound Source',
      });
      if (isOutgoingFromSelf) {
        edges.push({
          source: 'target',
          target: relatedId,
          amount: rt.amount,
          date: rt.date,
          transactionId: rt.transactionId,
          label: `₹${rt.amount.toLocaleString('en-IN')}`,
        });
      } else {
        edges.push({
          source: relatedId,
          target: 'source',
          amount: rt.amount,
          date: rt.date,
          transactionId: rt.transactionId,
          label: `₹${rt.amount.toLocaleString('en-IN')}`,
        });
      }
    });

    return {
      riskScore: score,
      riskLevel,
      indicators: indicators.length > 0 ? indicators : ['Standard transaction parameters', 'Consistent with typical account profile'],
      explanation,
      relatedTransactions,
      moneyFlowTrail: { nodes, edges },
    };
  }

  async getRiskyTransactions(userId) {
    const transactions = await Transaction.find({
      userId,
      riskLevel: { $in: ['High Risk', 'Medium Risk', 'Needs Review'] },
    }).sort({ riskScore: -1, date: -1 });

    return transactions;
  }

  async getAnalysisByTransactionId(userId, transactionId) {
    let analysis = await Analysis.findOne({ userId, transactionId });
    if (!analysis) {
      // Run analysis on the fly
      analysis = await this.analyzeTransaction(userId, transactionId);
    }
    return analysis;
  }
}

export const analysisService = new AnalysisService();
