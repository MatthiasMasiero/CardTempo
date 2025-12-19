import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CreditCard, OptimizationResult } from '@/types';
import { calculateOptimization, generateId } from '@/lib/calculator';

interface CalculatorState {
  cards: CreditCard[];
  result: OptimizationResult | null;
  targetUtilization: number;

  // Actions
  addCard: (card: Omit<CreditCard, 'id'>) => void;
  updateCard: (id: string, card: Partial<CreditCard>) => void;
  removeCard: (id: string) => void;
  clearCards: () => void;
  setTargetUtilization: (value: number) => void;
  calculateResults: () => void;
  clearResults: () => void;
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      cards: [],
      result: null,
      targetUtilization: 0.05, // 5% default

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
    }),
    {
      name: 'credit-optimizer-storage',
      partialize: (state) => ({
        cards: state.cards,
        targetUtilization: state.targetUtilization,
      }),
    }
  )
);
