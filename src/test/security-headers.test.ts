import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const nextConfig = require('../../next.config.js');

describe('security headers', () => {
  it('allows blob URLs for in-browser video colour-fix', async () => {
    const headerGroups = await nextConfig.headers();
    const csp = headerGroups
      .flatMap((group: { headers: { key: string; value: string }[] }) => group.headers)
      .find((header: { key: string }) => header.key === 'Content-Security-Policy')
      ?.value as string | undefined;

    expect(csp).toBeDefined();
    expect(csp).toMatch(/media-src[^;]*blob:/);
  });
});
