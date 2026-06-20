const API_BASE_URL = 'http://localhost:5000/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'HEAD_SCOUT' | 'SCOUT';
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  age: number;
  club: string;
  nationality: string;
  height: number;
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
  photoUrl: string | null;
  technique: number;
  speed: number;
  physicality: number;
  creativity: number;
  mentality: number;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  isWatched?: boolean;
  reports?: ScoutingReport[];
  videos?: Video[];
}

export interface ScoutingReport {
  id: number;
  playerId: number;
  player?: {
    firstName: string;
    lastName: string;
    position: string;
    club: string;
  };
  authorId: number;
  author: {
    username: string;
    role: string;
  };
  strengths: string;
  weaknesses: string;
  potential: string;
  recommendation: string;
  aiDescription: string | null;
  aiDevelopmentSuggestion: string | null;
  aiComparison: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: number;
  playerId: number;
  title: string;
  videoUrl: string;
  uploadedById: number;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  read: boolean;
  createdAt: string;
}

// Token helpers
export const getToken = () => localStorage.getItem('scout_pro_token');
export const setToken = (token: string) => localStorage.setItem('scout_pro_token', token);
export const removeToken = () => localStorage.removeItem('scout_pro_token');

// API request wrapper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Auto-detect JSON payload unless it's FormData (which needs boundary set by browser)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      const res = await request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(res.token);
      return res.user;
    },
    register: async (username: string, email: string, password: string, role?: string) => {
      const res = await request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, role }),
      });
      setToken(res.token);
      return res.user;
    },
    me: async () => {
      return request<User>('/auth/me');
    },
    logout: () => {
      removeToken();
    },
  },

  players: {
    list: async (filters: {
      ageMin?: number;
      ageMax?: number;
      position?: string;
      nationality?: string;
      club?: string;
      potential?: string;
    } = {}) => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          params.append(key, String(val));
        }
      });
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<Player[]>(`/players${query}`);
    },
    get: async (id: number) => {
      return request<Player>(`/players/${id}`);
    },
    create: async (formData: FormData) => {
      return request<Player>('/players', {
        method: 'POST',
        body: formData,
      });
    },
    update: async (id: number, formData: FormData) => {
      return request<Player>(`/players/${id}`, {
        method: 'PUT',
        body: formData,
      });
    },
    delete: async (id: number) => {
      return request<{ message: string }>(`/players/${id}`, {
        method: 'DELETE',
      });
    },
    uploadVideo: async (id: number, title: string, file: File) => {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title);
      return request<Video>(`/players/${id}/videos`, {
        method: 'POST',
        body: formData,
      });
    },
    deleteVideo: async (playerId: number, videoId: number) => {
      return request<{ message: string }>(`/players/${playerId}/videos/${videoId}`, {
        method: 'DELETE',
      });
    },
  },

  reports: {
    list: async () => {
      return request<ScoutingReport[]>('/reports');
    },
    get: async (id: number) => {
      return request<ScoutingReport>(`/reports/${id}`);
    },
    listForPlayer: async (playerId: number) => {
      return request<ScoutingReport[]>(`/reports/player/${playerId}`);
    },
    create: async (data: {
      playerId: number;
      strengths: string;
      weaknesses: string;
      potential: string;
      recommendation: string;
      generateAI: boolean;
    }) => {
      return request<ScoutingReport>('/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: number, data: {
      strengths?: string;
      weaknesses?: string;
      potential?: string;
      recommendation?: string;
      generateAI?: boolean;
    }) => {
      return request<ScoutingReport>(`/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: number) => {
      return request<{ message: string }>(`/reports/${id}`, {
        method: 'DELETE',
      });
    },
  },

  watchlist: {
    list: async () => {
      return request<Player[]>('/watchlist');
    },
    toggle: async (playerId: number) => {
      return request<{ watched: boolean; message: string }>(`/watchlist/${playerId}`, {
        method: 'POST',
      });
    },
  },

  notifications: {
    list: async () => {
      return request<Notification[]>('/notifications');
    },
    markAllRead: async () => {
      return request<{ message: string }>('/notifications/read-all', {
        method: 'PUT',
      });
    },
    markRead: async (id: number) => {
      return request<Notification>(`/notifications/${id}/read`, {
        method: 'PUT',
      });
    },
  },

  users: {
    list: async () => {
      return request<User[]>('/users');
    },
    updateRole: async (id: number, role: 'ADMIN' | 'HEAD_SCOUT' | 'SCOUT') => {
      return request<User>(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
    },
  },
};
