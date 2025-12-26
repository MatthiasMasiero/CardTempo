import { create } from 'zustand';
import { CreditCard, OptimizationResult } from '@/types';
import { calculateOptimization, generateId } from '@/lib/calculator';
import { supabase } from '@/lib/supabase';

interface CalculatorState {
  cards: CreditCard[];
  result: OptimizationResult | null;
  targetUtilization: number;
  currentUserId: string | null;

  // Actions
  addCard: (card: Omit<CreditCard, 'id'>) => Promise<void>;
  updateCard: (id: string, card: Partial<CreditCard>) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  clearCards: () => Promise<void>;
  setTargetUtilization: (value: number) => void;
  calculateResults: () => void;
  clearResults: () => void;
  setUserId: (userId: string | null) => Promise<void>;
}

// Helper to get user-specific storage key
const getUserStorageKey = (userId: string | null) => {
  return userId ? `credit-optimizer-${userId}` : 'credit-optimizer-guest';
};

export const useCalculatorStore = create<CalculatorState>()((set, get) => ({
  cards: [],
  result: null,
  targetUtilization: 0.05, // 5% default
  currentUserId: null,

  addCard: async (card) => {
    const { currentUserId } = get();
    if (!currentUserId) {
      console.error('[AddCard] No user logged in');
      return;
    }

    // Save to database first to get the UUID
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert({
          user_id: currentUserId,
          nickname: card.nickname,
          credit_limit: card.creditLimit,
          current_balance: card.currentBalance,
          statement_date: card.statementDate,
          due_date: card.dueDate,
          apr: card.apr,
        })
        .select()
        .single();

      if (error) {
        console.error('[AddCard] Database error:', error);
        return;
      }

      // Add to state with the UUID from database
      const newCard: CreditCard = {
        id: data.id,
        nickname: data.nickname,
        creditLimit: Number(data.credit_limit),
        currentBalance: Number(data.current_balance),
        statementDate: data.statement_date,
        dueDate: data.due_date,
        apr: data.apr ? Number(data.apr) : undefined,
      };

      set((state) => ({ cards: [...state.cards, newCard] }));
      console.log(`[AddCard] Saved card ${newCard.id} to database`);
    } catch (err) {
      console.error('[AddCard] Unexpected error:', err);
    }
  },

  updateCard: async (id, updatedCard) => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    // Optimistic update
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, ...updatedCard } : card
      ),
    }));

    // Save to database
    try {
      const dbUpdate: any = {};
      if (updatedCard.nickname !== undefined) dbUpdate.nickname = updatedCard.nickname;
      if (updatedCard.creditLimit !== undefined) dbUpdate.credit_limit = updatedCard.creditLimit;
      if (updatedCard.currentBalance !== undefined) dbUpdate.current_balance = updatedCard.currentBalance;
      if (updatedCard.statementDate !== undefined) dbUpdate.statement_date = updatedCard.statementDate;
      if (updatedCard.dueDate !== undefined) dbUpdate.due_date = updatedCard.dueDate;
      if (updatedCard.apr !== undefined) dbUpdate.apr = updatedCard.apr;

      const { error } = await supabase
        .from('credit_cards')
        .update(dbUpdate)
        .eq('id', id)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('[UpdateCard] Database error:', error);
      } else {
        console.log(`[UpdateCard] Updated card ${id} in database`);
      }
    } catch (err) {
      console.error('[UpdateCard] Unexpected error:', err);
    }
  },

  removeCard: async (id) => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    // Optimistic update
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== id),
    }));

    // Delete from database
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('[RemoveCard] Database error:', error);
      } else {
        console.log(`[RemoveCard] Deleted card ${id} from database`);
      }
    } catch (err) {
      console.error('[RemoveCard] Unexpected error:', err);
    }
  },

  clearCards: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;

    set({ cards: [], result: null });

    // Delete all cards from database
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('user_id', currentUserId);

      if (error) {
        console.error('[ClearCards] Database error:', error);
      } else {
        console.log('[ClearCards] Deleted all cards from database');
      }
    } catch (err) {
      console.error('[ClearCards] Unexpected error:', err);
    }
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

  setUserId: async (userId) => {
    const currentUserId = get().currentUserId;

    // If userId changed, load user-specific data
    if (userId !== currentUserId) {
      console.log(`[Auth] User changed from ${currentUserId} to ${userId}`);

      // Set the new userId
      set({ currentUserId: userId });

      if (!userId) {
        // User logged out
        set({ cards: [], result: null });
        return;
      }

      // Load cards from database
      try {
        const { data: dbCards, error } = await supabase
          .from('credit_cards')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          console.error('[SetUserId] Error loading cards:', error);
          set({ cards: [], result: null });
          return;
        }

        // Check if database is empty - if so, migrate from localStorage
        if (!dbCards || dbCards.length === 0) {
          console.log('[SetUserId] No cards in database, checking localStorage for migration');
          const localCards = loadFromLocalStorage(userId);

          if (localCards.length > 0) {
            console.log(`[SetUserId] Migrating ${localCards.length} cards from localStorage to database`);

            // Migrate each card to database
            for (const card of localCards) {
              await supabase.from('credit_cards').insert({
                id: card.id,
                user_id: userId,
                nickname: card.nickname,
                credit_limit: card.creditLimit,
                current_balance: card.currentBalance,
                statement_date: card.statementDate,
                due_date: card.dueDate,
                apr: card.apr,
              });
            }

            // Set migrated cards in state
            set({ cards: localCards, result: null });

            // Clear localStorage after successful migration
            if (typeof window !== 'undefined') {
              const key = getUserStorageKey(userId);
              localStorage.removeItem(key);
              console.log('[SetUserId] Migration complete, localStorage cleared');
            }
          } else {
            set({ cards: [], result: null });
          }
        } else {
          // Convert database format to app format
          const cards: CreditCard[] = dbCards.map((dbCard) => ({
            id: dbCard.id,
            nickname: dbCard.nickname,
            creditLimit: Number(dbCard.credit_limit),
            currentBalance: Number(dbCard.current_balance),
            statementDate: dbCard.statement_date,
            dueDate: dbCard.due_date,
            apr: dbCard.apr ? Number(dbCard.apr) : undefined,
          }));

          console.log(`[SetUserId] Loaded ${cards.length} cards from database`);
          set({ cards, result: null });
        }
      } catch (err) {
        console.error('[SetUserId] Unexpected error:', err);
        set({ cards: [], result: null });
      }
    }
  },
}));

// Helper function to load cards from localStorage (for migration only)
function loadFromLocalStorage(userId: string | null): CreditCard[] {
  if (typeof window === 'undefined') return [];

  const key = getUserStorageKey(userId);
  const stored = localStorage.getItem(key);

  if (!stored) return [];

  try {
    const { state } = JSON.parse(stored);
    return state.cards || [];
  } catch (e) {
    console.error('[LocalStorage] Failed to parse stored data:', e);
    return [];
  }
}
