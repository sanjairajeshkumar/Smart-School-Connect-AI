import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    // PDF status pill styles: soft amber for Pending, mint green for Done
    pending: 'bg-[#FEF3C7] text-[#D97706] border border-amber-200/60',
    done: 'bg-[#ECFDF5] text-[#059669] border border-emerald-200/60',
    completed: 'bg-[#ECFDF5] text-[#059669] border border-emerald-200/60',
    
    // Priority badges
    high: 'bg-rose-50 text-rose-700 border border-rose-200',
    urgent: 'bg-red-100 text-red-800 border border-red-300 font-bold',
    medium: 'bg-amber-50 text-amber-700 border border-amber-200',
    low: 'bg-slate-100 text-slate-700 border border-slate-200',
    
    // Feature pill
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const style = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide transition ${style} ${className}`}
    >
      {children}
    </span>
  );
};
