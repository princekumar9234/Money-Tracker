import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { Alert } from '../../../components/common/LayoutComponents';
import { User, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please provide a valid email.';
    }

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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await register(formData);
      setSuccessData(res);
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="space-y-5 text-center">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Registration Successful!</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          We have dispatched a verification email to <strong>{formData.email}</strong>. Please click
          the link in your email to verify your account before accessing protected tools.
        </p>

        {successData.verificationTokenPreview && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs">
            <span className="font-semibold text-slate-700 block mb-1">Development Quick-Verify Link:</span>
            <Link
              to={`/verify-email?token=${successData.verificationTokenPreview}`}
              className="text-brand-600 underline font-mono text-[11px] break-all hover:text-brand-700"
            >
              Verify Instantly in 1 Click →
            </Link>
          </div>
        )}

        <div className="pt-2">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            Go to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create your Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Begin monitoring personal transactions and identifying risk anomalies
        </p>
      </div>

      {apiError && (
        <Alert type="error" title="Registration Failed">
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Full Name"
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Rohan Sharma"
          error={errors.name}
          icon={User}
          required
        />

        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="rohan@example.com"
          error={errors.email}
          icon={Mail}
          required
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Min. 8 characters with Upper, Lower & Number"
          error={errors.password}
          icon={Lock}
          required
        />

        <Input
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter password"
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
          icon={ArrowRight}
        >
          Create Account
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign In here
        </Link>
      </div>
    </div>
  );
};
