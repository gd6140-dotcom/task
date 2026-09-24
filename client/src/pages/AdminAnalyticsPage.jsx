import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Download, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Layers,
  Activity
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { user, showToast } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.analytics.getSummary();
      setData(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.issues.getAll({ limit: 1000 });
      const issues = res.data || [];

      if (issues.length === 0) {
        showToast('No issues data to export.', 'info');
        return;
      }

      const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Location', 'Student', 'Assignee', 'Created_At', 'Resolved_At'];
      const rows = issues.map(i => [
        i.id,
        `"${i.title.replace(/"/g, '""')}"`,
        i.category,
        i.priority,
        i.status,
        `"${i.location.replace(/"/g, '""')}"`,
        `"${i.student_name.replace(/"/g, '""')}"`,
        `"${(i.assigned_to_name || '').replace(/"/g, '""')}"`,
        i.created_at,
        i.resolved_at || ''
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `campusflow_issues_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Exported issues dataset as CSV successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading || !data) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Aggregating campus operational analytics...</p>
      </div>
    );
  }

  const { kpis, statusBreakdown, categoryBreakdown, priorityBreakdown, departmentStats } = data;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
              Operational Telemetry & SLA Engine
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            CampusFlow Administrator Analytics
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time incident resolution performance, category distribution, and department throughput metrics.
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn btn-primary">
          <Download size={16} /> Export CSV Report
        </button>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title="Total Registered Users"
          value={kpis.totalUsers}
          subtitle="Students, Faculty & Staff"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Total Tickets Logged"
          value={kpis.totalIssues}
          subtitle={`${kpis.resolvedIssues} closed successfully`}
          icon={Activity}
          color="cyan"
        />
        <StatCard
          title="Overall SLA Resolution Rate"
          value={`${kpis.resolutionRate}%`}
          subtitle="Target threshold: > 85%"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Facility Pending Bookings"
          value={kpis.pendingBookings}
          subtitle="Awaiting staff approval"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Category Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Issues by Category Breakdown
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Volume</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {categoryBreakdown.map((item) => {
              const pct = kpis.totalIssues > 0 ? Math.round((item.count / kpis.totalIssues) * 100) : 0;
              return (
                <div key={item.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                    <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>
                      {item.category.replace('_', ' ')}
                    </span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>
                      {item.count} <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                        borderRadius: '9999px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Priority Distribution & Severity
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Urgency</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {priorityBreakdown.map((item) => {
              const colors = {
                urgent: '#ef4444',
                high: '#f59e0b',
                medium: '#3b82f6',
                low: '#10b981'
              };
              const pct = kpis.totalIssues > 0 ? Math.round((item.count / kpis.totalIssues) * 100) : 0;

              return (
                <div key={item.priority}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                    <span style={{ color: '#e2e8f0', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[item.priority] || '#6366f1' }} />
                      {item.priority}
                    </span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>
                      {item.count} <span style={{ color: 'var(--text-dim)', fontWeight: 500 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#1e293b', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: colors[item.priority] || '#6366f1',
                        borderRadius: '9999px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Activity Leaderboard */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Department Resolution Throughput
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Resolved / Total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {departmentStats.map((dept) => {
              const deptRate = dept.total_issues > 0 ? Math.round((dept.resolved_issues / dept.total_issues) * 100) : 0;
              return (
                <div key={dept.department} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.875rem' }}>{dept.department}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: deptRate >= 50 ? '#34d399' : '#f59e0b' }}>
                      {deptRate}% Resolution Rate
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {dept.resolved_issues} of {dept.total_issues} reported incidents resolved
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
