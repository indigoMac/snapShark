import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getStripe } from '@/lib/stripe';

export interface PaywallState {
  isPro: boolean;
  hasTrialAvailable: boolean;
  trialUsed: boolean;
  subscriptionStatus?: string;
  customerId?: string;
}

export function usePaywall() {
  const { user, isLoaded } = useUser();

  // Debug: Log user metadata (remove in production)
  useEffect(() => {
    if (user) {
      console.log('[PAYWALL] User metadata:', (user as any)?.privateMetadata);
      console.log(
        '[PAYWALL] isProUser check:',
        (user as any)?.privateMetadata?.isProUser === true
      );
    } else if (isLoaded) {
      console.log('[PAYWALL] User loaded but no metadata available');
    }
  }, [user, isLoaded]);

  // Debug logging for metadata issues
  useEffect(() => {
    if (isLoaded && user) {
      console.log('[PAYWALL] 🔍 Full user object:', user);
      console.log('[PAYWALL] 📋 User privateMetadata:', (user as any)?.privateMetadata);
      console.log('[PAYWALL] 📋 User publicMetadata:', (user as any)?.publicMetadata);
      console.log('[PAYWALL] 📋 User unsafeMetadata:', (user as any)?.unsafeMetadata);
      
      if (!(user as any)?.privateMetadata) {
        console.log('[PAYWALL] ⚠️ User metadata missing - this is the problem!');
      } else {
        console.log('[PAYWALL] ✅ Metadata found, checking Pro status...');
      }
    }
  }, [user, isLoaded]);

  // Get subscription status from Clerk user metadata
  // Check public metadata first (syncs immediately), fallback to private
  const isProUser = 
    (user as any)?.publicMetadata?.isProUser === true ||
    (user as any)?.privateMetadata?.isProUser === true;
  
  const subscriptionStatus = 
    (user as any)?.publicMetadata?.subscriptionStatus ||
    (user as any)?.privateMetadata?.subscriptionStatus as string;
    
  const customerId = (user as any)?.privateMetadata?.stripeCustomerId as string;

  // Initialize state without localStorage (will be set in useEffect)
  const [paywallState, setPaywallState] = useState<PaywallState>({
    isPro: isProUser,
    hasTrialAvailable: true, // Default to true, will be updated in useEffect
    trialUsed: false, // Default to false, will be updated in useEffect
    subscriptionStatus,
    customerId,
  });

  // Update trial state from localStorage after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const trialUsedFromStorage =
        localStorage.getItem('snapshark-trial-used') === 'true';
      setPaywallState((prev) => ({
        ...prev,
        hasTrialAvailable: !trialUsedFromStorage,
        trialUsed: trialUsedFromStorage,
      }));
    }
  }, []);

  // Update state when user data changes
  useEffect(() => {
    if (isLoaded) {
      console.log(
        '[PAYWALL] Updating state - isProUser:',
        isProUser,
        'subscriptionStatus:',
        subscriptionStatus
      );
      setPaywallState((prev) => ({
        ...prev,
        isPro: isProUser,
        subscriptionStatus,
        customerId,
      }));
    }
  }, [isLoaded, isProUser, subscriptionStatus, customerId]);

  const [showPaywallDialog, setShowPaywallDialog] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<string>('');

  const checkFeatureAccess = useCallback(
    (
      feature: 'batch' | 'presets' | 'advanced-formats' | 'zip-export'
    ): boolean => {
      if (paywallState.isPro) return true;

      // Allow trial for batch processing (up to 3 files)
      if (feature === 'batch' && paywallState.hasTrialAvailable) {
        return true;
      }

      return false;
    },
    [paywallState]
  );

  const requestFeatureAccess = useCallback(
    (
      feature: 'batch' | 'presets' | 'advanced-formats' | 'zip-export',
      context?: string
    ) => {
      if (checkFeatureAccess(feature)) {
        return true;
      }

      // Show paywall dialog
      setPaywallFeature(context || feature);
      setShowPaywallDialog(true);
      return false;
    },
    [checkFeatureAccess]
  );

  const useTrial = useCallback(() => {
    if (!paywallState.hasTrialAvailable || paywallState.trialUsed) {
      return false;
    }

    // Save trial usage to localStorage (only on client)
    if (typeof window !== 'undefined') {
      localStorage.setItem('snapshark-trial-used', 'true');
    }

    setPaywallState((prev) => ({
      ...prev,
      trialUsed: true,
      hasTrialAvailable: false,
    }));

    setShowPaywallDialog(false);
    return true;
  }, [paywallState]);

  const closePaywallDialog = useCallback(() => {
    setShowPaywallDialog(false);
    setPaywallFeature('');
  }, []);

  const upgradeToPro = useCallback(
    async (priceId: string, isYearly = false) => {
      try {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priceId, isYearly }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Checkout error:', errorData);

          if (response.status === 401) {
            alert('Please sign in first to upgrade to Pro');
            return;
          }

          alert(
            `Error: ${errorData.error || 'Failed to create checkout session'}`
          );
          return;
        }

        const { sessionId, url } = await response.json();

        if (url) {
          window.location.href = url;
        } else {
          console.error('No checkout URL received');
          alert('Failed to create checkout session');
        }
      } catch (error) {
        console.error('Upgrade error:', error);
        alert('Network error. Please try again.');
      }
    },
    []
  );

  const manageSubscription = useCallback(async () => {
    if (!customerId) return;

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    }
  }, [customerId]);

  return {
    // State
    isPro: paywallState.isPro, // Use state that gets updated via useEffect
    hasTrialAvailable: paywallState.hasTrialAvailable,
    trialUsed: paywallState.trialUsed,
    subscriptionStatus: paywallState.subscriptionStatus,
    customerId: paywallState.customerId,

    // Feature access
    checkFeatureAccess,
    requestFeatureAccess,

    // Trial
    useTrial,

    // Dialog
    showPaywallDialog,
    paywallFeature,
    closePaywallDialog,

    // Stripe integration
    upgradeToPro,
    manageSubscription,
  };
}
