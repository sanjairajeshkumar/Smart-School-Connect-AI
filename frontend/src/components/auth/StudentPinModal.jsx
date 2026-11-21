import React, { useState } from 'react';
import { KeyRound, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const StudentPinModal = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { studentPinLogin } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!pin || pin.length < 4) {
      setError('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      setLoading(true);
      await studentPinLogin(pin);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to authenticate student PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
        >
          ✕
        </button>

        <div className="w-14 h-14 bg-blue-50 text-[#2563EB] rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-blue-50/50">
          <KeyRound className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-slate-800">Student PIN Access</h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Enter your 4-digit student PIN to view your homework and check off tasks.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN visual display */}
        <div className="flex justify-center space-x-3 mb-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                pin.length > index
                  ? 'border-[#2563EB] bg-blue-50/50 text-[#2563EB]'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              {pin[index] ? '•' : ''}
            </div>
          ))}
        </div>

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num.toString())}
              className="py-3 text-lg font-semibold bg-slate-50 hover:bg-slate-100 active:bg-blue-100 rounded-xl transition text-slate-700"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            className="py-3 text-xs font-semibold text-slate-400 hover:text-slate-600 rounded-xl"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="py-3 text-lg font-semibold bg-slate-50 hover:bg-slate-100 active:bg-blue-100 rounded-xl transition text-slate-700"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={pin.length < 4 || loading}
          className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-200 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 transition"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <span>Enter Student Mode</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="mt-4 text-[11px] text-slate-400">
          Demo Student PIN: <span className="font-semibold text-slate-600">1234</span> (Alex Johnson)
        </p>
      </div>
    </div>
  );
};
