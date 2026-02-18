import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      // But don't redirect if we're already on the login page
      if (!window.location.pathname.includes('/login')) {
        console.error('API returned 401 - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('admissionNumber');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  // Auth
  auth: {
    sendOTP: (admissionNumber: string) =>
      apiClient.post('/auth/send-otp', { admissionNumber }),
    
    verifyOTP: (admissionNumber: string, otp: string) =>
      apiClient.post('/auth/verify-otp', { admissionNumber, otp }),
    
    logout: () =>
      apiClient.post('/auth/logout'),
    
    me: () =>
      apiClient.get('/auth/me'),
  },

  // Users
  users: {
    getProfile: () =>
      apiClient.get('/users/profile'),
    
    updateProfile: (data: any) =>
      apiClient.put('/users/profile', data),
    
    getProgress: () =>
      apiClient.get('/users/progress'),
    
    getCurrentPhase: () =>
      apiClient.get('/users/current-phase'),
    
    advancePhase: () =>
      apiClient.post('/users/advance-phase'),
    
    getDashboard: () =>
      apiClient.get('/users/dashboard'),
    
    initialize: () =>
      apiClient.post('/users/initialize'),
  },

  // Tasks
  tasks: {
    getAll: () =>
      apiClient.get('/tasks'),
    
    getByPhase: (phase: string) =>
      apiClient.get(`/tasks/phase/${phase}`),
    
    getProgress: () =>
      apiClient.get('/tasks/progress'),
    
    getAvailable: () =>
      apiClient.get('/tasks/available'),
    
    getNext: () =>
      apiClient.get('/tasks/next'),
    
    getOverdue: () =>
      apiClient.get('/tasks/overdue'),
    
    getById: (id: string) =>
      apiClient.get(`/tasks/${id}`),
    
    updateStatus: (id: string, status: string) =>
      apiClient.patch(`/tasks/${id}/status`, { status }),
    
    updateDeadline: (id: string, deadline: string) =>
      apiClient.patch(`/tasks/${id}/deadline`, { deadline }),
    
    addNotes: (id: string, notes: string) =>
      apiClient.patch(`/tasks/${id}/notes`, { notes }),
  },

  // Documents
  documents: {
    upload: (formData: FormData) =>
      apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    
    getAll: () =>
      apiClient.get('/documents'),
    
    getById: (id: string) =>
      apiClient.get(`/documents/${id}`),
    
    getByType: (type: string) =>
      apiClient.get(`/documents/type/${type}`),
    
    delete: (id: string) =>
      apiClient.delete(`/documents/${id}`),
    
    getPending: (limit?: number) =>
      apiClient.get('/documents/pending/verification', { params: { limit } }),
  },

  // Chat
  chat: {
    createConversation: (title?: string) =>
      apiClient.post('/chat/conversations', { title }),
    
    getConversations: (limit?: number) =>
      apiClient.get('/chat/conversations', { params: { limit } }),
    
    getConversation: (id: string) =>
      apiClient.get(`/chat/conversations/${id}`),
    
    sendMessage: (conversationId: string, content: string, options?: any) =>
      apiClient.post('/chat/message', { conversationId, content, ...options }),
    
    getMessages: (conversationId: string, limit?: number) =>
      apiClient.get(`/chat/conversations/${conversationId}/messages`, { params: { limit } }),
    
    deleteConversation: (id: string) =>
      apiClient.delete(`/chat/conversations/${id}`),
  },

  // Notifications
  notifications: {
    getAll: (limit?: number, unreadOnly?: boolean) =>
      apiClient.get('/notifications', { params: { limit, unreadOnly } }),
    
    markAsRead: (id: string) =>
      apiClient.post(`/notifications/${id}/read`),
    
    markAllAsRead: () =>
      apiClient.post('/notifications/read-all'),
  },

  // Social/Tribe
  social: {
    getCategories: () =>
      apiClient.get('/social/categories'),
    
    submitInterests: (interests: any[]) =>
      apiClient.post('/social/interests', { interests }),
    
    getMatches: (limit?: number) =>
      apiClient.get('/social/matches', { params: { limit } }),
    
    respondToMatch: (id: string, response: 'accepted' | 'declined' | 'maybe_later') =>
      apiClient.post(`/social/matches/${id}/respond`, { response }),
    
    getConnections: () =>
      apiClient.get('/social/connections'),
    
    findMatches: () =>
      apiClient.post('/social/find-matches'),
  },

  // Admin
  admin: {
    getQueue: (status?: string, limit?: number) =>
      apiClient.get('/admin/queue', { params: { status, limit } }),
    
    approveDocument: (id: string, notes?: string) =>
      apiClient.post(`/admin/documents/${id}/approve`, { notes }),
    
    rejectDocument: (id: string, reason: string) =>
      apiClient.post(`/admin/documents/${id}/reject`, { reason }),
    
    getFunnelAnalytics: () =>
      apiClient.get('/admin/analytics/funnel'),
    
    getSentimentAlerts: () =>
      apiClient.get('/admin/sentiment/alerts'),
    
    getSentimentTrends: (days?: number) =>
      apiClient.get('/admin/sentiment/trends', { params: { days } }),
    
    uploadToKnowledgeBase: (documents: any[]) =>
      apiClient.post('/admin/knowledge/upload', { documents }),
    
    sendBulkNotifications: (userIds: string[], notification: any) =>
      apiClient.post('/admin/notifications/bulk', { userIds, notification }),
    
    getQueueStats: () =>
      apiClient.get('/admin/queue/stats'),
    
    getUsers: (filters?: any) =>
      apiClient.get('/admin/users', { params: filters }),
  },
};

export default api;
