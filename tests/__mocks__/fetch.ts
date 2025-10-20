export const mockFetch = jest.fn();

global.fetch = mockFetch as any;
