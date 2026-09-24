import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { 
  X, 
  MapPin, 
  User, 
  Clock, 
  Send, 
  CheckCircle, 
  RotateCcw, 
  ArrowRightCircle, 
  UserCheck, 
  ShieldAlert,
  Calendar,
  Layers,
  MessageSquare
} from 'lucide-react';

const WORKFLOW_STEPS = ['submitted', 'assigned', 'in_progress', 'resolved'];

export default function IssueDetailModal({ issueId, onClose, onIssueUpdated }) {
  const { user, isStaff, isStudent, showToast } = useAuth();
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [staffList, setStaffList] = useState([]);
  
  // Transition Form State
  const [selectedStatus, setSelectedStatus] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!issueId) return;
    loadIssueDetails();
    if (isStaff) {
      api.auth.getStaff().then((res) => {
        if (res.staff) setStaffList(res.staff);
      }).catch(console.error);
    }
  }, [issueId]);

  const loadIssueDetails = async () => {
    try {
      setLoading(true);
      const res = await api.issues.getById(issueId);
      setIssue(res.issue);
      setComments(res.comments);
      setSelectedStatus(res.issue.status);
      setAssignedToId(res.issue.assigned_to_id || '');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await api.issues.updateStatus(issueId, {
        status: newStatus,
        assigned_to_id: assignedToId || undefined,
        note: statusNote
      });

      setIssue(res.issue);
      setComments(res.comments);
      setStatusNote('');
      showToast(`Issue status transitioned to "${newStatus.toUpperCase()}"`, 'success');

      if (newStatus === 'resolved') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      if (onIssueUpdated) onIssueUpdated(res.issue);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.issues.addComment(issueId, commentText.trim());
      setComments(res.comments);
      setCommentText('');
      showToast('Comment added to audit timeline.', 'success');
      if (onIssueUpdated) onIssueUpdated(issue);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!issueId) return null;

  const currentStepIndex = issue ? WORKFLOW_STEPS.indexOf(issue.status) : 0;
  const isReopened = issue?.status === 'reopened';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        {loading || !issue ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem' }}>Loading issue audit details...</p>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className={`badge badge-${issue.status}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                  <span className={`badge badge-priority-${issue.priority}`}>
                    {issue.priority} priority
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Ticket #{issue.id}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3 }}>
                  {issue.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="btn btn-outline btn-sm"
                style={{ borderRadius: '8px', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Workflow Stepper */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  WORKFLOW PIPELINE PROGRESSION:
                </div>
                <div className="stepper-container">
                  <div className="stepper-line" />
                  <div
                    className="stepper-progress"
                    style={{
                      width: isReopened
                        ? '100%'
                        : currentStepIndex >= 0
                        ? `${(currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100}%`
                        : '0%'
                    }}
                  />
                  {WORKFLOW_STEPS.map((step, idx) => {
                    const isCompleted = !isReopened && currentStepIndex > idx;
                    const isActive = !isReopened && currentStepIndex === idx;

                    return (
                      <div key={step} className="step-item">
                        <div className={`step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <span className={`step-label ${isActive ? 'active' : ''}`}>
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {isReopened && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(244, 63, 94, 0.15)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: '#fb7185',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <RotateCcw size={14} /> Reopened by Student for secondary inspection.
                  </div>
                )}
              </div>

              {/* Description & Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <MapPin size={16} color="#06b6d4" />
                  <span><strong>Location:</strong> {issue.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <User size={16} color="#6366f1" />
                  <span><strong>Reported by:</strong> {issue.student_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <UserCheck size={16} color="#10b981" />
                  <span><strong>Assigned to:</strong> {issue.assigned_to_name || 'Unassigned'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <Clock size={16} color="#f59e0b" />
                  <span><strong>Created:</strong> {new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                  Problem Description
                </div>
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.875rem',
                    color: '#e2e8f0',
                    lineHeight: 1.6
                  }}
                >
                  {issue.description}
                </div>
              </div>

              {issue.image_url && (
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.375rem' }}>
                    Attachment / Photo Evidence
                  </div>
                  <img
                    src={issue.image_url}
                    alt={issue.title}
                    style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              )}

              {/* Workflow Action Transition Box */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(99, 102, 241, 0.25)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowRightCircle size={16} color="#818cf8" /> Workflow Actions
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {isStaff ? 'Staff / Admin Operator Controls' : 'Student Controls'}
                  </span>
                </div>

                {isStaff && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      <div>
                        <label className="input-label">Assign Technician / Staff</label>
                        <select
                          className="select-field"
                          value={assignedToId}
                          onChange={(e) => setAssignedToId(e.target.value)}
                        >
                          <option value="">-- Select Staff Member --</option>
                          {staffList.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.department})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="input-label">Transition Note (Optional)</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Dispatched technician to site"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        onClick={() => handleStatusTransition('assigned')}
                        disabled={updatingStatus || issue.status === 'assigned'}
                        className="btn btn-secondary btn-sm"
                      >
                        Set: Assigned
                      </button>
                      <button
                        onClick={() => handleStatusTransition('in_progress')}
                        disabled={updatingStatus || issue.status === 'in_progress'}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#8b5cf6' }}
                      >
                        Set: In Progress
                      </button>
                      <button
                        onClick={() => handleStatusTransition('resolved')}
                        disabled={updatingStatus || issue.status === 'resolved'}
                        className="btn btn-success btn-sm"
                      >
                        <CheckCircle size={14} /> Mark as Resolved
                      </button>
                      <button
                        onClick={() => handleStatusTransition('reopened')}
                        disabled={updatingStatus || issue.status === 'reopened'}
                        className="btn btn-danger btn-sm"
                      >
                        <RotateCcw size={14} /> Reopen Ticket
                      </button>
                    </div>
                  </div>
                )}

                {isStudent && (
                  <div>
                    {issue.status === 'resolved' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#34d399' }}>
                            ✓ Issue marked as Resolved
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            If the issue persists, you can reopen it with feedback.
                          </div>
                        </div>
                        <button
                          onClick={() => handleStatusTransition('reopened')}
                          disabled={updatingStatus}
                          className="btn btn-danger btn-sm"
                        >
                          <RotateCcw size={14} /> Reopen Issue
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Current status: <strong>{issue.status.replace('_', ' ').toUpperCase()}</strong>. Campus facilities staff has been notified.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timeline & Discussion */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                  <MessageSquare size={16} color="#818cf8" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ffffff' }}>
                    Activity Timeline & Comments ({comments.length})
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                    marginBottom: '1rem'
                  }}
                >
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem 1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc' }}>
                            {c.user_name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: c.user_role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : c.user_role === 'staff' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                              color: c.user_role === 'admin' ? '#c084fc' : c.user_role === 'staff' ? '#22d3ee' : '#a5b4fc'
                            }}
                          >
                            {c.user_role}
                          </span>
                          {c.status_change && (
                            <span className={`badge badge-${c.status_change}`} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                              Status: {c.status_change.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Instant Comment Input Form */}
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type an update or comment on this issue..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={submittingComment}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="btn btn-primary"
                    style={{ padding: '0.625rem 1rem' }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
