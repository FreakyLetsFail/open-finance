import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { ...options });
}

/**
 * Wait for async operations
 */
export const waitFor = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generate mock user data
 */
export function createMockUser(overrides?: Partial<any>) {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    createdAt: new Date('2024-01-01'),
    ...overrides
  };
}

/**
 * Generate multiple mock users
 */
export function createMockUsers(count: number) {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      id: `user-${i}`,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      age: 20 + i
    })
  );
}

/**
 * Mock fetch responses
 */
export function mockFetch(data: any, status: number = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    } as Response)
  );
}

/**
 * Mock fetch error
 */
export function mockFetchError(error: string) {
  global.fetch = jest.fn(() => Promise.reject(new Error(error)));
}

/**
 * Clear all mocks
 */
export function clearAllMocks() {
  jest.clearAllMocks();
  jest.restoreAllMocks();
}
