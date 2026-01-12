import { create } from 'zustand';
import { CreditCard, OptimizationResult } from '@/types';
import { calculateOptimization } from '@/lib/calculator';
import { supabase } from '@/lib/supabase';
import {
  loadGuestCards as loadGuestCardsFromStorage,
  saveGuestCards,
  addGuestCard as addGuestCardToStorage,
  clearGuestCards as clearGuestCardsFromStorage
} from '@/lib/guestStorage';

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
  loadGuestCards: () => void;
}

// Helper to get user-specific storage key
const getUserStorageKey = (userId: string | null): string => {
  return userId ? `credit-optimizer-${userId}` : 'credit-optimizer-guest';
};

// Convert database card format to app format
interface DbCard {
  id: string;
  nickname: string;
  credit_limit: number;
  current_balance: number;
  statement_date: number;
  due_date: number;
  apr?: number;
  image_url?: string;
}

function dbCardToAppCard(dbCard: DbCard): CreditCard {
  return {
    id: dbCard.id,
    nickname: dbCard.nickname,
    creditLimit: Number(dbCard.credit_limit),
    currentBalance: Number(dbCard.current_balance),
    statementDate: dbCard.statement_date,
    dueDate: dbCard.due_date,
    apr: dbCard.apr ? Number(dbCard.apr) : undefined,
    imageUrl: dbCard.image_url || '/cards/default-card.svg',
  };
}

// Convert app card format to database format
function appCardToDbCard(card: Omit<CreditCard, 'id'>, userId: string): object {
  return {
    user_id: userId,
    nickname: card.nickname,
    credit_limit: card.creditLimit,
    current_balance: card.currentBalance,
    statement_date: card.statementDate,
    due_date: card.dueDate,
    apr: card.apr,
    image_url: card.imageUrl || '/cards/default-card.svg',
  };
}

export const useCalculatorStore = create<CalculatorState>()((set, get) => ({
  cards: [],
  result: null,
  targetUtilization: 0.05, // 5% default
  currentUserId: null,

  addCard: async (card) => {
    const { currentUserId } = get();

    // Guest mode: save to localStorage
    if (!currentUserId) {
      const newCard = addGuestCardToStorage(card);
      set((state) => ({ cards: [...state.cards, newCard] }));
      saveGuestCards(get().cards);
      return;
    }

    // Authenticated mode: save to database
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .insert(appCardToDbCard(card, currentUserId))
        .select()
        .single();

      if (error) {
        console.error('[AddCard] Database error:', error);
        return;
      }

      set((state) => ({ cards: [...state.cards, dbCardToAppCard(data)] }));
    } catch (err) {
      console.error('[AddCard] Unexpected error:', err);
    }
  },

  updateCard: async (id, updatedCard) => {
    const { currentUserId } = get();

    // Optimistic update
    set((state) => ({
      cards: state.cards.map(card => card.id === id ? { ...card, ...updatedCard } : card),
    }));

    // Guest mode: save to localStorage
    if (!currentUserId) {
      saveGuestCards(get().cards);
      return;
    }

    // Authenticated mode: save to database
    try {
      // Map app field names to database field names
      const fieldMap: Record<string, string> = {
        nickname: 'nickname',
        creditLimit: 'credit_limit',
        currentBalance: 'current_balance',
        statementDate: 'statement_date',
        dueDate: 'due_date',
        apr: 'apr',
        imageUrl: 'image_url',
      };

      const dbUpdate: Record<string, unknown> = {};
      for (const [appKey, dbKey] of Object.entries(fieldMap)) {
        if ((updatedCard as Record<string, unknown>)[appKey] !== undefined) {
          dbUpdate[dbKey] = (updatedCard as Record<string, unknown>)[appKey];
        }
      }

      const { error } = await supabase
        .from('credit_cards')
        .update(dbUpdate)
        .eq('id', id)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('[UpdateCard] Database error:', error);
      }
    } catch (err) {
      console.error('[UpdateCard] Unexpected error:', err);
    }
  },

  removeCard: async (id) => {
    const { currentUserId } = get();

    // Optimistic update
    set((state) => ({
      cards: state.cards.filter(card => card.id !== id),
    }));

    // Guest mode: save to localStorage
    if (!currentUserId) {
      saveGuestCards(get().cards);
      return;
    }

    // Authenticated mode: delete from database
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId);

      if (error) {
        console.error('[RemoveCard] Database error:', error);
      }
    } catch (err) {
      console.error('[RemoveCard] Unexpected error:', err);
    }
  },

  clearCards: async () => {
    const { currentUserId } = get();
    set({ cards: [], result: null });

    // Guest mode: clear localStorage
    if (!currentUserId) {
      clearGuestCardsFromStorage();
      return;
    }

    // Authenticated mode: delete all from database
    try {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('user_id', currentUserId);

      if (error) {
        console.error('[ClearCards] Database error:', error);
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

  loadGuestCards: () => {
    const { currentUserId } = get();

    // Only load guest cards if not authenticated
    if (currentUserId === null) {
      console.log('[LoadGuestCards] Loading guest cards from localStorage');
      const guestCards = loadGuestCardsFromStorage();
      set({ cards: guestCards, result: null });
    } else {
      console.log('[LoadGuestCards] User authenticated, skipping guest load');
    }
  },

  setUserId: async (userId) => {
    if (userId === get().currentUserId) return;

    set({ currentUserId: userId });

    // User logged out
    if (!userId) {
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

      // If database has cards, use them
      if (dbCards && dbCards.length > 0) {
        set({ cards: dbCards.map(dbCardToAppCard), result: null });
        return;
      }

      // Check for guest cards to migrate
      const localCards = loadFromLocalStorage(null);
      if (localCards.length === 0) {
        set({ cards: [], result: null });
        return;
      }

      // Migrate guest cards to database
      for (const card of localCards) {
        await supabase.from('credit_cards').insert({
          id: card.id,
          ...appCardToDbCard(card, userId),
        });
      }

      set({ cards: localCards, result: null });

      // Clear guest storage after migration
      if (typeof window !== 'undefined') {
        localStorage.removeItem(getUserStorageKey(null));
      }
    } catch (err) {
      console.error('[SetUserId] Unexpected error:', err);
      set({ cards: [], result: null });
    }
  },
}));

// Load cards from localStorage (for migration only)
function loadFromLocalStorage(userId: string | null): CreditCard[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(getUserStorageKey(userId));
  if (!stored) return [];

  try {
    const { state } = JSON.parse(stored);
    return state.cards || [];
  } catch {
    return [];
  }
}
