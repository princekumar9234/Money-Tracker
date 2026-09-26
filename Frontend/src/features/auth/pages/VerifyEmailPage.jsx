import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { Button } from '../../../components/common/Button';
import { Alert } from '../../../components/common/LayoutComponents';
import { Input } from '../../../components/common/Input';
import { CheckCircle2, XCircle, Mail, ArrowRight } from 'lucide-react';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      handleVerification(token);
    }
  }, [token]);

  const handleVerification = async (verifyToken) => {
    try {
      setLoading(true);
      setErrorMessage('');
      await authService.verifyEmail(verifyToken);
      setSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Verification token is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;

    try {
      setResending(true);
      setResendStatus('');
      await authService.resendVerification(resendEmail);
      setResendStatus('A fresh verification link has been sent! Please check your inbox.');
    } catch (err) {
      setResendStatus(err.message || 'Failed to dispatch verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      {loading ? (
        <div className="py-8">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">Verifying your email...</h2>
          <p className="text-xs text-slate-500 mt-1">Please wait while we confirm your activation token.</p>
        </div>
      ) : success ? (
        <div className="space-y-4 py-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Email Verified Successfully!</h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Your MoneyTrace AI account is fully verified. You now have complete access to all AI transaction intelligence tools.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              icon={ArrowRight}
              onClick={() => navigate('/login?verified=true')}
            >
              Proceed to Sign In
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Email Verification</h2>
          {errorMessage ? (
            <Alert type="error" title="Verification Failed">
              {errorMessage}
            </Alert>
          ) : (
            <p className="text-xs text-slate-600">
              No verification token was detected in your URL. Request a new verification link below:
            </p>
          )}

          {resendStatus && (
            <Alert type="info">
              {resendStatus}
            </Alert>
          )}

          <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
            <Input
              label="Enter Your Account Email"
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder="user@example.com"
              icon={Mail}
              required
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={resending}
              className="w-full"
            >
              Resend Verification Link
            </Button>
          </form>

          <div className="pt-3 border-t border-slate-100">
            <Link to="/login" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Return to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
