import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('schoolconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('schoolconnect_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('schoolconnect_token');
      if (savedToken) {
        try {
          const profileRes = await authService.getProfile();
          if (profileRes.success) {
            setUser(profileRes.data);
            localStorage.setItem('schoolconnect_user', JSON.stringify(profileRes.data));
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
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('schoolconnect_token', res.data.token);
      localStorage.setItem('schoolconnect_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const studentPinLogin = async (pin, studentId = null) => {
    const res = await authService.studentPinLogin(pin, studentId);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('schoolconnect_token', res.data.token);
      localStorage.setItem('schoolconnect_user', JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.message || 'Student PIN authentication failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('schoolconnect_token');
    localStorage.removeItem('schoolconnect_user');
  };

  // Quick switch demo helper for presentation / grading
  const quickSwitchRole = async (targetRole) => {
    if (targetRole === 'teacher') {
      return await login('teacher@school.com', 'password123');
    }
    if (targetRole === 'parent') {
      return await login('parent.sarah@school.com', 'password123');
    }
    if (targetRole === 'student') {
      return await studentPinLogin('1234');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        role: user?.role || null,
        loading,
        login,
        studentPinLogin,
        logout,
        quickSwitchRole,
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
