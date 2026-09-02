import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';
import { isProStatus } from './subscription';

export type Entitlements = {
  isPro: boolean;
  plan: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const FREE_ENTITLEMENTS: Entitlements = {
  isPro: false,
  plan: 'free',
  subscriptionStatus: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

/**
 * Resolves what the signed-in user is entitled to, from our own database rather
 * than from client-supplied state or auth-provider metadata.
 */
export async function getEntitlements(): Promise<Entitlements> {
  const { userId } = await auth();
  if (!userId) return FREE_ENTITLEMENTS;

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      plan: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  if (!user) return FREE_ENTITLEMENTS;

  return {
    isPro: user.plan === 'pro' && isProStatus(user.subscriptionStatus),
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
  };
}

/**
 * Guard for routes that may only be used by Pro subscribers.
 * Throws an error carrying an HTTP status, matching `requireDbUser`.
 */
export async function requirePro(): Promise<Entitlements> {
  const entitlements = await getEntitlements();
  if (!entitlements.isPro) {
    throw Object.assign(new Error('Pro subscription required'), {
      status: 403,
    });
  }
  return entitlements;
}
