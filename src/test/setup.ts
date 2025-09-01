import { beforeAll, vi } from 'vitest';

// Mock Web Workers
beforeAll(() => {
  global.Worker = vi.fn().mockImplementation(() => ({
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));

  // Mock URL.createObjectURL
  Object.defineProperty(global.URL, 'createObjectURL', {
    value: vi.fn(() => 'mocked-object-url'),
    writable: true,
  });
  Object.defineProperty(global.URL, 'revokeObjectURL', {
    value: vi.fn(),
    writable: true,
  });

  // Mock Canvas API
  global.HTMLCanvasElement.prototype.getContext = vi.fn();
  global.HTMLCanvasElement.prototype.toBlob = vi.fn();
});
