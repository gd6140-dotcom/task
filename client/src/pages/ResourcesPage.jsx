import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Layers, 
  Clock, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  PlusCircle, 
  Search,
  Check,
  X,
  ShieldCheck,
  Cpu,
  Monitor
} from 'lucide-react';

const CATEGORIES = [
  { id: '', label: 'All Resources' },
  { id: 'study_room', label: 'Study Rooms' },
  { id: 'lab_equipment', label: 'Lab & Compute Rigs' },
  { id: 'hardware_tool', label: 'Makerspace Tools' },
  { id: 'auditorium', label: 'Auditoriums' }
];

export default function ResourcesPage() {
  const { user, isStaff, isStudent, showToast } = useAuth();
  const [resources, setResources] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'my_bookings' | 'admin_queue'

  // Booking Modal State
  const [bookingResource, setBookingResource] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    start_time: '2026-10-15 14:00',
    end_time: '2026-10-15 17:00',
    purpose: ''
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory, searchQuery, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.resources.getAll({ category: selectedCategory || undefined, q: searchQuery });
      setResources(res.data || []);

      if (isStudent || isStaff) {
        const myRes = await api.resources.getMyBookings();
        setMyBookings(myRes.data || []);
      }

      if (isStaff) {
        const allRes = await api.resources.getAllBookings();
        setAdminBookings(allRes.data || []);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.purpose.trim()) {
      showToast('Please specify the purpose of your reservation.', 'error');
      return;
    }

    try {
      setSubmittingBooking(true);
      await api.resources.book(bookingResource.id, bookingForm);
      showToast('Reservation request submitted! Awaiting administrator approval.', 'success');
      setBookingResource(null);
      setBookingForm({ start_time: '2026-10-15 14:00', end_time: '2026-10-15 17:00', purpose: '' });
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleStatusChange = async (bookingId, status) => {
    try {
      await api.resources.updateBookingStatus(bookingId, {
        status,
        admin_notes: `Processed by ${user?.name || 'Staff'}`
      });
      showToast(`Reservation request marked as ${status}.`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Facilities, Labs & Equipment Directory
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Book group study pods, high-performance GPU servers, 3D printers, and event auditoriums.
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`btn btn-sm ${activeTab === 'catalog' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '4px 12px', border: 'none' }}
          >
            Directory Catalog
          </button>
          <button
            onClick={() => setActiveTab('my_bookings')}
            className={`btn btn-sm ${activeTab === 'my_bookings' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '4px 12px', border: 'none' }}
          >
            My Bookings ({myBookings.length})
          </button>
          {isStaff && (
            <button
              onClick={() => setActiveTab('admin_queue')}
              className={`btn btn-sm ${activeTab === 'admin_queue' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '4px 12px', border: 'none', color: activeTab === 'admin_queue' ? '#fff' : '#34d399' }}
            >
              Approval Queue ({adminBookings.filter(b => b.status === 'pending').length})
            </button>
          )}
        </div>
      </div>

      {activeTab === 'catalog' && (
        <>
          {/* Filters */}
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`btn btn-sm ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '9999px' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search resources..."
                className="input-field"
                style={{ paddingLeft: '30px', height: '34px', fontSize: '0.8125rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Resources Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '1rem' }}>Loading campus resources...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {resources.map((res) => {
                const isAvail = res.availability_status === 'available';
                const isMaint = res.availability_status === 'maintenance';

                return (
                  <div
                    key={res.id}
                    className="glass-panel"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ height: '140px', position: 'relative', background: '#1e293b' }}>
                      <img
                        src={res.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80'}
                        alt={res.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          background: isAvail ? 'rgba(16, 185, 129, 0.9)' : isMaint ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isAvail ? 'Available' : isMaint ? 'Maintenance' : 'Reserved'}
                      </div>
                    </div>

                    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3, marginBottom: '4px' }}>
                          {res.name}
                        </h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                          {res.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} color="#06b6d4" />
                          <span>{res.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#f59e0b" />
                          <span>Max booking slot: {res.max_duration_hours} hours</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setBookingResource(res)}
                        disabled={isMaint}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%' }}
                      >
                        {isMaint ? 'Under Scheduled Maintenance' : 'Reserve / Book Slot'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* My Bookings View */}
      {activeTab === 'my_bookings' && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
            My Facility Reservations
          </h2>

          {myBookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>You have no active reservation requests.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myBookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-color)',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9375rem' }}>{b.resource_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Slot: {b.start_time} to {b.end_time}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      Purpose: {b.purpose}
                    </div>
                    {b.admin_notes && (
                      <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '4px' }}>
                        Note: {b.admin_notes}
                      </div>
                    )}
                  </div>

                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background: b.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : b.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: b.status === 'approved' ? '#34d399' : b.status === 'rejected' ? '#f87171' : '#fbbf24',
                      border: '1px solid currentColor'
                    }}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Approval Queue */}
      {activeTab === 'admin_queue' && isStaff && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
            Facility Booking Approval Queue
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {adminBookings.map((b) => (
              <div
                key={b.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-color)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc' }}>{b.resource_name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• Requested by <strong>{b.user_name}</strong></span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Slot: {b.start_time} - {b.end_time} | Dept: {b.user_department || 'Student'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    Purpose: {b.purpose}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {b.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleStatusChange(b.id, 'approved')}
                        className="btn btn-success btn-sm"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(b.id, 'rejected')}
                        className="btn btn-danger btn-sm"
                      >
                        <X size={14} /> Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: b.status === 'approved' ? '#34d399' : '#f87171' }}>
                      {b.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {bookingResource && (
        <div className="modal-overlay" onClick={() => setBookingResource(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
                  Reserve {bookingResource.name}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Location: {bookingResource.location}
                </span>
              </div>
              <button onClick={() => setBookingResource(null)} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="input-label">Start Time *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="YYYY-MM-DD HH:MM"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="input-label">End Time *</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="YYYY-MM-DD HH:MM"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Booking Purpose / Project Name *</label>
                <textarea
                  rows={3}
                  required
                  className="textarea-field"
                  placeholder="e.g. Senior Capstone Project simulation test with 4 team members"
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setBookingResource(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingBooking} className="btn btn-primary">
                  {submittingBooking ? 'Submitting...' : 'Submit Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
