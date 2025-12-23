export type PaywallFeature =
  | 'batch'
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
  customerId?: string;
  subscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: string;
  lastPaymentFailed?: boolean;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
}

export interface PaywallService {
  checkFeatureAccess: (state: PaywallState, feature: PaywallFeature) => boolean;
  markTrialUsed: (state: PaywallState) => PaywallState;
  upgradeToPro: (priceId: string, isYearly?: boolean) => Promise<void>;
  manageSubscription: (customerId: string) => Promise<void>;
  cancelSubscription: (
    subscriptionId: string,
    cancelAtPeriodEnd?: boolean
  ) => Promise<unknown>;
}
