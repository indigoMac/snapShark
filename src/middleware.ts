import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';

/**
 * API routes that must never serve data to an anonymous caller.
 *
 * Each handler also checks the session itself; enforcing it here as well means a
 * new route cannot leak data by forgetting that check.
 */
const isProtectedApiRoute = createRouteMatcher([
  '/api/dive-sites(.*)',
  '/api/dives(.*)',
  '/api/photos(.*)',
  '/api/trips(.*)',
  '/api/account(.*)',
]);

const isUploadRoute = createRouteMatcher(['/api/photos']);
const isGeocodeRoute = createRouteMatcher(['/api/geocode(.*)']);

function tooManyRequests(result: {
  limit: number;
  remaining: number;
  resetTime: number;
}) {
  return NextResponse.json(
    {
      error: 'Too many requests. Please slow down and try again shortly.',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    },
    { status: 429, headers: createRateLimitHeaders(result) }
  );
}

export default clerkMiddleware(async (auth, req) => {
  const isUpload = isUploadRoute(req) && req.method === 'POST';

  if (isGeocodeRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await RATE_LIMITS.GEOCODE(req);
    if (!result.success) return tooManyRequests(result);
  }

  if (isProtectedApiRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await (isUpload
      ? RATE_LIMITS.UPLOAD(req)
      : RATE_LIMITS.LOGBOOK(req));
    if (!result.success) return tooManyRequests(result);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
