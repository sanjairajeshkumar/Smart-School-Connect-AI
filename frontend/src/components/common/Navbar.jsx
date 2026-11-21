import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

export const Navbar = ({ currentSection = 'Overview' }) => {
  const { user, logout, quickSwitchRole } = useAuth();

  const getRoleLabel = () => {
    if (!user) return '';
    if (user.role === 'teacher') return 'Teacher';
    if (user.role === 'parent') return 'Parent';
    if (user.role === 'student') return 'Student';
    return user.role;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand & Breadcrumb */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight text-[#2563EB]">
              school<span className="text-slate-900">connect</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center text-sm text-slate-400 font-medium space-x-2 border-l border-slate-200 pl-4">
            <span className="capitalize text-slate-600 font-semibold">{getRoleLabel()}</span>
            <span>|</span>
            <span className="text-slate-500">{currentSection}</span>
          </div>
        </div>

        {/* Right: Quick Role Switcher + User Profile + Logout */}
        <div className="flex items-center space-x-3">
          
          {/* Quick Role Switch Pills for easy evaluation */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium space-x-1 border border-slate-200">
            <button
              onClick={() => quickSwitchRole('teacher')}
              className={`px-2.5 py-1 rounded-lg transition ${
                user?.role === 'teacher'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teacher
            </button>
            <button
              onClick={() => quickSwitchRole('parent')}
              className={`px-2.5 py-1 rounded-lg transition ${
                user?.role === 'parent'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parent
            </button>
            <button
              onClick={() => quickSwitchRole('student')}
              className={`px-2.5 py-1 rounded-lg transition ${
                user?.role === 'student'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student
            </button>
          </div>

          {/* User info */}
          <div className="flex items-center space-x-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs ring-2 ring-blue-50">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <p className="font-semibold text-slate-800">{user?.name || 'User'}</p>
              <p className="text-slate-500 capitalize">{user?.role} • {user?.grade || 'Grade 8'}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
