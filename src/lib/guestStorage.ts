import { CreditCard } from '@/types';

/**
 * Guest Storage Module
 *
 * Handles localStorage operations for non-authenticated users.
 * Cards are stored in localStorage and automatically migrated to
 * the database when the user logs in.
 */

// Storage key for guest cards
const GUEST_STORAGE_KEY = 'credit-optimizer-guest';

// Storage version for future migrations
const STORAGE_VERSION = 1;

/**
 * Storage data structure that matches the format expected by
 * the existing migration logic in calculator-store.ts
 */
interface GuestStorageData {
  state: {
    cards: CreditCard[];
  };
  version?: number;
}

/**
 * Get the guest storage key
 * Returns: 'credit-optimizer-guest'
 */
export function getGuestStorageKey(): string {
  return GUEST_STORAGE_KEY;
}

/**
 * Check if localStorage is available (handles SSR and private browsing)
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load guest cards from localStorage
 * Returns empty array if no cards exist or on error
 */
export function loadGuestCards(): CreditCard[] {
  if (!isLocalStorageAvailable()) {
    console.warn('[GuestStorage] localStorage not available');
    return [];
  }

  try {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const data: GuestStorageData = JSON.parse(stored);

    // Validate data structure
    if (!data.state || !Array.isArray(data.state.cards)) {
      console.error('[GuestStorage] Invalid data structure, clearing storage');
      localStorage.removeItem(GUEST_STORAGE_KEY);
      return [];
    }

    console.log(`[GuestStorage] Loaded ${data.state.cards.length} guest cards`);
    return data.state.cards;
  } catch (error) {
    console.error('[GuestStorage] Error loading guest cards:', error);
    // Clear corrupted data
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // Ignore errors when clearing
    }
    return [];
  }
}

/**
 * Save guest cards to localStorage
 * @param cards - Array of credit cards to save
 */
export function saveGuestCards(cards: CreditCard[]): void {
  if (!isLocalStorageAvailable()) {
    console.warn('[GuestStorage] localStorage not available, cannot save cards');
    return;
  }

  try {
    const data: GuestStorageData = {
      state: {
        cards
      },
      version: STORAGE_VERSION
    };

    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
    console.log(`[GuestStorage] Saved ${cards.length} guest cards`);
  } catch (error) {
    // Check if it's a quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[GuestStorage] localStorage quota exceeded');
    } else {
      console.error('[GuestStorage] Error saving guest cards:', error);
    }
  }
}

/**
 * Generate a unique ID for a guest card using crypto.randomUUID()
 * Returns a standard UUID v4 string
 */
export function generateGuestCardId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers (should rarely be needed)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Add a new guest card to localStorage
 * Generates a UUID for the card and saves it
 *
 * @param card - Card data without ID
 * @returns The complete card with generated ID
 */
export function addGuestCard(card: Omit<CreditCard, 'id'>): CreditCard {
  const newCard: CreditCard = {
    ...card,
    id: generateGuestCardId(),
  };

  const existingCards = loadGuestCards();
  const updatedCards = [...existingCards, newCard];
  saveGuestCards(updatedCards);

  console.log(`[GuestStorage] Added guest card: ${newCard.nickname} (${newCard.id})`);
  return newCard;
}

/**
 * Update an existing guest card in localStorage
 *
 * @param id - Card ID to update
 * @param updates - Partial card data to update
 */
export function updateGuestCard(id: string, updates: Partial<CreditCard>): void {
  const cards = loadGuestCards();
  const updatedCards = cards.map((card) =>
    card.id === id ? { ...card, ...updates } : card
  );

  saveGuestCards(updatedCards);
  console.log(`[GuestStorage] Updated guest card: ${id}`);
}

/**
 * Remove a guest card from localStorage
 *
 * @param id - Card ID to remove
 */
export function removeGuestCard(id: string): void {
  const cards = loadGuestCards();
  const filteredCards = cards.filter((card) => card.id !== id);

  saveGuestCards(filteredCards);
  console.log(`[GuestStorage] Removed guest card: ${id}`);
}

/**
 * Clear all guest cards from localStorage
 */
export function clearGuestCards(): void {
  if (!isLocalStorageAvailable()) {
    console.warn('[GuestStorage] localStorage not available');
    return;
  }

  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
    console.log('[GuestStorage] Cleared all guest cards');
  } catch (error) {
    console.error('[GuestStorage] Error clearing guest cards:', error);
  }
}
