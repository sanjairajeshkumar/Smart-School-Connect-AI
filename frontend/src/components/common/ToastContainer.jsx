import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { notifications, removeNotification } = useAuth();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {notifications.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start space-x-3 transition-all transform duration-300 animate-in slide-in-from-bottom-3 ${
              isSuccess
                ? 'bg-emerald-50/95 backdrop-blur border-emerald-200 text-emerald-950'
                : isError
                ? 'bg-rose-50/95 backdrop-blur border-rose-200 text-rose-950'
                : 'bg-slate-900/95 backdrop-blur border-slate-800 text-white'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-600" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-tight">{toast.title}</p>
              <p className="text-xs opacity-90 mt-0.5 leading-snug">{toast.message}</p>
            </div>

            <button
              onClick={() => removeNotification(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
