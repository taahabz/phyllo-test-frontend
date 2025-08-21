import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  phylloUserId?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Auth API functions
export const authApi = {
  signup: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/signup', { email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  me: async (): Promise<{ user: User }> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Phyllo API functions
export const phylloApi = {
  createUser: async (): Promise<{ phylloUserId: string; message: string }> => {
    const response = await api.post('/api/phyllo/user');
    return response.data;
  },

  createSdkToken: async (): Promise<{ sdk_token: string; expires_at: string }> => {
    const response = await api.post('/api/phyllo/sdk-token');
    return response.data;
  },

  getAccounts: async (): Promise<{ accounts: any[]; total: number }> => {
    const response = await api.get('/api/phyllo/accounts');
    return response.data;
  },
};

// Insights API functions
export const insightsApi = {
  getAudience: async (accountId: string): Promise<{ accountId: string; audience: any; fetchedAt: string }> => {
    const response = await api.get(`/api/insights/${accountId}/audience`);
    return response.data;
  },
};

