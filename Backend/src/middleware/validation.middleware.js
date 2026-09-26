import validator from 'validator';
import { ApiError } from '../utils/apiError.js';

export const validateRegister = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = [];

  if (!name || validator.isEmpty(name.trim())) {
    errors.push('Full name is required.');
  } else if (!validator.isLength(name.trim(), { min: 2, max: 50 })) {
    errors.push('Name must be between 2 and 50 characters.');
  }

  if (!email || !validator.isEmail(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password) {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
  }

  if (password !== confirmPassword) {
    errors.push('Password confirmation does not match.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Registration validation failed', errors));
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validator.isEmail(email.trim())) {
    errors.push('Valid email is required.');
  }

  if (!password || validator.isEmpty(password)) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Login validation failed', errors));
  }

  next();
};

export const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  if (!email || !validator.isEmail(email.trim())) {
    return next(ApiError.badRequest('A valid email is required.'));
  }
  next();
};

export const validateResetPassword = (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
  }

  if (password !== confirmPassword) {
    errors.push('Password confirmation does not match.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Password reset validation failed', errors));
  }

  next();
};

export const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!currentPassword) {
    errors.push('Current password is required.');
  }

  if (!newPassword || newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    errors.push('New password must contain at least one uppercase letter, one lowercase letter, and one number.');
  }

  if (newPassword !== confirmPassword) {
    errors.push('Password confirmation does not match.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Change password validation failed', errors));
  }

  next();
};

export const validateTransactionImport = (req, res, next) => {
  const { transactions } = req.body;

  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return next(ApiError.badRequest('Transactions array is required and must not be empty.'));
  }

  if (transactions.length > 5000) {
    return next(ApiError.badRequest('Cannot import more than 5000 transactions at once.'));
  }

  const errors = [];
  transactions.slice(0, 10).forEach((t, i) => {
    if (!t.date || isNaN(new Date(t.date).getTime())) {
      errors.push(`Row ${i + 1}: Invalid transaction date.`);
    }
    if (t.amount === undefined || isNaN(Number(t.amount)) || Number(t.amount) < 0) {
      errors.push(`Row ${i + 1}: Invalid transaction amount.`);
    }
    if (!t.description) {
      errors.push(`Row ${i + 1}: Description is required.`);
    }
  });

  if (errors.length > 0) {
    return next(ApiError.badRequest('Transaction import validation failed', errors));
  }

  next();
};
