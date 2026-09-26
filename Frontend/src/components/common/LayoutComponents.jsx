import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const Skeleton = ({ className = '', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`animate-pulse bg-slate-200/80 rounded-md ${className}`} />
      ))}
    </>
  );
};

export const Alert = ({
  type = 'info', // 'info', 'success', 'warning', 'error'
  title,
  children,
  className = '',
  onClose,
}) => {
  const configs = {
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    },
  };

  const current = configs[type] || configs.info;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${current.bg} ${className}`}>
      {current.icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5 text-sm">{title}</h5>}
        <div className="text-xs md:text-sm leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1 p-1 rounded-md"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({
  icon: Icon = Info,
  title = 'No records found',
  description = 'There is no data to display right now.',
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export const PageHeader = ({
  title,
  subtitle,
  action,
  breadcrumbs = [],
}) => {
  return (
    <div className="mb-6 pb-4 border-b border-slate-200/80">
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-slate-700">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-slate-600 font-medium">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
};
