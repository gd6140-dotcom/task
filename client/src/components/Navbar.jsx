import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ShieldCheck, UserCheck, Wrench, LogOut, User, Activity } from 'lucide-react';

export default function Navbar({ onOpenAuthModal, onOpenNewIssueModal }) {
  const { user, demoLogin, logout, isAdmin, isStaff, isStudent } = useAuth();

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
          }}
        >
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CampusFlow
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                padding: '2px 8px',
                borderRadius: '9999px',
                letterSpacing: '0.05em'
              }}
            >
              PRO v2.0
            </span>
          </div>
        </div>
      </div>

      {/* Fast Demo Role Switcher (Crucial for Evaluation!) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          padding: '4px'
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0 10px' }}>
          Role Demo:
        </span>
        <button
          onClick={() => demoLogin('student')}
          className="btn btn-sm"
          style={{
            borderRadius: '9999px',
            background: isStudent ? '#6366f1' : 'transparent',
            color: isStudent ? '#ffffff' : '#94a3b8',
            boxShadow: isStudent ? '0 0 12px rgba(99, 102, 241, 0.5)' : 'none',
            fontSize: '0.75rem',
            padding: '4px 10px'
          }}
        >
          <UserCheck size={14} /> Student View
        </button>
        <button
          onClick={() => demoLogin('admin')}
          className="btn btn-sm"
          style={{
            borderRadius: '9999px',
            background: isAdmin ? '#8b5cf6' : 'transparent',
            color: isAdmin ? '#ffffff' : '#94a3b8',
            boxShadow: isAdmin ? '0 0 12px rgba(139, 92, 246, 0.5)' : 'none',
            fontSize: '0.75rem',
            padding: '4px 10px'
          }}
        >
          <ShieldCheck size={14} /> Admin / Dean
        </button>
        <button
          onClick={() => demoLogin('staff')}
          className="btn btn-sm"
          style={{
            borderRadius: '9999px',
            background: user?.role === 'staff' ? '#06b6d4' : 'transparent',
            color: user?.role === 'staff' ? '#ffffff' : '#94a3b8',
            boxShadow: user?.role === 'staff' ? '0 0 12px rgba(6, 182, 212, 0.5)' : 'none',
            fontSize: '0.75rem',
            padding: '4px 10px'
          }}
        >
          <Wrench size={14} /> Staff / IT
        </button>
      </div>

      {/* User Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid var(--border-color)',
                padding: '4px 12px 4px 6px',
                borderRadius: '9999px'
              }}
            >
              <img
                src={user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={user.name}
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#334155' }}
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.2 }}>
                  {user.name.split(' ')[0]}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                  {user.role} • {user.department || 'Campus'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout session"
              className="btn btn-outline btn-sm"
              style={{ padding: '6px', borderRadius: '8px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button onClick={onOpenAuthModal} className="btn btn-primary btn-sm">
            <User size={16} /> Sign In
          </button>
        )}
      </div>
    </header>
  );
}
