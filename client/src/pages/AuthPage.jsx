import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, UserCheck, ShieldCheck, Wrench, Lock, Mail, User, Building } from 'lucide-react';

export default function AuthPage({ onClose }) {
  const { login, register, demoLogin, showToast } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'Computer Science'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login({ email: formData.email, password: formData.password });
      }
      if (onClose) onClose();
    } catch (err) {
      // Toast handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleFastDemo = async (role) => {
    await demoLogin(role);
    if (onClose) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                {isRegister ? 'Join CampusFlow' : 'Sign in to CampusFlow'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Second Year Challenge Engineer Edition
              </p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* 1-Click Demo Evaluation Box */}
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.875rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '0.5rem' }}>
            ⚡ 1-CLICK INSTANT DEMO ACCOUNTS:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleFastDemo('student')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.6875rem', padding: '6px 4px', flexDirection: 'column', gap: '2px' }}
            >
              <UserCheck size={14} color="#818cf8" /> Student
            </button>
            <button
              type="button"
              onClick={() => handleFastDemo('admin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.6875rem', padding: '6px 4px', flexDirection: 'column', gap: '2px' }}
            >
              <ShieldCheck size={14} color="#34d399" /> Admin / Dean
            </button>
            <button
              type="button"
              onClick={() => handleFastDemo('staff')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.6875rem', padding: '6px 4px', flexDirection: 'column', gap: '2px' }}
            >
              <Wrench size={14} color="#22d3ee" /> Staff / IT
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Or with credentials</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isRegister && (
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="Alex Rivera"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label className="input-label">Email Address</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="student@campusflow.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="input-label">Password</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {isRegister && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="input-label">Role</label>
                <select
                  className="select-field"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff / IT</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div>
                <label className="input-label">Department</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: '0.8125rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}
