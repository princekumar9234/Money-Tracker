import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Receipt,
  AlertTriangle,
  GitBranch,
  BotMessageSquare,
  BookOpen,
  FileText,
  User,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload Statement', to: '/upload', icon: UploadCloud },
  { name: 'Transactions', to: '/transactions', icon: Receipt },
  { name: 'Unusual Transactions', to: '/unusual', icon: AlertTriangle, badge: 'AI' },
  { name: 'Money Flow Trace', to: '/trace', icon: GitBranch, highlight: true },
  { name: 'AI Assistant', to: '/ai-agent', icon: BotMessageSquare, badge: 'Agent' },
  { name: 'AML Knowledge Base', to: '/knowledge-base', icon: BookOpen },
  { name: 'Audit Reports', to: '/reports', icon: FileText },
  { name: 'My Profile', to: '/profile', icon: User },
  { name: 'Security Settings', to: '/settings', icon: ShieldCheck },
];

export const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <NavLink to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">MONEYTRACE</span>
              <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-950/80 px-1.5 py-0.5 rounded border border-brand-800/60">
                AI
              </span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tagline mini bar */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/60 text-[11px] text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Transaction Intelligence Engine</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-900/80 text-brand-300 border border-brand-700/50">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Disclaimer & Branding */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <p className="text-[10px] text-slate-400 leading-tight">
            *Risk patterns indicator only. Does not constitute legal determination.
          </p>
        </div>
      </aside>
    </>
  );
};
