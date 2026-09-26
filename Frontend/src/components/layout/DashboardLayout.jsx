import React, { useState } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AlertTriangle, Send } from 'lucide-react';
import api from '../../services/api';

export const DashboardLayout = () => {
  const { isAuthenticated, isEmailVerified, user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading MoneyTrace AI...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleResend = async () => {
    try {
      setResending(true);
      await api.post('/auth/resend-verification', { email: user?.email });
      setResendStatus('Verification link dispatched! Please check your inbox.');
    } catch (err) {
      setResendStatus(err.message || 'Failed to dispatch verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Unverified email banner */}
        {!isEmailVerified && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-medium flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
              <span>
                Your email address (<strong>{user?.email}</strong>) is not yet verified. Please verify
                to unlock full analytics access.
              </span>
            </div>
            <div className="flex items-center gap-3">
              {resendStatus ? (
                <span className="text-[11px] font-bold text-slate-950 bg-white/40 px-2 py-0.5 rounded">
                  {resendStatus}
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="underline font-bold hover:text-slate-800 disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Verification Link'}
                </button>
              )}
            </div>
          </div>
        )}

        <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
