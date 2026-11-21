import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentPinModal } from '../components/auth/StudentPinModal';
import { KeyRound, ArrowRight, Loader2, AlertCircle, Shield, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const { login, quickSwitchRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickSwitchRole(role);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center items-center p-4 sm:p-6">
      
      {/* Centered Login Card - Exact Match to PDF Screen 01 */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-8 sm:p-10 space-y-8 animate-in fade-in duration-200">
        
        {/* Brand & Subtitle */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2563EB]">
            school<span className="text-slate-900">connect</span>
          </h1>
          <h2 className="text-xl font-bold text-slate-800">Welcome back</h2>
          <p className="text-xs text-slate-500 font-medium">Sign in to your school account</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Email + Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="name@school.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-slate-800 placeholder-slate-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white text-slate-800 placeholder-slate-400 transition"
            />
          </div>

          {/* Sign In Primary Button - matching PDF Screen 01 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-slate-300 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center space-x-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign in</span>}
          </button>
        </form>

        {/* PDF Screen 01: "Role is loaded after login" */}
        <div className="text-center">
          <p className="text-xs text-slate-400 font-medium">Role is loaded after login</p>
        </div>

        {/* Student PIN Flow Shortcut */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500 font-medium">Are you a student?</p>
          <button
            type="button"
            onClick={() => setIsPinModalOpen(true)}
            className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Quick Student PIN Login (1234)</span>
          </button>
        </div>

        {/* Demo Fast-Login Pills for Immediate Evaluation */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400 text-center mb-2.5">
            Quick 1-Click Demo Profiles
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin('teacher')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 text-center transition"
            >
              👩‍🏫 Teacher
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('parent')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 text-center transition"
            >
              👨‍👧 Parent
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('student')}
              className="py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 text-center transition"
            >
              🎒 Student
            </button>
          </div>
        </div>

      </div>

      {/* Student PIN Modal */}
      <StudentPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </div>
  );
};
