import { useState, useCallback } from 'react';
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
  const { user } = useUser();
  
  // Get subscription status from Clerk user metadata
  const isProUser = user?.privateMetadata?.isProUser === true;
  const subscriptionStatus = user?.privateMetadata?.subscriptionStatus as string;
  const customerId = user?.privateMetadata?.stripeCustomerId as string;
  const trialUsedFromStorage = localStorage.getItem('snapshark-trial-used') === 'true';
  
  const [paywallState, setPaywallState] = useState<PaywallState>({
    isPro: isProUser,
    hasTrialAvailable: !trialUsedFromStorage,
    trialUsed: trialUsedFromStorage,
    subscriptionStatus,
    customerId,
  });
  
  const [showPaywallDialog, setShowPaywallDialog] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<string>('');
  
  const checkFeatureAccess = useCallback((feature: 'batch' | 'presets' | 'advanced-formats' | 'zip-export'): boolean => {
    if (paywallState.isPro) return true;
    
    // Allow trial for batch processing (up to 3 files)
    if (feature === 'batch' && paywallState.hasTrialAvailable) {
      return true;
    }
    
    return false;
  }, [paywallState]);
  
  const requestFeatureAccess = useCallback((
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
  }, [checkFeatureAccess]);
  
  const useTrial = useCallback(() => {
    if (!paywallState.hasTrialAvailable || paywallState.trialUsed) {
      return false;
    }
    
    // Save trial usage to localStorage
    localStorage.setItem('snapshark-trial-used', 'true');
    
    setPaywallState(prev => ({
      ...prev,
      trialUsed: true,
      hasTrialAvailable: false
    }));
    
    setShowPaywallDialog(false);
    return true;
  }, [paywallState]);
  
  const closePaywallDialog = useCallback(() => {
    setShowPaywallDialog(false);
    setPaywallFeature('');
  }, []);
  
  const upgradeToPro = useCallback(async (priceId: string, isYearly = false) => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId, isYearly }),
      });
      
      const { sessionId, url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  }, []);
  
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
    isPro: isProUser, // Use real subscription status
    hasTrialAvailable: paywallState.hasTrialAvailable,
    trialUsed: paywallState.trialUsed,
    subscriptionStatus,
    customerId,
    
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
