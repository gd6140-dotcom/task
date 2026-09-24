import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast((current) => (current && current.message === message ? null : current));
    }, 4000);
  };

  const closeToast = () => setToast(null);

  useEffect(() => {
    const token = localStorage.getItem('campusflow_token');
    if (!token) {
      // Auto login as demo student on first visit for frictionless evaluation
      handleDemoLogin('student', false);
      return;
    }

    api.auth.me()
      .then((res) => {
        if (res.user) {
          setUser(res.user);
        }
      })
      .catch(() => {
        localStorage.removeItem('campusflow_token');
        handleDemoLogin('student', false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const res = await api.auth.login(credentials);
      localStorage.setItem('campusflow_token', res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      return res;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleRegister = async (userData) => {
    try {
      const res = await api.auth.register(userData);
      localStorage.setItem('campusflow_token', res.token);
      setUser(res.user);
      showToast('Account registered successfully! Welcome to CampusFlow.', 'success');
      return res;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleDemoLogin = async (role = 'student', notify = true) => {
    try {
      setLoading(true);
      const res = await api.auth.demoLogin(role);
      localStorage.setItem('campusflow_token', res.token);
      setUser(res.user);
      if (notify) {
        showToast(`Switched view to ${role.toUpperCase()} (${res.user.name})`, 'info');
      }
      return res;
    } catch (err) {
      if (notify) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('campusflow_token');
    setUser(null);
    showToast('Logged out of session.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        toast,
        showToast,
        closeToast,
        login: handleLogin,
        register: handleRegister,
        demoLogin: handleDemoLogin,
        logout: handleLogout,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff' || user?.role === 'admin',
        isStudent: user?.role === 'student'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
