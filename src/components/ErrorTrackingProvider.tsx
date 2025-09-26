'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandling } from '@/lib/error-tracking';

/**
 * Client component to set up global error tracking
 */
export function ErrorTrackingProvider() {
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return null; // This component doesn't render anything
}
