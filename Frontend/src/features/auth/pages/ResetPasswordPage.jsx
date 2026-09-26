import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Alert } from '../../../components/common/LayoutComponents';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs = {};
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long.';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errs.password = 'Must contain uppercase, lowercase letter, and a number.';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setApiError('Reset token is missing from URL.');
      return;
    }
    if (!validate()) return;

    try {
      setLoading(true);
      setApiError('');
      await authService.resetPassword({
        token,
        password: formData.password,
      });
      setSuccess(true);
    } catch (err) {
      setApiError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">Invalid Reset Link</h2>
        <Alert type="error">
          The password reset token is missing or malformed. Please request a new link.
        </Alert>
        <Link to="/forgot-password" className="text-xs text-brand-600 font-semibold hover:underline block pt-2">
          Request New Reset Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Password Reset Complete!</h2>
        <p className="text-xs text-slate-600">
          Your account password has been updated. You can now log in with your new credentials.
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            className="w-full"
            icon={ArrowRight}
            onClick={() => navigate('/login')}
          >
            Sign In with New Password
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Choose New Password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Please enter your secure new password below.
        </p>
      </div>

      {apiError && (
        <Alert type="error" title="Reset Error">
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Min. 8 chars, uppercase, lowercase, number"
          error={errors.password}
          icon={Lock}
          required
        />

        <Input
          label="Confirm New Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="Re-enter new password"
          error={errors.confirmPassword}
          icon={Lock}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={loading}
          className="w-full mt-2"
        >
          Reset Password
        </Button>
      </form>
    </div>
  );
};
