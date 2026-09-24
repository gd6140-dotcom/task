const API_BASE = '/api';

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('campusflow_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    demoLogin: (role) => fetchWithAuth('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
    me: () => fetchWithAuth('/auth/me'),
    getStaff: () => fetchWithAuth('/auth/staff-members')
  },

  // Issues
  issues: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchWithAuth(`/issues${query ? `?${query}` : ''}`);
    },
    getById: (id) => fetchWithAuth(`/issues/${id}`),
    create: (issueData) => fetchWithAuth('/issues', { method: 'POST', body: JSON.stringify(issueData) }),
    update: (id, issueData) => fetchWithAuth(`/issues/${id}`, { method: 'PUT', body: JSON.stringify(issueData) }),
    updateStatus: (id, statusData) => fetchWithAuth(`/issues/${id}/status`, { method: 'PATCH', body: JSON.stringify(statusData) }),
    addComment: (id, content) => fetchWithAuth(`/issues/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
    delete: (id) => fetchWithAuth(`/issues/${id}`, { method: 'DELETE' }),
    getStats: () => fetchWithAuth('/issues/stats/overview')
  },

  // Events
  events: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchWithAuth(`/events${query ? `?${query}` : ''}`);
    },
    getById: (id) => fetchWithAuth(`/events/${id}`),
    create: (eventData) => fetchWithAuth('/events', { method: 'POST', body: JSON.stringify(eventData) }),
    register: (id) => fetchWithAuth(`/events/${id}/register`, { method: 'POST' }),
    cancelRegistration: (id) => fetchWithAuth(`/events/${id}/register`, { method: 'DELETE' }),
    delete: (id) => fetchWithAuth(`/events/${id}`, { method: 'DELETE' })
  },

  // Resources
  resources: {
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return fetchWithAuth(`/resources${query ? `?${query}` : ''}`);
    },
    getMyBookings: () => fetchWithAuth('/resources/bookings/my'),
    getAllBookings: () => fetchWithAuth('/resources/bookings/all'),
    book: (id, bookingData) => fetchWithAuth(`/resources/${id}/book`, { method: 'POST', body: JSON.stringify(bookingData) }),
    updateBookingStatus: (bookingId, data) => fetchWithAuth(`/resources/bookings/${bookingId}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
    create: (resourceData) => fetchWithAuth('/resources', { method: 'POST', body: JSON.stringify(resourceData) })
  },

  // Analytics
  analytics: {
    getSummary: () => fetchWithAuth('/analytics/summary')
  }
};
