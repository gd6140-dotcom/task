import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { 
  CalendarDays, 
  MapPin, 
  Users, 
  Clock, 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  Tag, 
  Search,
  Sparkles,
  X
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'technical', label: 'Technical & Coding' },
  { id: 'workshop', label: 'Workshops & Labs' },
  { id: 'career', label: 'Careers & Fairs' },
  { id: 'sports', label: 'Sports & Athletics' },
  { id: 'academic', label: 'Academic Seminars' },
  { id: 'cultural', label: 'Cultural & Arts' }
];

export default function EventsPage() {
  const { user, isStaff, showToast } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [myRsvpsOnly, setMyRsvpsOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    category: 'technical',
    organizer: '',
    location: '',
    event_date: '',
    start_time: '10:00',
    end_time: '12:00',
    capacity: 100,
    banner_url: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [activeCategory, searchQuery, myRsvpsOnly]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = {
        category: activeCategory === 'all' ? undefined : activeCategory,
        q: searchQuery,
        myRegistered: myRsvpsOnly ? 'true' : 'false'
      };
      const res = await api.events.getAll(params);
      setEvents(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId, title) => {
    try {
      await api.events.register(eventId);
      showToast(`Registered for "${title}"! See you there! 🎉`, 'success');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
      loadEvents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCancelRegister = async (eventId) => {
    try {
      await api.events.cancelRegistration(eventId);
      showToast('RSVP reservation cancelled.', 'info');
      loadEvents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await api.events.create(newEvent);
      showToast('Campus Event successfully published!', 'success');
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        category: 'technical',
        organizer: '',
        location: '',
        event_date: '',
        start_time: '10:00',
        end_time: '12:00',
        capacity: 100,
        banner_url: ''
      });
      loadEvents();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Campus Events & Student Activities
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Discover workshops, hackathons, guest lectures, sports tournaments, and career fairs.
          </p>
        </div>

        {isStaff && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <PlusCircle size={16} /> Publish Campus Event
          </button>
        )}
      </div>

      {/* Category Pills & Search Filter */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '9999px' }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search events..."
                className="input-field"
                style={{ paddingLeft: '32px', fontSize: '0.8125rem', height: '34px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setMyRsvpsOnly(!myRsvpsOnly)}
              className={`btn btn-sm ${myRsvpsOnly ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', height: '34px' }}
            >
              My RSVPs
            </button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem' }}>Loading campus events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <CalendarDays size={36} color="#6366f1" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ fontWeight: 600, color: '#f8fafc' }}>No campus events match your query.</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginTop: '4px' }}>Try switching categories or clearing search filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {events.map((evt) => {
            const isFull = evt.registered_count >= evt.capacity;
            const fillPercentage = Math.min(100, Math.round((evt.registered_count / evt.capacity) * 100));

            return (
              <div
                key={evt.id}
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: evt.is_user_registered ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)'
                }}
              >
                {/* Banner Thumbnail */}
                <div style={{ position: 'relative', height: '140px', background: '#1e293b' }}>
                  <img
                    src={evt.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80'}
                    alt={evt.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      color: '#22d3ee',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(6, 182, 212, 0.3)'
                    }}
                  >
                    {evt.category}
                  </div>
                  {evt.is_user_registered === 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(16, 185, 129, 0.9)',
                        color: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <CheckCircle2 size={12} /> Registered
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3, marginBottom: '6px' }}>
                      {evt.title}
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {evt.description}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CalendarDays size={14} color="#6366f1" />
                      <span>{new Date(evt.event_date).toDateString()} • {evt.start_time} - {evt.end_time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#06b6d4" />
                      <span>{evt.location}</span>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Capacity Status</span>
                      <span><strong>{evt.registered_count}</strong> / {evt.capacity} seats</span>
                    </div>
                    <div style={{ height: '6px', background: '#334155', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${fillPercentage}%`,
                          background: isFull ? '#ef4444' : fillPercentage > 75 ? '#f59e0b' : 'linear-gradient(90deg, #6366f1, #06b6d4)'
                        }}
                      />
                    </div>
                  </div>

                  {/* RSVP Action */}
                  <div>
                    {evt.is_user_registered === 1 ? (
                      <button
                        onClick={() => handleCancelRegister(evt.id)}
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                      >
                        Cancel My RSVP
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(evt.id, evt.title)}
                        disabled={isFull}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                      >
                        {isFull ? 'Event Full (Waitlist)' : '1-Click RSVP'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
                Publish New Campus Event
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="input-label">Event Title *</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. AI Agents & LLM Builders Workshop"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">Category *</label>
                  <select
                    className="select-field"
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                  >
                    <option value="technical">Technical</option>
                    <option value="workshop">Workshop</option>
                    <option value="career">Career</option>
                    <option value="sports">Sports</option>
                    <option value="academic">Academic</option>
                    <option value="cultural">Cultural</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Max Capacity (Seats) *</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    required
                    className="input-field"
                    value={newEvent.capacity}
                    onChange={(e) => setNewEvent({ ...newEvent, capacity: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">Date *</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">Start Time *</label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">End Time *</label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Organizer & Location *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Host / Department"
                    value={newEvent.organizer}
                    onChange={(e) => setNewEvent({ ...newEvent, organizer: e.target.value })}
                  />
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="Auditorium / Lab Room"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Description *</label>
                <textarea
                  rows={3}
                  required
                  className="textarea-field"
                  placeholder="Event agenda, requirements, prerequisites, prizes..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
