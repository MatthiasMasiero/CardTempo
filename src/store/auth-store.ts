import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserPreferences } from '@/types';
import { supabase } from '@/lib/supabase';

export type SignupResult =
  | { success: true; needsConfirmation: false }
  | { success: true; needsConfirmation: true }
  | { success: false; error: string };

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<SignupResult>;
  logout: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          // Sign in with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('Login error:', error.message);
            set({ isLoading: false });
            return false;
          }

          if (!data.user) {
            set({ isLoading: false });
            return false;
          }

          // Fetch user preferences from database
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            createdAt: new Date(data.user.created_at),
            lastLogin: new Date(),
            preferences: {
              targetUtilization: userData?.target_utilization * 100 || 5,
              reminderDaysBefore: userData?.reminder_days_before || 3,
              emailNotifications: userData?.email_notifications ?? true,
            },
          };

          set({ user, isAuthenticated: true, isLoading: false });

          // Update calculator store with user ID
          if (typeof window !== 'undefined') {
            const { useCalculatorStore } = await import('./calculator-store');
            useCalculatorStore.getState().setUserId(user.id);
          }

          // Update last_login in database
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);

          return true;
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      signup: async (email: string, password: string): Promise<SignupResult> => {
        set({ isLoading: true });

        try {
          // Sign up with Supabase
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });

          if (error) {
            console.error('Signup error:', error.message);
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          if (!data.user) {
            set({ isLoading: false });
            return { success: false, error: 'Failed to create account' };
          }

          // Check if email confirmation is required
          // If email_confirmed_at is null, user needs to confirm their email
          const needsConfirmation = !data.user.email_confirmed_at;

          if (needsConfirmation) {
            // Don't authenticate yet - user must confirm email first
            set({ isLoading: false });
            return { success: true, needsConfirmation: true };
          }

          // Email is already confirmed (happens if confirmation is disabled in Supabase)
          // Wait for trigger to create user in public.users
          await new Promise((resolve) => setTimeout(resolve, 500));

          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            createdAt: new Date(data.user.created_at),
            lastLogin: new Date(),
            preferences: {
              targetUtilization: 5,
              reminderDaysBefore: 3,
              emailNotifications: true,
            },
          };

          set({ user, isAuthenticated: true, isLoading: false });

          // Update calculator store with user ID
          if (typeof window !== 'undefined') {
            const { useCalculatorStore } = await import('./calculator-store');
            useCalculatorStore.getState().setUserId(user.id);
          }

          return { success: true, needsConfirmation: false };
        } catch (error) {
          console.error('Signup error:', error);
          set({ isLoading: false });
          return { success: false, error: 'An unexpected error occurred' };
        }
      },

      logout: async () => {
        // Sign out from Supabase
        await supabase.auth.signOut();

        set({ user: null, isAuthenticated: false });

        // Clear calculator store data by setting userId to null (guest mode)
        if (typeof window !== 'undefined') {
          import('./calculator-store').then(({ useCalculatorStore }) => {
            useCalculatorStore.getState().setUserId(null);
          });
        }
      },

      updatePreferences: async (preferences) => {
        const { user } = get();
        if (!user) return;

        try {
          // Update in database
          await supabase
            .from('users')
            .update({
              target_utilization: preferences.targetUtilization
                ? preferences.targetUtilization / 100
                : undefined,
              reminder_days_before: preferences.reminderDaysBefore,
              email_notifications: preferences.emailNotifications,
            })
            .eq('id', user.id);

          // Update local state
          set({
            user: {
              ...user,
              preferences: {
                ...user.preferences,
                ...preferences,
              },
            },
          });
        } catch (error) {
          console.error('Error updating preferences:', error);
        }
      },

      checkSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            // Fetch user data
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              createdAt: new Date(session.user.created_at),
              lastLogin: new Date(),
              preferences: {
                targetUtilization: userData?.target_utilization * 100 || 5,
                reminderDaysBefore: userData?.reminder_days_before || 3,
                emailNotifications: userData?.email_notifications ?? true,
              },
            };

            set({ user, isAuthenticated: true });

            // Update calculator store
            if (typeof window !== 'undefined') {
              const { useCalculatorStore } = await import('./calculator-store');
              useCalculatorStore.getState().setUserId(user.id);
            }
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Session check error:', error);
          set({ user: null, isAuthenticated: false });
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
