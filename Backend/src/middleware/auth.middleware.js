import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';

export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token is required. Please log in.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_moneytrace_ai_production_jwt_key_9238472918347');
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists.'));
    }

    // Check if session token is in user's active sessions
    const hasValidSession = user.sessions && user.sessions.some((s) => s.token === token);
    if (!hasValidSession) {
      return next(ApiError.unauthorized('Session has expired or been terminated. Please log in again.'));
    }

    // Unverified users should not access protected application features
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify your email to access this resource.',
        isEmailVerified: false,
        email: user.email,
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Authentication token has expired. Please log in again.'));
    }
    next(error);
  }
};

// Allow authenticated but unverified user to check their status or resend verification
export const protectAllowUnverified = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token required.'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_moneytrace_ai_production_jwt_key_9238472918347');
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(ApiError.unauthorized('User not found.'));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(ApiError.unauthorized('Invalid or expired authentication token.'));
  }
};
