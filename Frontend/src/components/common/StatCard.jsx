import React from 'react';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendPositive,
  colorScheme = 'blue', // 'blue', 'green', 'amber', 'red', 'slate'
  className = '',
}) => {
  const colorMap = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      valueColor: 'text-slate-900',
    },
    green: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      valueColor: 'text-emerald-700',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      valueColor: 'text-amber-700',
    },
    red: {
      iconBg: 'bg-red-50 text-red-600 border-red-100',
      valueColor: 'text-red-700',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      valueColor: 'text-slate-900',
    },
  };

  const scheme = colorMap[colorScheme] || colorMap.blue;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-card ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className={`text-2xl font-bold mt-1.5 tracking-tight ${scheme.valueColor}`}>{value}</h4>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className={`font-semibold ${trendPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {trend}
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
