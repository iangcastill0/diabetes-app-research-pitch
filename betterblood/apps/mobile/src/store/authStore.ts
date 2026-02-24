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

interface DoseSettings {
  icr: number;          // Insulin-to-carb ratio (g per unit)
  isf: number;          // Insulin sensitivity factor (mg/dL per unit)
  targetBG: number;     // Target blood glucose (mg/dL)
  targetRangeMin: number;
  targetRangeMax: number;
  glucoseUnit: 'mg_dl' | 'mmol_l';
}

export interface MealLog {
  id: string;
  foods: Array<{ name: string; carbs: number }>;
  totalCarbs: number;
  timestamp: string;
}

export interface InsulinLog {
  id: string;
  units: number;
  carbs: number;
  carbDose: number;
  correctionDose: number;
  glucoseAtTime: number;
  timestamp: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  doseSettings: DoseSettings;
  mealLogs: MealLog[];
  insulinLogs: InsulinLog[];

  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  updateTokens: (tokens: AuthTokens) => void;
  updateUser: (user: Partial<User>) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  initializeAuth: () => Promise<void>;
  updateDoseSettings: (settings: Partial<DoseSettings>) => void;
  logMeal: (meal: Omit<MealLog, 'id' | 'timestamp'>) => void;
  logInsulin: (dose: Omit<InsulinLog, 'id' | 'timestamp'>) => InsulinLog;
  deleteInsulinLog: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: true, // TODO: restore to false when backend is connected
      user: null,
      tokens: null,
      isLoading: false,
      error: null,
      doseSettings: {
        icr: 10,
        isf: 50,
        targetBG: 120,
        targetRangeMin: 70,
        targetRangeMax: 180,
        glucoseUnit: 'mg_dl' as const,
      },
      mealLogs: [],
      insulinLogs: [],

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

      updateDoseSettings: (settings) => {
        set((state) => ({
          doseSettings: { ...state.doseSettings, ...settings },
        }));
      },

      logMeal: (meal) => {
        const entry: MealLog = {
          ...meal,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ mealLogs: [entry, ...state.mealLogs].slice(0, 100) }));
      },

      logInsulin: (dose) => {
        const entry: InsulinLog = {
          ...dose,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ insulinLogs: [entry, ...state.insulinLogs].slice(0, 100) }));
        return entry;
      },

      deleteInsulinLog: (id) => {
        set((state) => ({
          insulinLogs: state.insulinLogs.filter((log) => log.id !== id),
        }));
      },

      initializeAuth: async () => {
        // TODO: restore real auth check when backend is connected
        set({ isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        tokens: state.tokens,
        doseSettings: state.doseSettings,
        mealLogs: state.mealLogs,
        insulinLogs: state.insulinLogs,
      }),
    }
  )
);
