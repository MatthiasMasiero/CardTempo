'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, CreditCard as CreditCardIcon, X } from 'lucide-react';
import Image from 'next/image';

interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  imageUrl: string;
  category: string;
}

interface CardAutocompleteProps {
  onSelect: (card: CreditCard | null) => void;
  selectedCard?: CreditCard | null;
}

export default function CardAutocomplete({ onSelect, selectedCard }: CardAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for cards as user types
  useEffect(() => {
    const searchCards = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/cards/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.cards || []);
        setIsOpen(true);
        setHighlightedIndex(0);
      } catch (error) {
        console.error('Error searching cards:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchCards, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (card: CreditCard) => {
    onSelect(card);
    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Selected Card Display */}
      {selectedCard && (
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-10 bg-white dark:bg-gray-800 rounded-md overflow-hidden shadow-sm flex items-center justify-center">
              <Image
                src={selectedCard.imageUrl}
                alt={selectedCard.name}
                fill
                sizes="64px"
                className="object-contain p-1"
                onError={(e) => {
                  // Fallback to default card icon if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              <CreditCardIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {selectedCard.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {selectedCard.issuer}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-md transition-colors"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      {/* Search Input */}
      {!selectedCard && (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 2 && setIsOpen(true)}
              placeholder="Search for your card (optional)..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       transition-all"
            />
          </div>

          {/* Dropdown Results */}
          {isOpen && (
            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
              {isLoading && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Searching...
                </div>
              )}

              {!isLoading && results.length === 0 && query.length >= 2 && (
                <div className="p-4 text-center text-sm text-gray-500">
                  No cards found. You can still enter a custom name below.
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <ul>
                  {results.map((card, index) => (
                    <li key={card.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(card)}
                        className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                          ${index === highlightedIndex ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                      >
                        <div className="relative w-14 h-9 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <Image
                            src={card.imageUrl}
                            alt={card.name}
                            fill
                            sizes="56px"
                            className="object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <CreditCardIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {card.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {card.issuer} • {card.category}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
