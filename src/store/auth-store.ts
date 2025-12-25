import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserPreferences } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

// Mock user for demo purposes
const createMockUser = (email: string): User => ({
  id: Math.random().toString(36).substring(2, 15),
  email,
  createdAt: new Date(),
  lastLogin: new Date(),
  preferences: {
    targetUtilization: 5,
    reminderDaysBefore: 3,
    emailNotifications: true,
  },
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // For demo: accept any email/password
        void _password; // Used for actual authentication in production
        const user = createMockUser(email);
        set({ user, isAuthenticated: true, isLoading: false });

        // Update calculator store with user ID
        if (typeof window !== 'undefined') {
          const { useCalculatorStore } = await import('./calculator-store');
          useCalculatorStore.getState().setUserId(user.id);
        }

        return true;
      },

      signup: async (email: string, _password: string) => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        void _password; // Used for actual authentication in production
        const user = createMockUser(email);
        set({ user, isAuthenticated: true, isLoading: false });

        // Update calculator store with user ID
        if (typeof window !== 'undefined') {
          const { useCalculatorStore } = await import('./calculator-store');
          useCalculatorStore.getState().setUserId(user.id);
        }

        return true;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });

        // Clear calculator store data by setting userId to null (guest mode)
        if (typeof window !== 'undefined') {
          import('./calculator-store').then(({ useCalculatorStore }) => {
            useCalculatorStore.getState().setUserId(null);
          });
        }
      },

      updatePreferences: (preferences) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              preferences: {
                ...user.preferences,
                ...preferences,
              },
            },
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
