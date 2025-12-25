'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCalculatorStore } from '@/store/calculator-store';

/**
 * Component that syncs authentication state with calculator store
 * This ensures that when a user logs in/out, their cards are properly loaded/cleared
 */
export function AuthSync() {
  const { user, isAuthenticated } = useAuthStore();
  const { setUserId } = useCalculatorStore();

  useEffect(() => {
    // Sync user ID to calculator store on mount and when user changes
    if (isAuthenticated && user) {
      setUserId(user.id);
    } else {
      setUserId(null);
    }
  }, [user, isAuthenticated, setUserId]);

  return null; // This component doesn't render anything
}
