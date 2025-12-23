import { PaywallFeature, PaywallService, PaywallState } from './types';

type Fetcher = typeof fetch;

export function createPaywallService(fetcher: Fetcher = fetch): PaywallService {
  const checkFeatureAccess = (state: PaywallState, feature: PaywallFeature) => {
    if (state.isPro) return true;
    if (feature === 'batch' && state.hasTrialAvailable) return true;
    return false;
  };

  const markTrialUsed = (state: PaywallState): PaywallState => ({
    ...state,
    trialUsed: true,
    hasTrialAvailable: false,
  });

  const upgradeToPro = async (priceId: string, isYearly = false) => {
    const response = await fetcher('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, isYearly }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error || 'Failed to create checkout session';
      const status = response.status;
      throw new Error(status === 401 ? 'unauthorized' : message);
    }

    const { url } = (await response.json()) as { url?: string };
    if (!url) {
      throw new Error('Missing checkout URL');
    }
    window.location.href = url;
  };

  const manageSubscription = async (customerId: string) => {
    if (!customerId) return;

    const response = await fetcher('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId }),
    });

    const { url } = (await response.json()) as { url?: string };
    if (url) {
      window.location.href = url;
    }
  };

  const cancelSubscription = async (
    subscriptionId: string,
    cancelAtPeriodEnd = true
  ) => {
    const response = await fetcher('/api/stripe/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, cancelAtPeriodEnd }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to cancel subscription');
    }

    return response.json();
  };

  return {
    checkFeatureAccess,
    markTrialUsed,
    upgradeToPro,
    manageSubscription,
    cancelSubscription,
  };
}
