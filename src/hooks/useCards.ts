import { useEffect, useState } from 'react';
import { useCalculatorStore } from '@/store/calculator-store';
import { CreditCard } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

/**
 * Hook to fetch user's credit cards
 * Falls back to localStorage if database is not connected
 * This allows seamless migration from localStorage to database
 */
export function useCards() {
  const { cards: localCards } = useCalculatorStore();
  const [dbCards, setDbCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    async function fetchCards() {
      // If no user, just use localStorage
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Try to fetch from database
        const { data, error: dbError } = await supabase
          .from('credit_cards')
          .select('*')
          .eq('user_id', user.id);

        if (dbError) {
          // Database not available or error - fall back to localStorage
          console.log('Using localStorage (database not available)');
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Convert database cards to app format
          const cards: CreditCard[] = data.map(card => ({
            id: card.id,
            nickname: card.nickname,
            creditLimit: Number(card.credit_limit),
            currentBalance: Number(card.current_balance),
            statementDate: card.statement_date,
            dueDate: card.due_date,
            apr: card.apr ? Number(card.apr) : undefined,
          }));

          setDbCards(cards);
        }
      } catch (err) {
        // Database connection failed - fall back to localStorage
        console.log('Database connection failed, using localStorage');
        setError(err instanceof Error ? err.message : 'Failed to fetch cards');
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [user]);

  // Return database cards if available, otherwise localStorage cards
  const cards = dbCards.length > 0 ? dbCards : localCards;

  return {
    cards,
    loading,
    error,
    isUsingDatabase: dbCards.length > 0,
  };
}

/**
 * Hook to save/update cards
 * Writes to both localStorage AND database (if available)
 * This ensures data is always backed up
 */
export function useSaveCard() {
  const { addCard: addLocalCard, updateCard: updateLocalCard } = useCalculatorStore();
  const { user } = useAuthStore();

  async function saveCard(card: Omit<CreditCard, 'id'>, existingId?: string) {
    // Always save to localStorage first (fast, guaranteed to work)
    if (existingId) {
      updateLocalCard(existingId, card);
    } else {
      addLocalCard(card);
    }

    // Try to save to database if user is logged in
    if (user) {
      try {
        const dbCard = {
          user_id: user.id,
          nickname: card.nickname,
          credit_limit: card.creditLimit,
          current_balance: card.currentBalance,
          statement_date: card.statementDate,
          due_date: card.dueDate,
          apr: card.apr || null,
        };

        if (existingId) {
          // Update existing card
          await supabase
            .from('credit_cards')
            .update(dbCard)
            .eq('id', existingId);
        } else {
          // Insert new card
          await supabase
            .from('credit_cards')
            .insert(dbCard);
        }
      } catch {
        // Database save failed, but localStorage succeeded
        console.log('Database save failed, using localStorage only');
      }
    }
  }

  return { saveCard };
}
