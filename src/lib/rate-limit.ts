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
    const key = keyGenerator ? keyGenerator(req) : getClientIdentifier(req);

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
 * Get client identifier for rate limiting
 * Uses IP address with fallbacks
 */
function getClientIdentifier(req: NextRequest): string {
  // Try various headers for IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default identifier
  return 'unknown-ip';
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(cutoff: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
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
} as const;
