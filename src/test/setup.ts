import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Deterministic UUID counter for predictable test results
let uuidCounter = 0;

// Mock crypto.randomUUID with deterministic generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${uuidCounter++}`,
  },
});

// Mock fetch
global.fetch = vi.fn();

// Mock import.meta.env
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-key');

// Reset mocks and counters before each test
beforeEach(() => {
  uuidCounter = 0;
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  vi.mocked(global.fetch).mockClear();
});
