import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('schoolconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('schoolconnect_token') || null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const addNotification = (toast) => {
    const id = Date.now() + Math.random().toString();
    setNotifications((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('schoolconnect_token');
      if (savedToken) {
        try {
          const profileRes = await authService.getProfile();
          if (profileRes.success && profileRes.data) {
            setUser(profileRes.data);
            localStorage.setItem('schoolconnect_user', JSON.stringify(profileRes.data));
            initSocket(savedToken);
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.data?.requiresVerification) {
      return { requiresVerification: true, email: res.data.email, message: res.data.message };
    }
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('schoolconnect_token', res.data.token);
      localStorage.setItem('schoolconnect_user', JSON.stringify(res.data.user));
      initSocket(res.data.token);
      addNotification({ type: 'success', title: 'Signed In', message: `Welcome back, ${res.data.user.name}` });
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const registerSchool = async (data) => {
    const res = await authService.registerSchool(data);
    return res;
  };

  const verifyEmail = async ({ email, otp, token: verifyToken }) => {
    const res = await authService.verifyEmail({ email, otp, token: verifyToken });
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('schoolconnect_token', res.data.token);
      localStorage.setItem('schoolconnect_user', JSON.stringify(res.data.user));
      initSocket(res.data.token);
      addNotification({ type: 'success', title: 'Email Verified', message: 'Account activated successfully!' });
      return res.data.user;
    }
    throw new Error(res.message || 'Verification failed');
  };

  const acceptInvite = async (data) => {
    const res = await authService.acceptInvite(data);
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('schoolconnect_token', res.data.token);
      localStorage.setItem('schoolconnect_user', JSON.stringify(res.data.user));
      initSocket(res.data.token);
      addNotification({ type: 'success', title: 'Welcome!', message: 'Invitation accepted and account activated.' });
      return res.data.user;
    }
    throw new Error(res.message || 'Failed to accept invitation');
  };

  const logout = () => {
    disconnectSocket();
    setToken(null);
    setUser(null);
    localStorage.removeItem('schoolconnect_token');
    localStorage.removeItem('schoolconnect_user');
    addNotification({ type: 'info', title: 'Signed Out', message: 'You have been securely signed out.' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        role: user?.role || null,
        school: user?.schoolId || null,
        loading,
        notifications,
        addNotification,
        removeNotification,
        login,
        registerSchool,
        verifyEmail,
        acceptInvite,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
