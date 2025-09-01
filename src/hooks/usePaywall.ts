import { useState, useCallback } from 'react';

// TODO: Integrate with Clerk auth and Stripe subscription status
export interface PaywallState {
  isPro: boolean;
  hasTrialAvailable: boolean;
  trialUsed: boolean;
}

export function usePaywall() {
  // For MVP, simulate paywall state
  // TODO: Replace with actual Clerk/Stripe integration
  const [paywallState, setPaywallState] = useState<PaywallState>({
    isPro: false,
    hasTrialAvailable: true,
    trialUsed: false
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
  
  const upgradeToProMock = useCallback(() => {
    // TODO: Replace with actual Stripe checkout flow
    setPaywallState(prev => ({
      ...prev,
      isPro: true
    }));
    setShowPaywallDialog(false);
  }, []);
  
  return {
    // State
    isPro: paywallState.isPro,
    hasTrialAvailable: paywallState.hasTrialAvailable,
    trialUsed: paywallState.trialUsed,
    
    // Feature access
    checkFeatureAccess,
    requestFeatureAccess,
    
    // Trial
    useTrial,
    
    // Dialog
    showPaywallDialog,
    paywallFeature,
    closePaywallDialog,
    
    // Upgrade (mock)
    upgradeToProMock
  };
}
