import { prisma } from './db';

/**
 * Stripe subscription statuses that grant Pro access.
 *
 * `past_due` is deliberately excluded: the grace-period messaging in the app
 * handles that case, and access should not silently continue after payment
 * stops working.
 */
const PRO_STATUSES = ['active', 'trialing'] as const;

export type SubscriptionSnapshot = {
  clerkUserId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status: string;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
};

export function isProStatus(status?: string | null): boolean {
  return (
    typeof status === 'string' &&
    (PRO_STATUSES as readonly string[]).includes(status)
  );
}

/**
 * Writes the latest Stripe subscription state onto the user record, creating the
 * user if a webhook arrives before they have used a feature that needs a row.
 */
export async function syncSubscriptionToDb(snapshot: SubscriptionSnapshot) {
  const {
    clerkUserId,
    stripeCustomerId,
    stripeSubscriptionId,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  } = snapshot;

  const billing = {
    stripeCustomerId: stripeCustomerId ?? null,
    stripeSubscriptionId: stripeSubscriptionId ?? null,
    plan: isProStatus(status) ? 'pro' : 'free',
    subscriptionStatus: status,
    currentPeriodEnd: currentPeriodEnd ?? null,
    cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
  };

  return prisma.user.upsert({
    where: { clerkUserId },
    update: billing,
    create: { clerkUserId, ...billing },
  });
}

/**
 * Finds the Clerk user behind a Stripe customer using our own records, so
 * subscription events do not depend on scanning the auth provider's user list.
 */
export async function findClerkUserIdByCustomerId(
  stripeCustomerId: string
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId },
    select: { clerkUserId: true },
  });
  return user?.clerkUserId ?? null;
}

export async function getBillingIds(clerkUserId: string) {
  return prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });
}

export function periodEndFromStripe(
  seconds: number | null | undefined
): Date | null {
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null;
}
