import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sparkles, Shield, Lock, Activity } from 'lucide-react';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/login" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">MONEYTRACE AI</span>
        </Link>
        <p className="mt-2 text-xs md:text-sm text-slate-400 font-medium">
          Understand where your money comes from and where it goes.
        </p>
      </div>

      {/* Auth Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 z-10">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          <Outlet />
        </div>

        {/* Security Disclaimers Footer */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-slate-400 text-xs">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-400" /> 256-bit Encryption
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> Private & Audited
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-slate-400" /> AML Risk Intelligence
            </span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            *MoneyTrace AI flags risk patterns only and does not establish legal determinations.
          </p>
        </div>
      </div>
    </div>
  );
};
