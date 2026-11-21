import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import { LogOut, User, Building2, Bell, Radio, Shield } from 'lucide-react';

export const Navbar = ({ currentSection = 'Overview' }) => {
  const { user, logout } = useAuth();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      setSocketConnected(socket.connected);
      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);
      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      };
    }
  }, []);

  const getRoleBadge = () => {
    if (!user) return null;
    const roleColors = {
      super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
      school_admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      teacher: 'bg-blue-100 text-blue-700 border-blue-200',
      parent: 'bg-amber-100 text-amber-800 border-amber-200',
      student: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };

    const roleLabels = {
      super_admin: 'Super Admin',
      school_admin: 'School Admin',
      teacher: 'Teacher',
      parent: 'Parent',
      student: 'Student',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
        {roleLabels[user.role] || user.role}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand & Tenant context */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              SC
            </div>
            <span className="text-xl font-bold tracking-tight text-[#2563EB]">
              school<span className="text-slate-900">connect</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center text-xs text-slate-400 font-medium space-x-2 border-l border-slate-200 pl-4">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700 max-w-[180px] truncate">
              {user?.schoolId?.name || user?.schoolName || 'Smart School Connect'}
            </span>
            <span>•</span>
            <span className="text-slate-500 font-medium">{currentSection}</span>
          </div>
        </div>

        {/* Right: Real-time status + User Profile + Logout */}
        <div className="flex items-center space-x-4">
          
          {/* Real-time WebSocket indicator */}
          <div
            title={socketConnected ? 'Live real-time sync active' : 'Connecting real-time socket...'}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-medium text-slate-600"
          >
            <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden md:inline">{socketConnected ? 'Live' : 'Syncing'}</span>
          </div>

          {/* User profile info */}
          <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-100">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs ring-2 ring-blue-50">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <div className="flex items-center space-x-1.5">
                <p className="font-semibold text-slate-800">{user?.name || 'User'}</p>
                {getRoleBadge()}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px]">{user?.email}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
