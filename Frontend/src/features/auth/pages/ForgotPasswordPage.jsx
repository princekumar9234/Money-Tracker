import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Alert } from '../../../components/common/LayoutComponents';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [resetTokenPreview, setResetTokenPreview] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      setError('');
      setStatusMessage('');
      const res = await authService.forgotPassword(email);
      setStatusMessage(res.message || 'If an account exists with this email, a reset link was sent.');
      if (res.data?.resetTokenPreview) {
        setResetTokenPreview(res.data.resetTokenPreview);
      }
    } catch (err) {
      setError(err.message || 'Failed to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Forgot Password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered email address and we'll dispatch a secure reset link.
        </p>
      </div>

      {statusMessage && (
        <Alert type="success" title="Check your inbox">
          {statusMessage}
        </Alert>
      )}

      {resetTokenPreview && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <span className="font-semibold text-slate-700 block">Development Quick Reset Link:</span>
          <Link
            to={`/reset-password?token=${resetTokenPreview}`}
            className="text-brand-600 underline font-mono text-[11px] break-all hover:text-brand-700"
          >
            Click here to choose new password →
          </Link>
        </div>
      )}

      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Account Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yourname@domain.com"
          icon={Mail}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={loading}
          className="w-full"
          icon={Send}
        >
          Send Reset Link
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>
      </div>
    </div>
  );
};
