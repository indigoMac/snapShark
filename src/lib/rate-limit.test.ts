import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { getRateLimitClientIdentifier } from '@/lib/rate-limit';

function requestWith(headers: Record<string, string>) {
  return new NextRequest('http://localhost/api/test', { headers });
}

describe('getRateLimitClientIdentifier', () => {
  it('prefers the Vercel-set client IP over a spoofed X-Forwarded-For chain', () => {
    const req = requestWith({
      'x-forwarded-for': '1.1.1.1, 8.8.8.8',
      'x-vercel-forwarded-for': '203.0.113.10',
    });
    expect(getRateLimitClientIdentifier(req)).toBe('203.0.113.10');
  });

  it('does not use the first X-Forwarded-For hop when that is all that exists', () => {
    const req = requestWith({
      'x-forwarded-for': '1.1.1.1, 10.0.0.1',
    });
    expect(getRateLimitClientIdentifier(req)).toBe('10.0.0.1');
  });

  it('uses Cloudflare and X-Real-IP before X-Forwarded-For', () => {
    expect(
      getRateLimitClientIdentifier(
        requestWith({
          'cf-connecting-ip': '198.51.100.2',
          'x-forwarded-for': '1.1.1.1',
        })
      )
    ).toBe('198.51.100.2');

    expect(
      getRateLimitClientIdentifier(
        requestWith({
          'x-real-ip': '192.0.2.9',
          'x-forwarded-for': '1.1.1.1',
        })
      )
    ).toBe('192.0.2.9');
  });
});
