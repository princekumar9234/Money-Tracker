import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import api from '../../services/api';
import {
  Menu,
  Database,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

export const Navbar = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLoadDemoData = async () => {
    try {
      setSeedingDemo(true);
      await api.post('/transactions/seed-demo');
      setDemoSuccess(true);
      setTimeout(() => {
        setDemoSuccess(false);
        window.location.reload(); // Refresh views with new demo transactions
      }, 1000);
    } catch (err) {
      alert(err.message || 'Failed to seed demo transactions');
    } finally {
      setSeedingDemo(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-subtle">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden sm:inline-block text-xs font-medium text-slate-500 italic">
          "Understand where your money comes from and where it goes."
        </span>
      </div>

      {/* Right: Quick actions + User menu */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Load Demo Data Button */}
        <button
          onClick={handleLoadDemoData}
          disabled={seedingDemo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition-colors shadow-subtle disabled:opacity-50"
          title="Seed realistic fictional transactions to test all features"
        >
          {demoSuccess ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Loaded!</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-brand-600" />
              <span>{seedingDemo ? 'Loading...' : 'Load Demo Data'}</span>
            </>
          )}
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {user?.name || 'Account'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                {user?.email}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-slate-500 truncate text-[11px]">{user?.email}</p>
                  <span
                    className={`inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded font-medium ${
                      user?.isEmailVerified
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {user?.isEmailVerified ? 'Email Verified' : 'Unverified'}
                  </span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Security Settings</span>
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
