import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  Kanban, 
  PlusCircle, 
  RefreshCw, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  User,
  MapPin,
  Tag
} from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'submitted', label: 'Submitted', color: '#f59e0b' },
  { id: 'assigned', label: 'Assigned', color: '#3b82f6' },
  { id: 'in_progress', label: 'In Progress', color: '#8b5cf6' },
  { id: 'resolved', label: 'Resolved', color: '#10b981' },
  { id: 'reopened', label: 'Reopened', color: '#f43f5e' }
];

export default function IssuesPage({ onSelectIssue, onOpenNewIssueModal }) {
  const { user, isStaff, isStudent, showToast } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'list'
  
  // Filters & Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [myIssuesOnly, setMyIssuesOnly] = useState(false);
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    fetchIssues();
  }, [searchQuery, selectedStatus, selectedCategory, selectedPriority, myIssuesOnly, assignedToMeOnly, page]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: viewMode === 'board' ? 50 : 10,
        q: searchQuery,
        status: selectedStatus,
        category: selectedCategory,
        priority: selectedPriority,
        myIssues: myIssuesOnly ? 'true' : 'false',
        assignedToMe: assignedToMeOnly ? 'true' : 'false'
      };
      const res = await api.issues.getAll(params);
      setIssues(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedCategory('');
    setSelectedPriority('');
    setMyIssuesOnly(false);
    setAssignedToMeOnly(false);
    setPage(1);
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Campus Issue Management & Workflow
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Track, triage, inspect, and resolve facilities, IT, and campus maintenance tickets.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* View Toggle */}
          <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('board')}
              className="btn btn-sm"
              style={{
                background: viewMode === 'board' ? '#6366f1' : 'transparent',
                color: viewMode === 'board' ? '#fff' : '#94a3b8',
                padding: '4px 10px'
              }}
            >
              <Kanban size={15} /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="btn btn-sm"
              style={{
                background: viewMode === 'list' ? '#6366f1' : 'transparent',
                color: viewMode === 'list' ? '#fff' : '#94a3b8',
                padding: '4px 10px'
              }}
            >
              <LayoutGrid size={15} /> Table
            </button>
          </div>

          <button onClick={onOpenNewIssueModal} className="btn btn-primary">
            <PlusCircle size={16} /> New Issue
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by title, room, description..."
              style={{ paddingLeft: '36px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="select-field"
            style={{ width: 'auto', minWidth: '130px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="it_support">IT Support</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="academic">Academic</option>
            <option value="hostel">Hostel</option>
            <option value="cafeteria">Cafeteria</option>
            <option value="library">Library</option>
          </select>

          <select
            className="select-field"
            style={{ width: 'auto', minWidth: '120px' }}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {viewMode === 'list' && (
            <select
              className="select-field"
              style={{ width: 'auto', minWidth: '130px' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="reopened">Reopened</option>
            </select>
          )}

          <button
            onClick={() => setMyIssuesOnly(!myIssuesOnly)}
            className={`btn btn-sm ${myIssuesOnly ? 'btn-primary' : 'btn-secondary'}`}
          >
            My Issues
          </button>

          {isStaff && (
            <button
              onClick={() => setAssignedToMeOnly(!assignedToMeOnly)}
              className={`btn btn-sm ${assignedToMeOnly ? 'btn-primary' : 'btn-secondary'}`}
            >
              Assigned to Me
            </button>
          )}

          <button onClick={handleResetFilters} title="Reset filters" className="btn btn-outline btn-sm">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main View: Board vs Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem' }}>Loading ticket pipeline...</p>
        </div>
      ) : viewMode === 'board' ? (
        /* Kanban Board View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            alignItems: 'start'
          }}
        >
          {KANBAN_COLUMNS.map((col) => {
            const colIssues = issues.filter((i) => i.status === col.id);

            return (
              <div
                key={col.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.875rem',
                  minHeight: '400px'
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>
                      {col.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {colIssues.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {colIssues.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                      No tickets in this phase
                    </div>
                  ) : (
                    colIssues.map((issue) => (
                      <div
                        key={issue.id}
                        onClick={() => onSelectIssue(issue.id)}
                        className="glass-panel-interactive"
                        style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.625rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span className={`badge badge-priority-${issue.priority}`} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                            {issue.priority}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                            #{issue.id}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                          {issue.title}
                        </div>

                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {issue.description}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-dim)', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <MapPin size={12} /> {issue.location}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MessageSquare size={12} /> {issue.comment_count || 0}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table / List View */
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '0.5rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 1rem' }}>ID & Title</th>
                <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Assignee</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s ease' }}
                  className="hover:bg-slate-800/40"
                >
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{issue.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>by {issue.student_name}</div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textTransform: 'capitalize', color: 'var(--text-muted)' }}>
                    {issue.category.replace('_', ' ')}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge badge-priority-${issue.priority}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge badge-${issue.status}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)' }}>
                    {issue.location}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)' }}>
                    {issue.assigned_to_name || '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button
                      onClick={() => onSelectIssue(issue.id)}
                      className="btn btn-secondary btn-sm"
                    >
                      View Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Table Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Showing {issues.length} of {pagination.total} total tickets
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="btn btn-outline btn-sm"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn btn-outline btn-sm"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
