import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia for dark mode tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock localStorage
interface LocalStorageMock extends Storage {
  [key: string]: unknown;
}

const localStorageMock: Partial<LocalStorageMock> = {
  getItem: (key: string): string | null => {
    return (localStorageMock as Record<string, string>)[key] || null;
  },
  setItem: (key: string, value: string): void => {
    (localStorageMock as Record<string, string>)[key] = value.toString();
  },
  removeItem: (key: string): void => {
    delete (localStorageMock as Record<string, string>)[key];
  },
  clear: (): void => {
    Object.keys(localStorageMock).forEach(key => {
      if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear' && key !== 'length' && key !== 'key') {
        delete (localStorageMock as Record<string, unknown>)[key];
      }
    });
  },
  get length(): number {
    return Object.keys(localStorageMock).filter(
      key => !['getItem', 'setItem', 'removeItem', 'clear', 'length', 'key'].includes(key)
    ).length;
  },
  key: (index: number): string | null => {
    const keys = Object.keys(localStorageMock).filter(
      key => !['getItem', 'setItem', 'removeItem', 'clear', 'length', 'key'].includes(key)
    );
    return keys[index] || null;
  },
};

globalThis.localStorage = localStorageMock as Storage;
