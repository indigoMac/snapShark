import { PaywallState } from './types';

type MetadataSource = {
  publicMetadata?: Record<string, unknown>;
  privateMetadata?: Record<string, unknown>;
} | null;

function getBooleanFlag(source: Record<string, unknown> | undefined, key: string) {
  return source?.[key] === true;
}

function getString(source: Record<string, unknown> | undefined, key: string) {
  const value = source?.[key];
  return typeof value === 'string' ? value : undefined;
}

export function mapUserToPaywallState(user: MetadataSource): PaywallState {
  const publicMeta = user?.publicMetadata;
  const privateMeta = user?.privateMetadata;

  const isPro =
    getBooleanFlag(privateMeta, 'isProUser') || getBooleanFlag(publicMeta, 'isProUser');

  const subscriptionStatus =
    getString(privateMeta, 'subscriptionStatus') ||
    getString(publicMeta, 'subscriptionStatus');

  const customerId =
    getString(privateMeta, 'stripeCustomerId') || getString(publicMeta, 'stripeCustomerId');

  const subscriptionId =
    getString(privateMeta, 'stripeSubscriptionId') ||
    getString(publicMeta, 'stripeSubscriptionId');

  const cancelAtPeriodEnd =
    (privateMeta?.cancelAtPeriodEnd as boolean | undefined) ||
    (publicMeta?.cancelAtPeriodEnd as boolean | undefined);

  const cancelAt =
    getString(privateMeta, 'cancelAt') || getString(publicMeta, 'cancelAt');

  const lastPaymentFailed =
    getString(privateMeta, 'lastPaymentFailed') || getString(publicMeta, 'lastPaymentFailed');

  const currentPeriodEnd =
    getString(privateMeta, 'currentPeriodEnd') || getString(publicMeta, 'currentPeriodEnd');

  const currentPeriodStart = getString(privateMeta, 'currentPeriodStart');

  return {
    isPro,
    hasTrialAvailable: true,
    trialUsed: false,
    subscriptionStatus,
    customerId,
    subscriptionId,
    cancelAtPeriodEnd,
    cancelAt,
    lastPaymentFailed,
    currentPeriodEnd,
    currentPeriodStart,
  };
}
