import {
  getGuestStorageKey,
  loadGuestCards,
  saveGuestCards,
  generateGuestCardId,
  addGuestCard,
  updateGuestCard,
  removeGuestCard,
  clearGuestCards,
} from '../guestStorage';
import { CreditCard } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Guest Storage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getGuestStorageKey', () => {
    test('should return correct storage key', () => {
      expect(getGuestStorageKey()).toBe('credit-optimizer-guest');
    });
  });

  describe('generateGuestCardId', () => {
    test('should generate valid UUID format', () => {
      const id = generateGuestCardId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    test('should generate unique IDs', () => {
      const id1 = generateGuestCardId();
      const id2 = generateGuestCardId();
      expect(id1).not.toBe(id2);
    });

    test('should generate 100 unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateGuestCardId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('loadGuestCards', () => {
    test('should return empty array when no cards exist', () => {
      const cards = loadGuestCards();
      expect(cards).toEqual([]);
    });

    test('should load cards from localStorage', () => {
      const mockCards: CreditCard[] = [
        {
          id: '123',
          nickname: 'Test Card',
          creditLimit: 5000,
          currentBalance: 1000,
          statementDate: 15,
          dueDate: 10,
        },
      ];

      localStorage.setItem(
        'credit-optimizer-guest',
        JSON.stringify({ state: { cards: mockCards }, version: 1 })
      );

      const loaded = loadGuestCards();
      expect(loaded).toEqual(mockCards);
    });

    test('should return empty array for corrupted data', () => {
      localStorage.setItem('credit-optimizer-guest', 'invalid json');
      const cards = loadGuestCards();
      expect(cards).toEqual([]);
    });

    test('should clear corrupted data from localStorage', () => {
      localStorage.setItem('credit-optimizer-guest', 'invalid json');
      loadGuestCards();
      expect(localStorage.getItem('credit-optimizer-guest')).toBeNull();
    });

    test('should return empty array for invalid data structure', () => {
      localStorage.setItem(
        'credit-optimizer-guest',
        JSON.stringify({ wrong: 'format' })
      );
      const cards = loadGuestCards();
      expect(cards).toEqual([]);
    });

    test('should handle missing state.cards gracefully', () => {
      localStorage.setItem(
        'credit-optimizer-guest',
        JSON.stringify({ state: {} })
      );
      const cards = loadGuestCards();
      expect(cards).toEqual([]);
    });
  });

  describe('saveGuestCards', () => {
    test('should save cards to localStorage', () => {
      const cards: CreditCard[] = [
        {
          id: '123',
          nickname: 'Savings Card',
          creditLimit: 3000,
          currentBalance: 500,
          statementDate: 20,
          dueDate: 15,
        },
      ];

      saveGuestCards(cards);

      const stored = localStorage.getItem('credit-optimizer-guest');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.cards).toEqual(cards);
      expect(parsed.version).toBe(1);
    });

    test('should overwrite existing cards', () => {
      const cards1: CreditCard[] = [
        {
          id: '1',
          nickname: 'Card 1',
          creditLimit: 1000,
          currentBalance: 100,
          statementDate: 15,
          dueDate: 10,
        },
      ];

      const cards2: CreditCard[] = [
        {
          id: '2',
          nickname: 'Card 2',
          creditLimit: 2000,
          currentBalance: 200,
          statementDate: 20,
          dueDate: 15,
        },
      ];

      saveGuestCards(cards1);
      saveGuestCards(cards2);

      const loaded = loadGuestCards();
      expect(loaded).toEqual(cards2);
    });

    test('should save empty array', () => {
      saveGuestCards([]);

      const stored = localStorage.getItem('credit-optimizer-guest');
      const parsed = JSON.parse(stored!);
      expect(parsed.state.cards).toEqual([]);
    });
  });

  describe('addGuestCard', () => {
    test('should add card with generated ID', () => {
      const cardData: Omit<CreditCard, 'id'> = {
        nickname: 'New Card',
        creditLimit: 5000,
        currentBalance: 1000,
        statementDate: 15,
        dueDate: 10,
      };

      const addedCard = addGuestCard(cardData);

      expect(addedCard.id).toBeDefined();
      expect(addedCard.nickname).toBe('New Card');
      expect(addedCard.creditLimit).toBe(5000);
    });

    test('should persist card to localStorage', () => {
      const cardData: Omit<CreditCard, 'id'> = {
        nickname: 'Persistent Card',
        creditLimit: 3000,
        currentBalance: 500,
        statementDate: 20,
        dueDate: 15,
      };

      addGuestCard(cardData);

      const loaded = loadGuestCards();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].nickname).toBe('Persistent Card');
    });

    test('should add multiple cards', () => {
      const card1: Omit<CreditCard, 'id'> = {
        nickname: 'Card 1',
        creditLimit: 1000,
        currentBalance: 100,
        statementDate: 15,
        dueDate: 10,
      };

      const card2: Omit<CreditCard, 'id'> = {
        nickname: 'Card 2',
        creditLimit: 2000,
        currentBalance: 200,
        statementDate: 20,
        dueDate: 15,
      };

      addGuestCard(card1);
      addGuestCard(card2);

      const loaded = loadGuestCards();
      expect(loaded).toHaveLength(2);
      expect(loaded[0].nickname).toBe('Card 1');
      expect(loaded[1].nickname).toBe('Card 2');
    });

    test('should handle optional fields', () => {
      const cardData: Omit<CreditCard, 'id'> = {
        nickname: 'Card with APR',
        creditLimit: 5000,
        currentBalance: 1000,
        statementDate: 15,
        dueDate: 10,
        apr: 18.99,
        imageUrl: '/cards/test-card.svg',
      };

      const addedCard = addGuestCard(cardData);

      expect(addedCard.apr).toBe(18.99);
      expect(addedCard.imageUrl).toBe('/cards/test-card.svg');
    });
  });

  describe('updateGuestCard', () => {
    test('should update existing card', () => {
      const card = addGuestCard({
        nickname: 'Original Name',
        creditLimit: 5000,
        currentBalance: 1000,
        statementDate: 15,
        dueDate: 10,
      });

      updateGuestCard(card.id, { nickname: 'Updated Name' });

      const loaded = loadGuestCards();
      expect(loaded[0].nickname).toBe('Updated Name');
      expect(loaded[0].creditLimit).toBe(5000); // Unchanged
    });

    test('should update multiple fields', () => {
      const card = addGuestCard({
        nickname: 'Test Card',
        creditLimit: 5000,
        currentBalance: 1000,
        statementDate: 15,
        dueDate: 10,
      });

      updateGuestCard(card.id, {
        currentBalance: 2000,
        apr: 15.99,
      });

      const loaded = loadGuestCards();
      expect(loaded[0].currentBalance).toBe(2000);
      expect(loaded[0].apr).toBe(15.99);
      expect(loaded[0].nickname).toBe('Test Card'); // Unchanged
    });

    test('should not affect other cards', () => {
      const card1 = addGuestCard({
        nickname: 'Card 1',
        creditLimit: 1000,
        currentBalance: 100,
        statementDate: 15,
        dueDate: 10,
      });

      addGuestCard({
        nickname: 'Card 2',
        creditLimit: 2000,
        currentBalance: 200,
        statementDate: 20,
        dueDate: 15,
      });

      updateGuestCard(card1.id, { nickname: 'Updated Card 1' });

      const loaded = loadGuestCards();
      expect(loaded[0].nickname).toBe('Updated Card 1');
      expect(loaded[1].nickname).toBe('Card 2'); // Unchanged
    });

    test('should handle non-existent card ID gracefully', () => {
      addGuestCard({
        nickname: 'Existing Card',
        creditLimit: 5000,
        currentBalance: 1000,
        statementDate: 15,
        dueDate: 10,
      });

      updateGuestCard('non-existent-id', { nickname: 'Updated' });

      const loaded = loadGuestCards();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].nickname).toBe('Existing Card'); // Unchanged
    });
  });

  describe('removeGuestCard', () => {
    test('should remove card by ID', () => {
      const card1 = addGuestCard({
        nickname: 'Card 1',
        creditLimit: 1000,
        currentBalance: 100,
        statementDate: 15,
        dueDate: 10,
      });

      const card2 = addGuestCard({
        nickname: 'Card 2',
        creditLimit: 2000,
        currentBalance: 200,
        statementDate: 20,
        dueDate: 15,
      });

      removeGuestCard(card1.id);

      const loaded = loadGuestCards();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(card2.id);
    });

    test('should handle removing last card', () => {
      const card = addGuestCard({
        nickname: 'Only Card',
        creditLimit: 5000,
        currentBalance: 1000,
        statementDate: 15,
        dueDate: 10,
      });

      removeGuestCard(card.id);

      const loaded = loadGuestCards();
      expect(loaded).toEqual([]);
    });

    test('should handle non-existent card ID gracefully', () => {
      const card = addGuestCard({
        nickname: 'Existing Card',
        creditLimit: 5000,
        currentBalance: 1000,
        statementDate: 15,
        dueDate: 10,
      });

      removeGuestCard('non-existent-id');

      const loaded = loadGuestCards();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe(card.id);
    });
  });

  describe('clearGuestCards', () => {
    test('should clear all cards', () => {
      addGuestCard({
        nickname: 'Card 1',
        creditLimit: 1000,
        currentBalance: 100,
        statementDate: 15,
        dueDate: 10,
      });

      addGuestCard({
        nickname: 'Card 2',
        creditLimit: 2000,
        currentBalance: 200,
        statementDate: 20,
        dueDate: 15,
      });

      clearGuestCards();

      const loaded = loadGuestCards();
      expect(loaded).toEqual([]);
    });

    test('should remove localStorage key', () => {
      addGuestCard({
        nickname: 'Test Card',
        creditLimit: 5000,
        currentBalance: 1000,
        statementDate: 15,
        dueDate: 10,
      });

      clearGuestCards();

      const stored = localStorage.getItem('credit-optimizer-guest');
      expect(stored).toBeNull();
    });

    test('should handle clearing when no cards exist', () => {
      clearGuestCards();

      const loaded = loadGuestCards();
      expect(loaded).toEqual([]);
    });
  });
});
