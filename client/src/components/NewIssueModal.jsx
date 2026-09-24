import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { X, PlusCircle, Sparkles, Image, MapPin, Tag, AlertTriangle } from 'lucide-react';

const CATEGORIES = [
  { id: 'it_support', label: 'IT & Network Support' },
  { id: 'infrastructure', label: 'Infrastructure & Electrical' },
  { id: 'academic', label: 'Academic & Classrooms' },
  { id: 'hostel', label: 'Hostel & Residence' },
  { id: 'cafeteria', label: 'Cafeteria & Dining' },
  { id: 'library', label: 'Library Facilities' },
  { id: 'other', label: 'Other Campus Services' }
];

const SAMPLE_IMAGE_PRESETS = [
  { label: 'Network/Wi-Fi', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=80' },
  { label: 'HVAC/Lab', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80' },
  { label: 'Classroom Projector', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=80' },
  { label: 'Water/Plumbing', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=500&auto=format&fit=crop&q=80' }
];

export default function NewIssueModal({ onClose, onIssueCreated }) {
  const { showToast } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'it_support',
    priority: 'medium',
    location: '',
    image_url: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.location) {
      showToast('Please fill in title, description, and location.', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await api.issues.create(formData);
      showToast('Issue submitted successfully to CampusFlow!', 'success');
      if (onIssueCreated) onIssueCreated(res.issue);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} color="#6366f1" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>
              Report Campus Issue
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '6px', borderRadius: '8px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="input-label">Issue Title *</label>
            <input
              type="text"
              required
              className="input-field"
              placeholder="e.g. Broken AC unit in Turing Lab 301"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="input-label">Category *</label>
              <select
                className="select-field"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Priority Level *</label>
              <select
                className="select-field"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low - Minor Inconvenience</option>
                <option value="medium">Medium - Standard Resolution</option>
                <option value="high">High - High Impact</option>
                <option value="urgent">Urgent - Blocking/Safety Hazard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Specific Location / Room / Building *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Science Block B, Room 204"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Detailed Description *</label>
            <textarea
              required
              rows={4}
              className="textarea-field"
              placeholder="Describe the issue, symptoms, frequency, and any urgent context..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="input-label">Photo Evidence URL (Optional)</label>
            <input
              type="url"
              className="input-field"
              placeholder="https://images.unsplash.com/..."
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Sample Presets:</span>
              {SAMPLE_IMAGE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, image_url: preset.url })}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
