import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = 'http://localhost:8000'; // Kong gateway

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const tokens = useAuthStore.getState().tokens;
    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = useAuthStore.getState().tokens;
        if (tokens?.refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          const newTokens = response.data.data;
          useAuthStore.getState().updateTokens(newTokens);

          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/api/v1/auth/login', { email, password }),
  
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    apiClient.post('/api/v1/auth/register', data),
  
  logout: () => apiClient.post('/api/v1/auth/logout'),
  
  refreshToken: (refreshToken: string) =>
    apiClient.post('/api/v1/auth/refresh', { refreshToken }),
  
  getProfile: () => apiClient.get('/api/v1/users/profile'),
  
  updateProfile: (data: Partial<{ firstName: string; lastName: string; dateOfBirth: string }>) =>
    apiClient.put('/api/v1/users/profile', data),
  
  updateSettings: (data: Partial<{ glucoseUnit: string; targetRangeMin: number; targetRangeMax: number }>) =>
    apiClient.put('/api/v1/users/settings', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/api/v1/users/change-password', { currentPassword, newPassword }),
};

// Food API
export const foodApi = {
  searchFoods: (query: string) =>
    apiClient.get(`/api/v1/food/search?q=${encodeURIComponent(query)}`),

  logMeal: (data: { foods: Array<{ name: string; carbs: number }>; totalCarbs: number }) =>
    apiClient.post('/api/v1/meals', data),

  getMeals: (limit: number = 20) =>
    apiClient.get(`/api/v1/meals?limit=${limit}`),
};

// Insulin API
export const insulinApi = {
  logDose: (data: { units: number; carbDose: number; correctionDose: number; glucoseAtTime: number }) =>
    apiClient.post('/api/v1/insulin/doses', data),

  getHistory: (limit: number = 20) =>
    apiClient.get(`/api/v1/insulin/doses?limit=${limit}`),
};

// CGM API
export const cgmApi = {
  getCurrentReading: () => apiClient.get('/api/v1/cgm/current'),
  
  getHistory: (hours: number = 24) => 
    apiClient.get(`/api/v1/cgm/history?hours=${hours}`),
  
  getTrends: (hours: number = 3) =>
    apiClient.get(`/api/v1/cgm/trends?hours=${hours}`),
  
  simulateReading: (glucoseValue?: number) =>
    apiClient.post('/api/v1/cgm/simulate', { glucoseValue }),
};

export default apiClient;
