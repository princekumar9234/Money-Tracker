/**
 * Format currency in Indian Rupees (INR)
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date in localized human readable format
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format full date and time
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get color and style classes for Risk levels
 * - Normal → neutral/green
 * - Low Risk → blue/green
 * - Medium Risk → yellow/orange
 * - High Risk → red
 * - Needs Review → amber/orange
 */
export const getRiskStyle = (riskLevel) => {
  switch (riskLevel) {
    case 'High Risk':
      return {
        bg: 'bg-red-50 text-red-700 border-red-200',
        badge: 'bg-red-600 text-white',
        border: 'border-red-500',
        dot: 'bg-red-500',
        bar: 'bg-red-500',
      };
    case 'Medium Risk':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        badge: 'bg-amber-500 text-white',
        border: 'border-amber-500',
        dot: 'bg-amber-500',
        bar: 'bg-amber-500',
      };
    case 'Needs Review':
      return {
        bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        badge: 'bg-yellow-500 text-white',
        border: 'border-yellow-500',
        dot: 'bg-yellow-500',
        bar: 'bg-yellow-500',
      };
    case 'Low Risk':
      return {
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        badge: 'bg-sky-600 text-white',
        border: 'border-sky-500',
        dot: 'bg-sky-500',
        bar: 'bg-sky-500',
      };
    case 'Normal':
    default:
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'bg-emerald-600 text-white',
        border: 'border-emerald-500',
        dot: 'bg-emerald-500',
        bar: 'bg-emerald-500',
      };
  }
};
