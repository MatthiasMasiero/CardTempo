import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CreditCard, OptimizationResult } from '@/types';
import { calculateOptimization, generateId } from '@/lib/calculator';

interface CalculatorState {
  cards: CreditCard[];
  result: OptimizationResult | null;
  targetUtilization: number;
  currentUserId: string | null;

  // Actions
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCard: (id: string, card: Partial<CreditCard>) => void;
  removeCard: (id: string) => void;
  clearCards: () => void;
  setTargetUtilization: (value: number) => void;
  calculateResults: () => void;
  clearResults: () => void;
  setUserId: (userId: string | null) => void;
}

// Helper to get user-specific storage key
const getUserStorageKey = (userId: string | null) => {
  return userId ? `credit-optimizer-${userId}` : 'credit-optimizer-guest';
};

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      cards: [],
      result: null,
      targetUtilization: 0.05, // 5% default
      currentUserId: null,

      addCard: (card) => {
        const newCard: CreditCard = {
          ...card,
          id: generateId(),
        };
        set((state) => ({ cards: [...state.cards, newCard] }));
      },

      updateCard: (id, updatedCard) => {
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? { ...card, ...updatedCard } : card
          ),
        }));
      },

      removeCard: (id) => {
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        }));
      },

      clearCards: () => {
        set({ cards: [], result: null });
      },

      setTargetUtilization: (value) => {
        set({ targetUtilization: value });
      },

      calculateResults: () => {
        const { cards, targetUtilization } = get();
        if (cards.length === 0) {
          set({ result: null });
          return;
        }
        const result = calculateOptimization(cards, targetUtilization);
        set({ result });
      },

      clearResults: () => {
        set({ result: null });
      },

      setUserId: (userId) => {
        const currentUserId = get().currentUserId;

        // If userId changed, clear the current data and load user-specific data
        if (userId !== currentUserId) {
          set({ currentUserId: userId, cards: [], result: null });

          // Load user-specific data from localStorage
          if (typeof window !== 'undefined') {
            const storageKey = getUserStorageKey(userId);
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                const { state } = JSON.parse(stored);
                set({
                  cards: state.cards || [],
                  targetUtilization: state.targetUtilization || 0.05,
                });
              } catch (e) {
                console.error('Failed to parse stored data:', e);
              }
            }
          }
        }
      },
    }),
    {
      name: 'credit-optimizer-storage',
      partialize: (state) => ({
        cards: state.cards,
        targetUtilization: state.targetUtilization,
      }),
      // Use dynamic storage name based on user ID
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          const state = useCalculatorStore.getState();
          const key = getUserStorageKey(state.currentUserId);
          const str = localStorage.getItem(key);
          return str;
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          const state = useCalculatorStore.getState();
          const key = getUserStorageKey(state.currentUserId);
          localStorage.setItem(key, value);
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          const state = useCalculatorStore.getState();
          const key = getUserStorageKey(state.currentUserId);
          localStorage.removeItem(key);
        },
      },
    }
  )
);
