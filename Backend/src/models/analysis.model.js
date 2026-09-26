import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['Normal', 'Low Risk', 'Medium Risk', 'High Risk', 'Needs Review'],
      required: true,
    },
    indicators: [
      {
        type: String,
        trim: true,
      },
    ],
    explanation: {
      type: String,
      required: true,
    },
    disclaimer: {
      type: String,
      default: 'This analysis indicates risk patterns only and does not establish that funds are illegal or constitute black money.',
    },
    relatedTransactions: [
      {
        transactionId: { type: String, required: true },
        date: { type: Date },
        amount: { type: Number },
        type: { type: String },
        sender: { type: String },
        receiver: { type: String },
        relationReason: { type: String },
      },
    ],
    moneyFlowTrail: {
      nodes: [
        {
          id: String,
          label: String,
          type: { type: String, default: 'account' },
          role: String,
        },
      ],
      edges: [
        {
          source: String,
          target: String,
          amount: Number,
          date: Date,
          transactionId: String,
          label: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

analysisSchema.index({ userId: 1, transactionId: 1 });

export const Analysis = mongoose.model('Analysis', analysisSchema);
