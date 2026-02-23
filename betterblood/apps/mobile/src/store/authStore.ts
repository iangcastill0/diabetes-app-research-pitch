import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  settings: {
    glucoseUnit: 'mg_dl' | 'mmol_l';
    targetRangeMin: number;
    targetRangeMax: number;
  };
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateTokens: (tokens: AuthTokens) => void;
  updateUser: (user: Partial<User>) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      tokens: null,
      isLoading: false,
      error: null,

      setAuth: (user, tokens) => {
        set({
          isAuthenticated: true,
          user,
          tokens,
          error: null,
        });
      },

      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          tokens: null,
          error: null,
        });
      },

      updateTokens: (tokens) => {
        set({ tokens });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),

      initializeAuth: async () => {
        // Check if we have stored auth data
        // This is handled automatically by persist middleware
        // But we can add additional validation here
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
