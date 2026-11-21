import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, Shield, RefreshCw, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const { login, verifyEmail, addNotification } = useAuth();
  
  // View states: 'login' | 'verify_email' | 'forgot_password'
  const [view, setView] = useState('login');
  
  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Email verification state
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Common UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle standard Login (Email or 'admin' + Password)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (res?.requiresVerification) {
        setVerificationEmail(res.email);
        setView('verify_email');
        setSuccessMsg(res.message || 'Please enter the verification code sent to your email.');
        if (res.devOtp) setDevOtpNotice(res.devOtp);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email/username or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyEmail({
        email: verificationEmail,
        otp: otp.trim(),
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification code is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendOtp = async () => {
    setError('');
    try {
      const res = await authService.resendVerification(verificationEmail);
      if (res.data?.devOtp) setDevOtpNotice(res.data.devOtp);
      addNotification({ type: 'info', title: 'Code Resent', message: 'A new 6-digit verification code was emailed.' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to resend code.');
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(forgotEmail);
      setForgotSubmitted(true);
      setSuccessMsg(`If an account exists for ${forgotEmail}, password reset instructions have been dispatched.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center items-center p-4 sm:p-6">
      
      {/* Centered Modern SaaS Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-8 sm:p-10 space-y-7 animate-in fade-in duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 justify-center mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/30">
              SC
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#2563EB]">
              school<span className="text-slate-900">connect</span>
            </h1>
          </div>
          
          {view === 'login' && (
            <>
              <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
              <p className="text-xs text-slate-500 font-medium">Multi-tenant education & school collaboration portal</p>
            </>
          )}

          {view === 'verify_email' && (
            <>
              <h2 className="text-xl font-bold text-slate-900">Verify Your Email</h2>
              <p className="text-xs text-slate-500 font-medium">Enter the 6-digit code sent to <span className="font-semibold text-slate-700">{verificationEmail}</span></p>
            </>
          )}

          {view === 'forgot_password' && (
            <>
              <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
              <p className="text-xs text-slate-500 font-medium">Enter your registered email to receive reset instructions</p>
            </>
          )}
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-2xl flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dev OTP Helper Banner if in local sandbox/test */}
        {devOtpNotice && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl flex items-center justify-between">
            <div>
              <span className="font-bold">Dev Verification Code: </span>
              <span className="font-mono font-extrabold text-blue-700 text-sm tracking-wider">{devOtpNotice}</span>
            </div>
            <button
              onClick={() => setOtp(devOtpNotice)}
              className="text-[11px] font-bold text-blue-600 underline hover:text-blue-800"
            >
              Fill code
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: UNIFIED LOGIN (Superadmin 'admin' or Real Email)       */}
        {/* ------------------------------------------------------------- */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address or Admin username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="admin or your email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-slate-800 transition pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => { setError(''); setSuccessMsg(''); setView('forgot_password'); }}
                  className="text-xs text-[#2563EB] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-slate-800 transition pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign in</span>}
            </button>

            <div className="pt-4 border-t border-slate-100 text-center text-xs space-y-1">
              <p className="text-slate-500 font-medium">
                🛡️ Protected Multi-Tenant System
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Access for Teachers, Parents & Students is provisioned exclusively by the Super Administrator via secure email invitation.
              </p>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: 6-DIGIT EMAIL OTP VERIFICATION                        */}
        {/* ------------------------------------------------------------- */}
        {view === 'verify_email' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 text-center">
                Enter 6-digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full py-4 text-center tracking-[0.5em] font-mono text-2xl font-bold bg-slate-50 border-2 border-blue-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-blue-700 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify & Access Dashboard</span>}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-[#2563EB] hover:underline font-semibold flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </button>

              <button
                type="button"
                onClick={() => { setError(''); setSuccessMsg(''); setView('login'); }}
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: FORGOT PASSWORD FLOW                                  */}
        {/* ------------------------------------------------------------- */}
        {view === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@school.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-slate-800 transition pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Reset Instructions</span>}
            </button>

            <div className="pt-2 text-center text-xs">
              <button
                type="button"
                onClick={() => { setError(''); setSuccessMsg(''); setView('login'); }}
                className="text-slate-500 hover:text-slate-800 font-medium"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
