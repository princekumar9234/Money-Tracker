import { Transaction } from '../models/transaction.model.js';
import { ApiError } from '../utils/apiError.js';

class TraceService {
  /**
   * Trace the money flow trail for a given transaction based ONLY on available user transaction records
   */
  async traceMoneyFlow(userId, transactionId) {
    const rootTxn = await Transaction.findOne({ userId, transactionId });
    if (!rootTxn) {
      throw ApiError.notFound(`Transaction ${transactionId} not found`);
    }

    // Retrieve all user transactions
    const allTxns = await Transaction.find({ userId }).sort({ date: 1 });

    const nodes = [];
    const edges = [];
    const nodeMap = new Map();
    const edgeMap = new Set();

    const addNode = (id, label, type, role, metadata = {}) => {
      if (!nodeMap.has(id)) {
        const node = {
          id,
          label,
          type, // 'originator', 'account', 'intermediary', 'beneficiary', 'transaction'
          role,
          metadata,
        };
        nodeMap.set(id, node);
        nodes.push(node);
      }
    };

    const addEdge = (source, target, amount, date, txnId, description) => {
      const edgeKey = `${source}->${target}_${txnId}`;
      if (!edgeMap.has(edgeKey)) {
        edgeMap.add(edgeKey);
        edges.push({
          id: `edge_${source}_${target}_${txnId}`,
          source,
          target,
          amount,
          date,
          transactionId: txnId,
          description,
          label: `₹${amount.toLocaleString('en-IN')}`,
        });
      }
    };

    // Central node: User's Account
    const userAccountNodeId = 'acc_user_main';
    addNode(userAccountNodeId, 'My Account (User)', 'account', 'Central Account Holder', {
      isCentral: true,
      balance: rootTxn.balance,
    });

    // 1. Process root transaction
    const rootTxnTime = new Date(rootTxn.date).getTime();
    const isCredit = rootTxn.type === 'credit';

    if (isCredit) {
      // Inbound: Sender -> User Account
      const senderId = `entity_${rootTxn.sender.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      addNode(senderId, rootTxn.sender, 'originator', 'Originator (Fund Source)', {
        paymentMode: rootTxn.paymentMode,
      });

      addEdge(senderId, userAccountNodeId, rootTxn.amount, rootTxn.date, rootTxn.transactionId, rootTxn.description);

      // Look for subsequent outflows within 48 hours (Where did this money go?)
      const subsequentDebits = allTxns.filter((t) => {
        if (t.type !== 'debit') return false;
        const tTime = new Date(t.date).getTime();
        return tTime >= rootTxnTime && tTime <= rootTxnTime + 48 * 60 * 60 * 1000;
      });

      subsequentDebits.forEach((outflow) => {
        const receiverId = `entity_${outflow.receiver.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
        addNode(receiverId, outflow.receiver, 'beneficiary', 'Downstream Recipient', {
          paymentMode: outflow.paymentMode,
          riskLevel: outflow.riskLevel,
        });

        addEdge(userAccountNodeId, receiverId, outflow.amount, outflow.date, outflow.transactionId, outflow.description);
      });
    } else {
      // Outbound: User Account -> Recipient
      const receiverId = `entity_${rootTxn.receiver.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      addNode(receiverId, rootTxn.receiver, 'beneficiary', 'Primary Beneficiary', {
        paymentMode: rootTxn.paymentMode,
      });

      addEdge(userAccountNodeId, receiverId, rootTxn.amount, rootTxn.date, rootTxn.transactionId, rootTxn.description);

      // Look for preceding inflows within 48 hours (Where did this money come from?)
      const precedingCredits = allTxns.filter((t) => {
        if (t.type !== 'credit') return false;
        const tTime = new Date(t.date).getTime();
        return tTime <= rootTxnTime && tTime >= rootTxnTime - 48 * 60 * 60 * 1000;
      });

      precedingCredits.forEach((inflow) => {
        const senderId = `entity_${inflow.sender.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
        addNode(senderId, inflow.sender, 'originator', 'Preceding Originator', {
          paymentMode: inflow.paymentMode,
          riskLevel: inflow.riskLevel,
        });

        addEdge(senderId, userAccountNodeId, inflow.amount, inflow.date, inflow.transactionId, inflow.description);
      });
    }

    // Timeline entries sorted chronologically
    const timelineTxns = allTxns.filter((t) => {
      const tTime = new Date(t.date).getTime();
      return Math.abs(tTime - rootTxnTime) <= 48 * 60 * 60 * 1000;
    });

    const timeline = timelineTxns.map((t) => ({
      transactionId: t.transactionId,
      date: t.date,
      time: new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: t.amount,
      type: t.type,
      formattedAmount: `${t.type === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}`,
      party: t.type === 'credit' ? t.sender : t.receiver,
      description: t.description,
      riskLevel: t.riskLevel,
      isRoot: t.transactionId === rootTxn.transactionId,
    }));

    return {
      rootTransaction: rootTxn,
      graph: {
        nodes,
        edges,
      },
      timeline,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        inflowTotal: edges
          .filter((e) => e.target === userAccountNodeId)
          .reduce((sum, e) => sum + e.amount, 0),
        outflowTotal: edges
          .filter((e) => e.source === userAccountNodeId)
          .reduce((sum, e) => sum + e.amount, 0),
      },
      disclaimer:
        'This money flow graph is derived exclusively from records present in your uploaded statement. No external or unauthorized banking ledgers were queried.',
    };
  }
}

export const traceService = new TraceService();
