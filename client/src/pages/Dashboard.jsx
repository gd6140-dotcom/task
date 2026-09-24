import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Flame, 
  CalendarDays, 
  Layers, 
  ArrowUpRight, 
  Sparkles,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

export default function Dashboard({ setActiveTab, onSelectIssue, onOpenNewIssueModal }) {
  const { user, isStaff, isStudent, showToast } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, issuesRes, eventsRes] = await Promise.all([
        api.analytics.getSummary().catch(() => ({ data: null })),
        api.issues.getAll({ limit: 5, myIssues: isStudent ? 'true' : 'false' }),
        api.events.getAll({ upcomingOnly: 'true' })
      ]);

      if (analyticsRes.data) setStats(analyticsRes.data);
      if (issuesRes.data) setRecentIssues(issuesRes.data);
      if (eventsRes.data) setUpcomingEvents(eventsRes.data.slice(0, 3));
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = stats?.kpis || {
    totalIssues: 0,
    activeIssues: 0,
    urgentIssues: 0,
    resolutionRate: 0,
    totalEvents: 0,
    totalResources: 0
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles size={18} color="#818cf8" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isStaff ? 'Campus Operations Command Center' : 'Student Hub Portal'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name || 'Scholar'}!
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isStaff
              ? 'Real-time triage queue, maintenance dispatch, and campus service telemetry.'
              : 'Track reported issues in real-time, register for campus events, and reserve lab resources.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onOpenNewIssueModal} className="btn btn-primary">
            + Report Issue
          </button>
          <button onClick={() => setActiveTab('issues')} className="btn btn-secondary">
            View All Issues
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          title={isStaff ? "Active Open Issues" : "My Reported Issues"}
          value={isStaff ? kpis.activeIssues : recentIssues.length}
          subtitle={isStaff ? "Needs triage or in progress" : "Track progress live"}
          icon={Clock}
          color="indigo"
          badge={isStaff ? "Live" : undefined}
        />
        <StatCard
          title="Urgent Bottlenecks"
          value={kpis.urgentIssues}
          subtitle="Critical priority tickets"
          icon={Flame}
          color="rose"
        />
        <StatCard
          title="Resolution SLA Rate"
          value={`${kpis.resolutionRate}%`}
          subtitle="Target threshold: > 85%"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Active Campus Events"
          value={kpis.totalEvents}
          subtitle="Hackathons, talks & fairs"
          icon={CalendarDays}
          color="cyan"
        />
      </div>

      {/* 2-Column Section: Issues Queue & Upcoming Events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Issues List */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} color="#6366f1" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                {isStaff ? 'Recent Campus Tickets' : 'My Recent Activity'}
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('issues')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Explore All <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                No active issues found. Click "+ Report Issue" to submit your first ticket.
              </div>
            ) : (
              recentIssues.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectIssue(item.id)}
                  className="glass-panel-interactive"
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span className={`badge badge-${item.status}`} style={{ fontSize: '0.6875rem', padding: '1px 6px' }}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className={`badge badge-priority-${item.priority}`} style={{ fontSize: '0.6875rem', padding: '1px 6px' }}>
                        {item.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {item.location} • {item.student_name}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <MessageSquare size={14} />
                    <span>{item.comment_count || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Featured Campus Events */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={18} color="#06b6d4" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                Featured Campus Events
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('events')}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              All Events <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setActiveTab('events')}
                className="glass-panel-interactive"
                style={{
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    textAlign: 'center',
                    minWidth: '55px'
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#22d3ee', textTransform: 'uppercase' }}>
                    {new Date(evt.event_date).toLocaleString('default', { month: 'short' })}
                  </div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#ffffff' }}>
                    {new Date(evt.event_date).getDate()}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {evt.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {evt.location} • {evt.registered_count || 0} RSVPs
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
