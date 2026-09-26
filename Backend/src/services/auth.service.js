import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { emailService } from './email.service.js';

class AuthService {
  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'super_secret_moneytrace_ai_production_jwt_key_9238472918347',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  async register({ name, email, password }) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      isEmailVerified: false,
    });

    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

    return {
      user: user.toJSON(),
      message: 'Registration successful. Please check your email to verify your account.',
      verificationTokenPreview: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
    };
  }

  async verifyEmail(rawToken) {
    if (!rawToken) {
      throw ApiError.badRequest('Verification token is required.');
    }

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw ApiError.badRequest('Verification token is invalid or has expired. Please request a new one.');
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    return {
      message: 'Email successfully verified! You can now log in and access all features.',
    };
  }

  async resendVerification(email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      throw ApiError.notFound('No account found with this email address.');
    }

    if (user.isEmailVerified) {
      throw ApiError.badRequest('This account email has already been verified.');
    }

    const verificationToken = user.generateVerificationToken();
    await user.save();

    await emailService.sendVerificationEmail(user.email, user.name, verificationToken);

    return {
      message: 'A fresh verification email has been dispatched.',
      verificationTokenPreview: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
    };
  }

  async login({ email, password, userAgent = '' }) {
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const token = this.generateToken(user._id);

    // Save active session
    if (!user.sessions) user.sessions = [];
    user.sessions.push({ token, userAgent, createdAt: new Date() });
    // Keep max 15 recent sessions
    if (user.sessions.length > 15) {
      user.sessions = user.sessions.slice(-15);
    }
    await user.save();

    return {
      user: user.toJSON(),
      token,
      isEmailVerified: user.isEmailVerified,
    };
  }

  async logout(user, currentToken) {
    if (user && user.sessions) {
      user.sessions = user.sessions.filter((s) => s.token !== currentToken);
      await user.save();
    }
    return { message: 'Logged out successfully.' };
  }

  async logoutAll(user) {
    if (user) {
      user.sessions = [];
      await user.save();
    }
    return { message: 'Logged out from all devices successfully.' };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return ambiguous message for security to avoid email enumeration
      return { message: 'If an account exists with this email, a password reset link has been dispatched.' };
    }

    const resetToken = user.generateResetPasswordToken();
    await user.save();

    await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

    return {
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      resetTokenPreview: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  async resetPassword({ token, password }) {
    if (!token) {
      throw ApiError.badRequest('Password reset token is required.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      throw ApiError.badRequest('Reset token is invalid or has expired.');
    }

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    // Invalidate old sessions on password reset for security
    user.sessions = [];
    await user.save();

    return { message: 'Password has been successfully reset. You may now log in.' };
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw ApiError.badRequest('The current password provided is incorrect.');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password updated successfully.' };
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found.');
    }
    return user.toJSON();
  }
}

export const authService = new AuthService();
