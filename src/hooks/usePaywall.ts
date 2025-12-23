import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { createPaywallService } from '@/lib/paywall/service';
import { mapUserToPaywallState } from '@/lib/paywall/mapper';
import { createBrowserTrialStorage, type TrialStorage } from '@/lib/paywall/storage';
import type { PaywallFeature, PaywallState } from '@/lib/paywall/types';

export function usePaywall() {
  const { user, isLoaded } = useUser();
  const paywallService = useMemo(() => createPaywallService(), []);
  const storageRef = useRef<TrialStorage>();

  const [paywallState, setPaywallState] = useState<PaywallState>(() =>
    mapUserToPaywallState(user as any)
  );

  const [showPaywallDialog, setShowPaywallDialog] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<string>('');

  // Lazy-create browser storage to keep this hook SSR-friendly
  if (!storageRef.current) {
    storageRef.current = createBrowserTrialStorage();
  }

  // Initialize trial state from storage
  useEffect(() => {
    const storage = storageRef.current;
    if (!storage) return;

    const trialUsed = storage.getTrialUsed();
    setPaywallState((prev) => ({
      ...prev,
      hasTrialAvailable: !trialUsed,
      trialUsed,
    }));
  }, []);

  // Update state when user data changes
  useEffect(() => {
    if (!isLoaded) return;

    const mapped = mapUserToPaywallState(user as any);
    setPaywallState((prev) => ({
      ...mapped,
      hasTrialAvailable: prev.hasTrialAvailable,
      trialUsed: prev.trialUsed,
    }));
  }, [isLoaded, user]);

  const checkFeatureAccess = useCallback(
    (feature: PaywallFeature): boolean => {
      return paywallService.checkFeatureAccess(paywallState, feature);
    },
    [paywallService, paywallState]
  );

  const requestFeatureAccess = useCallback(
    (feature: PaywallFeature, context?: string) => {
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
    if (!paywallState.hasTrialAvailable || paywallState.trialUsed) return false;

    storageRef.current?.setTrialUsed(true);
    setPaywallState((prev) => paywallService.markTrialUsed(prev));
    setShowPaywallDialog(false);
    return true;
  }, [paywallService, paywallState]);

  const closePaywallDialog = useCallback(() => {
    setShowPaywallDialog(false);
    setPaywallFeature('');
  }, []);

  const upgradeToPro = useCallback(
    async (priceId: string, isYearly = false) => {
      await paywallService.upgradeToPro(priceId, isYearly);
    },
    [paywallService]
  );

  const manageSubscription = useCallback(async () => {
    if (!paywallState.customerId) return;
    await paywallService.manageSubscription(paywallState.customerId);
  }, [paywallService, paywallState.customerId]);

  const cancelSubscription = useCallback(
    async (subscriptionId: string, cancelAtPeriodEnd: boolean = true) => {
      const result = await paywallService.cancelSubscription(
        subscriptionId,
        cancelAtPeriodEnd
      );
      if (user) {
        await user.reload();
      }
      return result;
    },
    [paywallService, user]
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
    lastPaymentFailed: paywallState.lastPaymentFailed,
    currentPeriodEnd: paywallState.currentPeriodEnd,
    currentPeriodStart: paywallState.currentPeriodStart,

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
