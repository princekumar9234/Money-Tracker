import { Transaction } from '../models/transaction.model.js';
import { Analysis } from '../models/analysis.model.js';
import { Chat } from '../models/chat.model.js';
import { analysisService } from './analysis.service.js';

// AML / Transaction Monitoring Knowledge Base for RAG queries
const AML_KNOWLEDGE_BASE = [
  {
    topic: 'Suspicious Transaction Definition',
    keywords: ['suspicious', 'what is', 'flagged', 'why flagged', 'indicator'],
    answer:
      'In financial monitoring, a suspicious transaction is one that gives rise to a reasonable ground of suspicion that it may involve proceeds of an offense or appears to have no economic rationale or bonafide purpose. MoneyTrace AI evaluates statistical pattern deviations, rapid fund movement, and structuring indicators. Note that a flagged indicator is purely a risk alert for human review and does not constitute a legal conclusion or determination of wrongdoing.',
  },
  {
    topic: 'Rapid Fund Movement (Pass-through Velocity)',
    keywords: ['rapid fund', 'rapid movement', 'pass-through', 'velocity', 'conduit'],
    answer:
      'Rapid fund movement refers to an operational pattern where significant funds are received into an account and almost immediately (within minutes to a few hours) dispersed across one or more different recipients. While legitimate commercial clearing often exhibits velocity, financial intelligence systems flag this pattern because it resembles pass-through or conduit behavior where an account is used solely as a transit hub rather than for end-user commerce.',
  },
  {
    topic: 'Structuring and Smurfing Patterns',
    keywords: ['structuring', 'smurfing', 'threshold', '50000', 'split', 'tranches'],
    answer:
      'Structuring (colloquially called smurfing) is the practice of breaking down a large sum of money into multiple smaller transactions to remain beneath statutory reporting thresholds (such as the standard ₹50,000 regulatory benchmark in India). Detection algorithms evaluate repetitive transfers of similar values within 24–48 hours.',
  },
  {
    topic: 'Transaction Monitoring vs Legal Black Money Determinations',
    keywords: ['black money', 'white money', 'legal', 'law', 'crime', 'tax'],
    answer:
      'MoneyTrace AI is an analytical risk-identification tool. Under established financial regulatory principles, automated software cannot determine whether funds are legally legitimate or illegitimate. The platform uses risk tiers (Normal, Low Risk, Medium Risk, High Risk, Needs Review) to assist compliance officers, accountants, and individuals in auditing ledger trails.',
  },
];

class AiService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || null;
  }

  /**
   * Main conversational interface for MoneyTrace Agent
   */
  async processUserQuery(userId, userMessage) {
    const trimmed = userMessage.trim();

    // 1. Fetch user transactions to ground the answer in factual data
    const userTxns = await Transaction.find({ userId }).sort({ date: -1 });

    // 2. Check knowledge base matches first (RAG)
    const kbMatch = this.checkKnowledgeBase(trimmed);

    // 3. Process intent against database
    const intentResult = await this.resolveIntent(userId, trimmed, userTxns);

    // If external LLM key is configured, optionally format and augment with LLM
    let finalContent = '';
    let metadata = {
      groundedInDb: true,
      transactionCount: userTxns.length,
      matchedTransactions: intentResult.matchedTransactions || [],
    };

    if (this.apiKey) {
      try {
        finalContent = await this.callExternalLLM(trimmed, userTxns, kbMatch, intentResult);
      } catch (err) {
        console.warn(`[AiService] External LLM error, using intelligent engine: ${err.message}`);
        finalContent = intentResult.response;
      }
    } else {
      finalContent = intentResult.response;
      if (kbMatch && !intentResult.hasSpecificTxnMatch) {
        finalContent = `${kbMatch}\n\n---\n*Based on your account:* You currently have ${userTxns.length} transactions imported. Ask me to trace any specific transaction ID or search for unusual transfers.`;
      }
    }

    // Append standard disclaimer if discussing risk
    if (/risk|flagged|suspicious|trace|black|white|illegal/i.test(trimmed + finalContent)) {
      finalContent += '\n\n*Disclaimer: Based on available transaction data. This analysis indicates risk patterns only and does not establish that funds are illegal or constitute black money.*';
    }

    // Persist conversation
    let chat = await Chat.findOne({ userId });
    if (!chat) {
      chat = new Chat({ userId, messages: [] });
    }
    chat.messages.push({ role: 'user', content: trimmed });
    chat.messages.push({
      role: 'assistant',
      content: finalContent,
      metadata,
    });
    // Keep max 50 recent messages
    if (chat.messages.length > 50) {
      chat.messages = chat.messages.slice(-50);
    }
    await chat.save();

    return {
      message: finalContent,
      metadata,
    };
  }

  checkKnowledgeBase(query) {
    const qLower = query.toLowerCase();
    for (const item of AML_KNOWLEDGE_BASE) {
      if (item.keywords.some((kw) => qLower.includes(kw))) {
        return `**${item.topic}**\n\n${item.answer}`;
      }
    }
    return null;
  }

  async resolveIntent(userId, query, userTxns) {
    const q = query.toLowerCase();

    // Check for specific Transaction ID (e.g. TXN1020, TXN-1021, etc.)
    const txnMatch = query.match(/TXN[-_]?\d+/i);
    if (txnMatch) {
      const txnId = txnMatch[0].toUpperCase().replace(/[-_]/, '');
      const txn = userTxns.find((t) => t.transactionId.toUpperCase().replace(/[-_]/, '') === txnId);
      if (txn) {
        const analysis = await analysisService.getAnalysisByTransactionId(userId, txn.transactionId);
        return {
          hasSpecificTxnMatch: true,
          matchedTransactions: [txn.transactionId],
          response: `**Transaction ${txn.transactionId} Analysis**
- **Date:** ${new Date(txn.date).toLocaleDateString()}
- **Amount:** ₹${txn.amount.toLocaleString('en-IN')} (${txn.type.toUpperCase()})
- **Party:** ${txn.type === 'credit' ? `From: ${txn.sender}` : `To: ${txn.receiver}`}
- **Risk Assessment:** ${analysis.riskLevel} (${analysis.riskScore}/100)

**Detected Risk Indicators:**
${analysis.indicators.map((ind) => `• ${ind}`).join('\n')}

**Reasoning:**
${analysis.explanation}

${
  analysis.relatedTransactions && analysis.relatedTransactions.length > 0
    ? `**Related Transactions in Trail:**\n${analysis.relatedTransactions.map((r) => `• ${r.transactionId}: ₹${r.amount?.toLocaleString('en-IN')} (${r.relationReason || 'Linked transfer'})`).join('\n')}`
    : 'No linked rapid transfers detected within 48 hours.'
}`,
        };
      } else {
        return {
          hasSpecificTxnMatch: false,
          response: `Based on your available records, transaction ID **${txnMatch[0]}** was not found in your imported statements. Please verify the ID or check the Transactions table.`,
        };
      }
    }

    // Check for "where did this money go / come from / trace"
    if (q.includes('where did') || q.includes('trace') || q.includes('flow')) {
      const flagged = userTxns.filter((t) => t.riskLevel === 'High Risk' || t.riskLevel === 'Medium Risk');
      if (flagged.length > 0) {
        const sample = flagged[0];
        return {
          hasSpecificTxnMatch: true,
          matchedTransactions: flagged.map((t) => t.transactionId),
          response: `Based on available transaction data, here is the money trail summary:
• We observed active movement centered on **${sample.transactionId}** (₹${sample.amount.toLocaleString('en-IN')}).
• Use the **"Trace Money Flow"** visualizer in the sidebar to view the interactive multi-hop graph of accounts and intermediaries.
• High-risk trails show funds transitioning through counterparties such as *${sample.sender}* and *${sample.receiver}*.`,
        };
      }
    }

    // Check for "unusual", "flagged", "high risk", "suspicious"
    if (q.includes('unusual') || q.includes('flagged') || q.includes('high risk') || q.includes('suspicious')) {
      const flagged = userTxns.filter((t) => t.riskLevel === 'High Risk' || t.riskLevel === 'Medium Risk' || t.riskLevel === 'Needs Review');
      if (flagged.length === 0) {
        return {
          hasSpecificTxnMatch: false,
          response: 'Based on your available transaction records, no transactions currently display high or medium suspicious indicators. All transactions are within normal expected parameters.',
        };
      }

      const list = flagged
        .slice(0, 5)
        .map(
          (t) =>
            `• **${t.transactionId}**: ₹${t.amount.toLocaleString('en-IN')} (${t.type}) — *${t.riskLevel} (${t.riskScore}/100)*\n  Reason: ${t.indicators?.[0] || 'Pattern anomaly'}`
        )
        .join('\n');

      return {
        hasSpecificTxnMatch: true,
        matchedTransactions: flagged.map((t) => t.transactionId),
        response: `**Identified Transactions with Risk Indicators (${flagged.length} found):**\n\n${list}\n\nSelect any transaction to run an in-depth audit trail analysis.`,
      };
    }

    // Check for "summary", "summarize", "how much"
    if (q.includes('summary') || q.includes('summarize') || q.includes('spending') || q.includes('income')) {
      const totalIn = userTxns.filter((t) => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
      const totalOut = userTxns.filter((t) => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
      const net = totalIn - totalOut;
      const flaggedCount = userTxns.filter((t) => t.riskLevel === 'High Risk' || t.riskLevel === 'Medium Risk').length;

      return {
        hasSpecificTxnMatch: false,
        response: `**Financial Statement Summary:**
• **Total Inflow (Credits):** ₹${totalIn.toLocaleString('en-IN')}
• **Total Outflow (Debits):** ₹${totalOut.toLocaleString('en-IN')}
• **Net Position:** ${net >= 0 ? '+' : '-'}₹${Math.abs(net).toLocaleString('en-IN')}
• **Total Transactions Processed:** ${userTxns.length}
• **Transactions Flagged for Review:** ${flaggedCount}

You can generate a full downloadable PDF audit report from the **Reports** section.`,
      };
    }

    // General query response
    return {
      hasSpecificTxnMatch: false,
      response: `I am the **MoneyTrace AI Agent**. Based on your ${userTxns.length} imported transaction records, I can help you:
1. **Analyze a specific transaction:** e.g. "Analyze TXN1020" or "Why was TXN1021 flagged?"
2. **Find anomalies:** "Show all high-risk transactions"
3. **Trace movement:** "Where did the funds in TXN1020 go?"
4. **Financial summary:** "Summarize my total income and expenses"
5. **AML Education:** "What is rapid fund movement?" or "What is structuring?"`,
    };
  }

  async callExternalLLM(userPrompt, txns, kbMatch, localIntent) {
    // Modular placeholder: when AI_API_KEY is configured with OpenAI/Gemini/Anthropic
    return localIntent.response;
  }

  async getChatHistory(userId) {
    const chat = await Chat.findOne({ userId });
    return chat ? chat.messages : [];
  }

  async clearChatHistory(userId) {
    await Chat.findOneAndUpdate({ userId }, { messages: [] }, { upsert: true });
    return { message: 'Chat history cleared successfully.' };
  }

  async generateFinancialSummary(userId) {
    const txns = await Transaction.find({ userId }).sort({ date: -1 });

    const totalIn = txns.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalOut = txns.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const net = totalIn - totalOut;

    const highRisk = txns.filter((t) => t.riskLevel === 'High Risk');
    const medRisk = txns.filter((t) => t.riskLevel === 'Medium Risk');
    const needsReview = txns.filter((t) => t.riskLevel === 'Needs Review');
    const normal = txns.filter((t) => t.riskLevel === 'Normal' || t.riskLevel === 'Low Risk');

    const largestTxn = [...txns].sort((a, b) => b.amount - a.amount)[0] || null;

    return {
      totalTransactions: txns.length,
      totalIn,
      totalOut,
      netBalance: net,
      riskCounts: {
        normal: normal.length,
        needsReview: needsReview.length,
        mediumRisk: medRisk.length,
        highRisk: highRisk.length,
      },
      largestTransaction: largestTxn,
      aiSummaryText: `Based on your ${txns.length} recorded transactions, you have received ₹${totalIn.toLocaleString('en-IN')} and spent/transferred ₹${totalOut.toLocaleString('en-IN')}. ${highRisk.length + medRisk.length} transaction(s) display risk indicators that warrant review.`,
      disclaimer: 'This summary reflects imported ledger records only. It is not a tax or legal certification.',
    };
  }
}

export const aiService = new AiService();
