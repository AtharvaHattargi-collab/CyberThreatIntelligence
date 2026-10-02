const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000') + '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401) {
      if (error.detail) throw new Error(error.detail);
      localStorage.removeItem('auth_token');
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw new Error('Invalid username or password.');
    }
    throw new Error(error.detail || `HTTP Error ${response.status}`);
  }
  return response.json();
};

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Merge default headers with provided headers
  const headers = {
    ...getHeaders(),
    ...(options.headers || {})
  };

  // Content-Type shouldn't be set for FormData
  if (options.body instanceof URLSearchParams || options.body instanceof FormData) {
    if (headers['Content-Type'] === 'application/json') {
        delete headers['Content-Type'];
    }
    if (options.body instanceof URLSearchParams) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.message.includes('fetch')) {
      throw new Error('Unable to connect to the API server.');
    }
    throw error;
  }
}

export const authAPI = {
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: formData
    });
  },
  register: (data) => fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMe: () => fetchAPI('/auth/me')
};

export const usersAPI = {
  getUsers: () => fetchAPI('/users'),
  createUser: (data) => fetchAPI('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateRole: (id, role) => fetchAPI(`/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  }),
  toggleActive: (id) => fetchAPI(`/users/${id}/toggle-active`, {
    method: 'PUT'
  })
};

export const analyticsAPI = {
  getOverview: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/overview${query ? `?${query}` : ''}`);
  },
  getThreatDistribution: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/threat-distribution${query ? `?${query}` : ''}`);
  },
  getProtocolDistribution: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/protocol-distribution${query ? `?${query}` : ''}`);
  },
  getServiceDistribution: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/service-distribution${query ? `?${query}` : ''}`);
  },
  getTraffic: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/traffic${query ? `?${query}` : ''}`);
  },
  getSeverity: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/severity${query ? `?${query}` : ''}`);
  },
  getTrends: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/trends${query ? `?${query}` : ''}`);
  },
  getThreatProtocolMatrix: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/threat-protocol-matrix${query ? `?${query}` : ''}`);
  },
  getAttackRanking: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/analytics/attack-ranking${query ? `?${query}` : ''}`);
  }
};

export const eventsAPI = {
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/events${query ? `?${query}` : ''}`);
  },
  getEvent: (id) => fetchAPI(`/events/${id}`),
};

export const monitorAPI = {
  getRecent: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/monitor/recent${query ? `?${query}` : ''}`);
  },
  getStats: () => fetchAPI('/monitor/stats'),
};

export const incidentsAPI = {
  getIncidents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/incidents${query ? `?${query}` : ''}`);
  },
  getIncident: (id) => fetchAPI(`/incidents/${id}`),
  createIncident: (data) => fetchAPI(`/incidents`, {
    method: 'POST', body: JSON.stringify(data)
  }),
  uploadIncidentPdf: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetchAPI('/incidents/upload', {
      method: 'POST',
      body: formData
    });
  },
  updateIncident: (id, data) => fetchAPI(`/incidents/${id}`, {
    method: 'PUT', body: JSON.stringify(data)
  }),
  updateStatus: (id, status) => fetchAPI(`/incidents/${id}/status`, {
    method: 'POST', body: JSON.stringify({ status })
  }),
  addNote: (id, content, author = 'Analyst') => fetchAPI(`/incidents/${id}/notes`, {
    method: 'POST', body: JSON.stringify({ content, author })
  }),
};

export const mlAPI = {
  predict: (data) => fetchAPI('/ml/predict', { method: 'POST', body: JSON.stringify(data) }),
  getPerformance: () => fetchAPI('/ml/performance'),
  getFeatureImportance: () => fetchAPI('/ml/feature-importance'),
  getSample: () => fetchAPI('/ml/sample'),
};

export const healthAPI = {
  check: () => fetchAPI('/health'),
  database: () => fetchAPI('/database/health'),
};

export const systemAPI = {
  checkHealth: () => fetchAPI('/health'),
  checkDatabaseHealth: () => fetchAPI('/database/health')
};
