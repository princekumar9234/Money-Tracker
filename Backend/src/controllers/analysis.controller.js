import { analysisService } from '../services/analysis.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const analyzeTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const analysis = await analysisService.analyzeTransaction(req.user._id, transactionId);
    return ApiResponse.success(res, 'Risk analysis generated successfully', analysis);
  } catch (error) {
    next(error);
  }
};

export const getAnalysis = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const analysis = await analysisService.getAnalysisByTransactionId(req.user._id, transactionId);
    return ApiResponse.success(res, 'Analysis retrieved successfully', analysis);
  } catch (error) {
    next(error);
  }
};

export const getRiskyTransactions = async (req, res, next) => {
  try {
    const transactions = await analysisService.getRiskyTransactions(req.user._id);
    return ApiResponse.success(res, 'Risky transactions retrieved successfully', transactions);
  } catch (error) {
    next(error);
  }
};
