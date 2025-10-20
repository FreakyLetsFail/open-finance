import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from '@/frontend/hooks/useUsers';
import { mockFetch, mockFetchError } from '../../utils/testHelpers';

describe('useUsers Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch users on mount', async () => {
    const mockUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' }
    ];

    mockFetch(mockUsers);

    const { result } = renderHook(() => useUsers());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.users).toEqual(mockUsers);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle fetch errors', async () => {
    mockFetchError('Network error');

    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
      expect(result.current.users).toEqual([]);
    });
  });

  it('should create a new user', async () => {
    const existingUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com' }
    ];
    const newUser = { id: '2', name: 'User 2', email: 'user2@example.com' };

    // First fetch returns existing users
    mockFetch(existingUsers);

    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.users).toEqual(existingUsers);
    });

    // Mock create response
    mockFetch(newUser, 201);

    await result.current.createUser({
      name: 'User 2',
      email: 'user2@example.com'
    });

    await waitFor(() => {
      expect(result.current.users).toHaveLength(2);
      expect(result.current.users[1]).toEqual(newUser);
    });
  });

  it('should delete a user', async () => {
    const users = [
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' }
    ];

    mockFetch(users);

    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.users).toHaveLength(2);
    });

    // Mock delete response
    mockFetch(null, 204);

    await result.current.deleteUser('1');

    await waitFor(() => {
      expect(result.current.users).toHaveLength(1);
      expect(result.current.users[0].id).toBe('2');
    });
  });

  it('should refetch users', async () => {
    const initialUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com' }
    ];
    const updatedUsers = [
      { id: '1', name: 'User 1', email: 'user1@example.com' },
      { id: '2', name: 'User 2', email: 'user2@example.com' }
    ];

    mockFetch(initialUsers);

    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.users).toEqual(initialUsers);
    });

    // Update mock for refetch
    mockFetch(updatedUsers);

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.users).toEqual(updatedUsers);
    });
  });

  it('should handle create user errors', async () => {
    mockFetch([]);

    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.users).toEqual([]);
    });

    mockFetchError('Failed to create user');

    await expect(
      result.current.createUser({ name: 'Test', email: 'test@example.com' })
    ).rejects.toThrow('Failed to create user');

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should use custom API URL', async () => {
    const customUrl = '/api/v2/users';
    mockFetch([]);

    renderHook(() => useUsers(customUrl));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(customUrl);
    });
  });
});
