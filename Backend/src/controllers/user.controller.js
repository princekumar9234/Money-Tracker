import { User } from '../models/user.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Analysis } from '../models/analysis.model.js';
import { Report } from '../models/report.model.js';
import { Chat } from '../models/chat.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return ApiResponse.success(res, 'User profile retrieved', user.toJSON());
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      throw ApiError.badRequest('Name must be at least 2 characters long.');
    }

    const user = await User.findById(req.user._id);
    user.name = name.trim();
    await user.save();

    return ApiResponse.success(res, 'Profile updated successfully', user.toJSON());
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Cascade delete all associated data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Transaction.deleteMany({ userId }),
      Analysis.deleteMany({ userId }),
      Report.deleteMany({ userId }),
      Chat.deleteMany({ userId }),
    ]);

    res.clearCookie('token');
    return ApiResponse.success(res, 'Account and all associated financial records permanently deleted.');
  } catch (error) {
    next(error);
  }
};
