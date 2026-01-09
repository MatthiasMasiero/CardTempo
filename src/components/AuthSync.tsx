'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCalculatorStore } from '@/store/calculator-store';

/**
 * Component that syncs authentication state with calculator store
 * This ensures that when a user logs in/out, their cards are properly loaded/cleared
 */
export function AuthSync() {
  const { user, isAuthenticated, checkSession } = useAuthStore();
  const { setUserId, loadGuestCards } = useCalculatorStore();

  useEffect(() => {
    // Check for existing Supabase session on mount
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    // Sync user ID to calculator store on mount and when user changes
    if (isAuthenticated && user) {
      setUserId(user.id); // Triggers migration if guest cards exist
    } else {
      setUserId(null);
      loadGuestCards(); // Load guest cards from localStorage
    }
  }, [user, isAuthenticated, setUserId, loadGuestCards]);

  return null; // This component doesn't render anything
}
