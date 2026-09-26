import React from 'react';
import { getRiskStyle } from '../../utils/formatters';
import { ShieldCheck, AlertTriangle, AlertCircle, HelpCircle, Info } from 'lucide-react';

export const RiskBadge = ({ level = 'Normal', score, size = 'md', showIcon = true }) => {
  const style = getRiskStyle(level);

  const getIcon = () => {
    switch (level) {
      case 'High Risk':
        return <AlertCircle className="w-3.5 h-3.5 shrink-0" />;
      case 'Medium Risk':
        return <AlertTriangle className="w-3.5 h-3.5 shrink-0" />;
      case 'Needs Review':
        return <HelpCircle className="w-3.5 h-3.5 shrink-0" />;
      case 'Low Risk':
        return <Info className="w-3.5 h-3.5 shrink-0" />;
      case 'Normal':
      default:
        return <ShieldCheck className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${style.bg} ${
        sizeClasses[size] || sizeClasses.md
      }`}
    >
      {showIcon && getIcon()}
      <span>{level}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-80 text-[11px] font-mono ml-0.5">({score}/100)</span>
      )}
    </span>
  );
};
