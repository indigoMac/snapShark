import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';

/**
 * Resolves the current Clerk user and ensures a corresponding DB user row exists.
 * Throws a 401-friendly error object if unauthenticated.
 */
export async function requireDbUser() {
  const { userId } = await auth();

  if (!userId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId },
  });

  return { user, clerkUserId: userId };
}
