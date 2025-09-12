import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { getStripe } from '@/lib/stripe';

export interface PaywallState {
  isPro: boolean;
  hasTrialAvailable: boolean;
  trialUsed: boolean;
  subscriptionStatus?: string;
  customerId?: string;
  subscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: string;
}

export function usePaywall() {
  const { user, isLoaded } = useUser();

  // Log metadata loading issues for production monitoring
  useEffect(() => {
    if (
      isLoaded &&
      user &&
      !(user as any)?.publicMetadata &&
      !(user as any)?.privateMetadata
    ) {
      console.warn(
        '[PAYWALL] No user metadata found - user may need to refresh'
      );
    }
  }, [user, isLoaded]);

  // Get subscription status from Clerk user metadata (check both private and public)
  const isProUserPrivate = (user as any)?.privateMetadata?.isProUser === true;
  const isProUserPublic = (user as any)?.publicMetadata?.isProUser === true;
  const isProUser = isProUserPrivate || isProUserPublic;

  const subscriptionStatusPrivate = (user as any)?.privateMetadata
    ?.subscriptionStatus as string;
  const subscriptionStatusPublic = (user as any)?.publicMetadata
    ?.subscriptionStatus as string;
  const subscriptionStatus =
    subscriptionStatusPrivate || subscriptionStatusPublic;

  // Debug logging
  useEffect(() => {
    if (user && isLoaded) {
      console.log('[PAYWALL DEBUG] User metadata:', {
        privateMetadata: (user as any)?.privateMetadata,
        publicMetadata: (user as any)?.publicMetadata,
        isProUserPrivate,
        isProUserPublic,
        finalIsProUser: isProUser,
        subscriptionStatus,
      });
    }
  }, [
    user,
    isLoaded,
    isProUserPrivate,
    isProUserPublic,
    isProUser,
    subscriptionStatus,
  ]);

  const customerIdPrivate = (user as any)?.privateMetadata
    ?.stripeCustomerId as string;
  const customerIdPublic = (user as any)?.publicMetadata
    ?.stripeCustomerId as string;
  const customerId = customerIdPrivate || customerIdPublic;
  const subscriptionIdPrivate = (user as any)?.privateMetadata
    ?.stripeSubscriptionId as string;
  const subscriptionIdPublic = (user as any)?.publicMetadata
    ?.stripeSubscriptionId as string;
  const subscriptionId = subscriptionIdPrivate || subscriptionIdPublic;

  // Get cancellation info
  const cancelAtPeriodEndPrivate = (user as any)?.privateMetadata
    ?.cancelAtPeriodEnd;
  const cancelAtPeriodEndPublic = (user as any)?.publicMetadata
    ?.cancelAtPeriodEnd;
  const cancelAtPeriodEnd = cancelAtPeriodEndPrivate || cancelAtPeriodEndPublic;

  const cancelAtPrivate = (user as any)?.privateMetadata?.cancelAt;
  const cancelAtPublic = (user as any)?.publicMetadata?.cancelAt;
  const cancelAt = cancelAtPrivate || cancelAtPublic;

  // Initialize state without localStorage (will be set in useEffect)
  const [paywallState, setPaywallState] = useState<PaywallState>({
    isPro: isProUser,
    hasTrialAvailable: true, // Default to true, will be updated in useEffect
    trialUsed: false, // Default to false, will be updated in useEffect
    subscriptionStatus,
    customerId,
    subscriptionId,
    cancelAtPeriodEnd,
    cancelAt,
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
      setPaywallState((prev) => ({
        ...prev,
        isPro: isProUser,
        subscriptionStatus,
        customerId,
        subscriptionId,
        cancelAtPeriodEnd,
        cancelAt,
      }));
    }
  }, [
    isLoaded,
    isProUser,
    subscriptionStatus,
    customerId,
    subscriptionId,
    cancelAtPeriodEnd,
    cancelAt,
  ]);

  const [showPaywallDialog, setShowPaywallDialog] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<string>('');

  const checkFeatureAccess = useCallback(
    (
      feature:
        | 'batch'
        | 'presets'
        | 'advanced-formats'
        | 'zip-export'
        | 'packages'
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
      feature:
        | 'batch'
        | 'presets'
        | 'advanced-formats'
        | 'zip-export'
        | 'packages',
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

  const cancelSubscription = useCallback(
    async (subscriptionId: string, cancelAtPeriodEnd: boolean = true) => {
      try {
        const response = await fetch('/api/stripe/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscriptionId, cancelAtPeriodEnd }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Cancel subscription error:', errorData);
          throw new Error(errorData.error || 'Failed to cancel subscription');
        }

        const result = await response.json();
        console.log('Subscription cancellation result:', result);

        // Refresh user data to update the UI immediately
        if (user) {
          await user.reload();
        }

        return result;
      } catch (error) {
        console.error('Cancel subscription error:', error);
        throw error;
      }
    },
    [user]
  );

  return {
    // State
    isPro: paywallState.isPro, // Use state that gets updated via useEffect
    hasTrialAvailable: paywallState.hasTrialAvailable,
    trialUsed: paywallState.trialUsed,
    subscriptionStatus: paywallState.subscriptionStatus,
    customerId: paywallState.customerId,
    subscriptionId: paywallState.subscriptionId,
    cancelAtPeriodEnd: paywallState.cancelAtPeriodEnd,
    cancelAt: paywallState.cancelAt,

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
    cancelSubscription,
  };
}
