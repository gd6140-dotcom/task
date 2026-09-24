import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  TicketCheck, 
  CalendarDays, 
  Layers, 
  BarChart3, 
  PlusCircle,
  HelpCircle,
  Database,
  Lock
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenNewIssueModal, issueCount = 0 }) {
  const { user, isAdmin, isStaff } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'issues', label: 'Issue Workflow', icon: TicketCheck, badge: issueCount },
    { id: 'events', label: 'Campus Events', icon: CalendarDays },
    { id: 'resources', label: 'Facilities & Labs', icon: Layers },
    { id: 'analytics', label: 'Analytics & SLA', icon: BarChart3, adminOnly: true }
  ];

  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        borderRight: '1px solid var(--border-color)',
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 1rem',
        minHeight: 'calc(100vh - 61px)'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Quick Report Issue Button */}
        <button
          onClick={onOpenNewIssueModal}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.875rem'
          }}
        >
          <PlusCircle size={18} />
          <span>Report New Issue</span>
        </button>

        {/* Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.75rem 0.5rem' }}>
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRestricted = item.adminOnly && !isStaff;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                disabled={isRestricted}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  color: isActive ? '#ffffff' : isRestricted ? '#475569' : 'var(--text-muted)',
                  cursor: isRestricted ? 'not-allowed' : 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? '#818cf8' : isRestricted ? '#475569' : '#94a3b8'} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      background: 'rgba(99, 102, 241, 0.25)',
                      color: '#a5b4fc',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {item.adminOnly && (
                  <span
                    style={{
                      fontSize: '0.625rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isStaff ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isStaff ? '#34d399' : '#f87171',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    {isStaff ? 'STAFF' : <Lock size={10} />}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tech Stack & Storage Badge */}
      <div
        className="glass-panel"
        style={{
          padding: '0.875rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Database size={14} color="#06b6d4" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
            SQLite Persistence Active
          </span>
        </div>
        <p style={{ fontSize: '0.6875rem', color: '#94a3b8', lineHeight: 1.4 }}>
          Full ACID relational store with JWT Auth & Role Authorization.
        </p>
      </div>
    </aside>
  );
}
