import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/db';
import { deleteStoredLogbookPhotos } from '@/lib/store-logbook-photo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ClerkWebhookEvent = {
  type: string;
  data: { id?: string };
};

/**
 * Clerk account lifecycle webhook.
 *
 * Deleting a Clerk account must also erase the logbook we hold for that user,
 * so the right to erasure is honoured without a manual support request.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Clerk webhook is not configured' },
      { status: 500 }
    );
  }

  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing Svix signature headers' },
      { status: 400 }
    );
  }

  const payload = await req.text();

  let event: ClerkWebhookEvent;
  try {
    event = new Webhook(webhookSecret).verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'user.deleted') {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const clerkUserId = event.data?.id;
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ ok: true, alreadyRemoved: true });
  }

  const photos = await prisma.photo.findMany({
    where: { dive: { userId: user.id } },
    select: { url: true },
  });

  // Dives, sites, trips, and photos cascade from the user row.
  await prisma.user.delete({ where: { id: user.id } });
  await deleteStoredLogbookPhotos(photos.map((photo) => photo.url));

  return NextResponse.json({ ok: true, deletedPhotos: photos.length });
}
