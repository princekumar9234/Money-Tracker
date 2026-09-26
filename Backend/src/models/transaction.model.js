import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: [true, 'Transaction type (credit/debit) is required'],
      lowercase: true,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    paymentMode: {
      type: String,
      default: 'TRANSFER',
      trim: true,
      uppercase: true,
    },
    sender: {
      type: String,
      default: 'Unknown Sender',
      trim: true,
    },
    receiver: {
      type: String,
      default: 'Self / Account Holder',
      trim: true,
    },
    referenceNumber: {
      type: String,
      default: '',
      trim: true,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['Normal', 'Low Risk', 'Medium Risk', 'High Risk', 'Needs Review'],
      default: 'Normal',
      index: true,
    },
    indicators: [
      {
        type: String,
        trim: true,
      },
    ],
    isFlagged: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      default: 'manual', // 'manual', 'csv', 'excel', 'pdf', 'demo'
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexing for high-performance querying
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, riskLevel: 1 });
transactionSchema.index({ userId: 1, transactionId: 1 }, { unique: true });
transactionSchema.index({ userId: 1, amount: -1 });
transactionSchema.index({ userId: 1, isFlagged: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
