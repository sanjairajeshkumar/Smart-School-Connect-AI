import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading records...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      <p className="text-sm text-slate-500 font-medium">{text}</p>
    </div>
  );
};
