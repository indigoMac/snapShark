export type PaywallFeature =
  | 'batch'
  | 'colour-batch'
  | 'presets'
  | 'advanced-formats'
  | 'zip-export'
  | 'packages'
  | 'background-removal';

export interface PaywallState {
  isPro: boolean;
  hasTrialAvailable: boolean;
  trialUsed: boolean;
  subscriptionStatus?: string;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: string;
  lastPaymentFailed?: string;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
}

export interface PaywallService {
  checkFeatureAccess: (state: PaywallState, feature: PaywallFeature) => boolean;
  markTrialUsed: (state: PaywallState) => PaywallState;
  upgradeToPro: (priceId: string, isYearly?: boolean) => Promise<void>;
  manageSubscription: () => Promise<void>;
  cancelSubscription: (cancelAtPeriodEnd?: boolean) => Promise<unknown>;
}
