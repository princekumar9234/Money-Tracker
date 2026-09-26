import { Router } from 'express';
import {
  register,
  login,
  logout,
  logoutAll,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
} from '../controllers/auth.controller.js';
import { protect, protectAllowUnverified } from '../middleware/auth.middleware.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
} from '../middleware/validation.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/forgot-password', authLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', authLimiter, validateResetPassword, resetPassword);

// Protected routes (verified required or allow status check)
router.get('/me', protectAllowUnverified, getMe);
router.post('/logout', protectAllowUnverified, logout);
router.post('/logout-all', protectAllowUnverified, logoutAll);
router.post('/change-password', protect, validateChangePassword, changePassword);

export default router;
