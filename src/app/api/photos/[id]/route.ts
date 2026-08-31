import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireDbUser } from '@/lib/auth';

type RouteContext = { params: { id: string } };

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const { user } = await requireDbUser();

    const photo = await prisma.photo.findFirst({
      where: { id: params.id, dive: { userId: user.id } },
      select: { id: true },
    });
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    await prisma.photo.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: err?.status || 500 }
    );
  }
}
