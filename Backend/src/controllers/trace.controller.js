import { traceService } from '../services/trace.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const traceTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const traceData = await traceService.traceMoneyFlow(req.user._id, transactionId);
    return ApiResponse.success(res, 'Money flow trail retrieved successfully', traceData);
  } catch (error) {
    next(error);
  }
};
