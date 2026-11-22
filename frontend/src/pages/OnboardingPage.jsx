import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, Phone, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const OnboardingPage = ({ token, onComplete, onCancel }) => {
  const { user, isAuthenticated, acceptInvite, addNotification } = useAuth();
  const [inviteDetails, setInviteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setLoading(true);
        const res = await authService.getInviteDetails(token);
        if (res.success && res.data) {
          setInviteDetails(res.data);
          setName(res.data.name || '');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Invitation is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvite();
    } else {
      setError('No invitation token provided in URL.');
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvite({
        token,
        name,
        phone,
        password,
      });
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to activate account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Verifying invitation credentials...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteDetails) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Invitation Expired or Invalid</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                window.history.replaceState({}, document.title, '/');
                window.location.href = '/';
              }
            }}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#2563EB] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            {isAuthenticated ? 'Return to Dashboard' : 'Return to Sign In'}
          </button>
        </div>
      </div>
    );
  }

  const roleName = inviteDetails?.role?.replace('_', ' ')?.toUpperCase() || 'MEMBER';

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-8 sm:p-10 space-y-6 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200 uppercase tracking-wider">
            {inviteDetails?.schoolName}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Activate Your Account
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            You have been provisioned as an authorized <span className="font-bold text-slate-800">{roleName}</span>
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Onboarding Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email address (Verified)
            </label>
            <input
              type="email"
              disabled
              value={inviteDetails?.email || ''}
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-slate-800 transition pl-10"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Phone (Optional)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-slate-800 transition pl-10"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Create Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password (min 6 characters)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-slate-800 transition pl-10"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-slate-800 transition pl-10"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2 mt-2"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Complete Onboarding & Enter Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
