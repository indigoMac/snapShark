import { NextRequest } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (for serverless, this resets per function instance)
// For production scale, consider using Redis or similar
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Simple rate limiter for API endpoints
 * @param config Rate limit configuration
 * @returns Function to check rate limit for a request
 */
export function createRateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs, keyGenerator } = config;

  return async (
    req: NextRequest
  ): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  }> => {
    // Generate key for rate limiting (default: IP address)
    const key = keyGenerator
      ? keyGenerator(req)
      : getRateLimitClientIdentifier(req);

    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up expired entries
    cleanupExpiredEntries(windowStart);

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime <= now) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  };
}

/**
 * Client IP for rate limiting. Prefers headers the platform sets, not the
 * first X-Forwarded-For hop, which a caller can spoof.
 */
export function getRateLimitClientIdentifier(req: NextRequest): string {
  const vercelForwarded = firstHop(req.headers.get('x-vercel-forwarded-for'));
  if (vercelForwarded) return vercelForwarded;

  const cfConnectingIp = req.headers.get('cf-connecting-ip')?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  // Last hop is added by the trusted proxy; earlier hops are client-controlled.
  const forwardedLast = lastHop(req.headers.get('x-forwarded-for'));
  if (forwardedLast) return forwardedLast;

  if (req.ip) return req.ip;

  return 'unknown-ip';
}

function firstHop(header: string | null): string | null {
  if (!header) return null;
  return header.split(',')[0]?.trim() || null;
}

function lastHop(header: string | null): string | null {
  if (!header) return null;
  const hops = header
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops[hops.length - 1] ?? null;
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(cutoff: number) {
  // Convert to array to avoid iterator issues
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (entry.resetTime <= cutoff) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  resetTime: number;
}) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Stripe API endpoints - stricter limits
  PAYMENT: createRateLimit({
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // General API endpoints
  API: createRateLimit({
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // Authentication endpoints
  AUTH: createRateLimit({
    maxRequests: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // Logbook reads and edits. Generous, since panning the map and rendering a
  // page of photos both make several requests.
  LOGBOOK: createRateLimit({
    maxRequests: 300,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // Photo uploads, which cost storage and bandwidth.
  UPLOAD: createRateLimit({
    maxRequests: 60,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),

  // Signed-in proxy to OpenStreetMap; still capped so a single account cannot
  // exhaust Nominatim's fair-use allowance.
  GEOCODE: createRateLimit({
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),
} as const;
