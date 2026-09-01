'use client';

import { useEffect } from 'react';

export function HydrationFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Filter out extension-induced hydration noise (like Brave's bis_skin_checked)
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (
        msg.includes('bis_skin_checked') ||
        msg.includes('A tree hydrated but some attributes') ||
        msg.includes('Hydration failed because the initial UI does not match')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
}
