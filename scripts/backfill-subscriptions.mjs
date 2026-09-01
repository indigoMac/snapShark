/**
 * Backfills user billing state from Stripe into the database.
 *
 * Stripe is the origin of truth, so this reads live subscriptions rather than
 * copying whatever the auth provider happens to hold. Run once after deploying
 * the subscription columns, and any time you suspect the two have drifted:
 *
 *   node --env-file=.env scripts/backfill-subscriptions.mjs
 *
 * Add --commit to write. Without it the script only reports what it would do.
 */
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const PRO_STATUSES = new Set(['active', 'trialing']);

const commit = process.argv.includes('--commit');
const prisma = new PrismaClient();

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('STRIPE_SECRET_KEY is not set.');
  process.exit(1);
}
const stripe = new Stripe(secretKey);

async function resolveClerkUserId(subscription) {
  const fromSubscription = subscription.metadata?.userId;
  if (fromSubscription) return fromSubscription;

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;
  if (!customerId) return null;

  const existing = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { clerkUserId: true },
  });
  if (existing) return existing.clerkUserId;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer && !customer.deleted && customer.metadata?.userId) {
    return customer.metadata.userId;
  }

  return null;
}

async function main() {
  const unresolved = [];
  let updated = 0;
  let seen = 0;

  for await (const subscription of stripe.subscriptions.list({
    status: 'all',
    limit: 100,
  })) {
    seen += 1;

    const clerkUserId = await resolveClerkUserId(subscription);
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

    if (!clerkUserId) {
      unresolved.push({ subscriptionId: subscription.id, customerId });
      continue;
    }

    const billing = {
      stripeCustomerId: customerId ?? null,
      stripeSubscriptionId: subscription.id,
      plan: PRO_STATUSES.has(subscription.status) ? 'pro' : 'free',
      subscriptionStatus: subscription.status,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    };

    console.log(
      `${commit ? 'writing' : 'would write'} ${clerkUserId}: ${billing.plan} (${subscription.status})`
    );

    if (commit) {
      await prisma.user.upsert({
        where: { clerkUserId },
        update: billing,
        create: { clerkUserId, ...billing },
      });
    }
    updated += 1;
  }

  console.log(`\nSubscriptions seen: ${seen}`);
  console.log(`${commit ? 'Updated' : 'Would update'}: ${updated}`);

  if (unresolved.length > 0) {
    console.warn(
      `\nCould not map ${unresolved.length} subscription(s) to a user. These need manual attention:`
    );
    for (const item of unresolved) {
      console.warn(`  subscription=${item.subscriptionId} customer=${item.customerId}`);
    }
    process.exitCode = 1;
  }

  if (!commit) {
    console.log('\nDry run. Re-run with --commit to apply.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
