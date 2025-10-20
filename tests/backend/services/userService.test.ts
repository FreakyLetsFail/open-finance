import { UserService } from '@/backend/services/userService';
import { createMockUser } from '../../utils/testHelpers';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
    service.clearAll();
  });

  afterEach(() => {
    service.clearAll();
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const user = await service.createUser(userData);

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('createdAt');
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.age).toBe(userData.age);
    });

    it('should create user without optional age', async () => {
      const userData = {
        name: 'Jane Smith',
        email: 'jane@example.com'
      };

      const user = await service.createUser(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.age).toBeUndefined();
    });

    it('should throw on duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      await service.createUser(userData);

      await expect(service.createUser(userData))
        .rejects.toThrow('Email already exists');
    });

    it('should validate name length', async () => {
      const userData = {
        name: 'J',
        email: 'john@example.com'
      };

      await expect(service.createUser(userData)).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email'
      };

      await expect(service.createUser(userData)).rejects.toThrow();
    });

    it('should validate age range', async () => {
      const tooYoung = {
        name: 'Young User',
        email: 'young@example.com',
        age: 15
      };

      const tooOld = {
        name: 'Old User',
        email: 'old@example.com',
        age: 200
      };

      await expect(service.createUser(tooYoung)).rejects.toThrow();
      await expect(service.createUser(tooOld)).rejects.toThrow();
    });
  });

  describe('getUserById', () => {
    it('should retrieve existing user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const created = await service.createUser(userData);
      const retrieved = await service.getUserById(created.id!);

      expect(retrieved).toEqual(created);
    });

    it('should return null for non-existent user', async () => {
      const user = await service.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should find user by email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const created = await service.createUser(userData);
      const found = await service.getUserByEmail('john@example.com');

      expect(found).toEqual(created);
    });

    it('should return null for non-existent email', async () => {
      const user = await service.getUserByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should be case-sensitive', async () => {
      await service.createUser({
        name: 'John Doe',
        email: 'john@example.com'
      });

      const user = await service.getUserByEmail('JOHN@EXAMPLE.COM');
      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      const created = await service.createUser({
        name: 'John Doe',
        email: 'john@example.com'
      });

      const updated = await service.updateUser(created.id!, {
        name: 'Jane Doe',
        age: 25
      });

      expect(updated.name).toBe('Jane Doe');
      expect(updated.age).toBe(25);
      expect(updated.email).toBe('john@example.com');
    });

    it('should throw for non-existent user', async () => {
      await expect(service.updateUser('non-existent', { name: 'Test' }))
        .rejects.toThrow('User not found');
    });

    it('should validate updated data', async () => {
      const created = await service.createUser({
        name: 'John Doe',
        email: 'john@example.com'
      });

      await expect(service.updateUser(created.id!, { age: 15 }))
        .rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      const created = await service.createUser({
        name: 'John Doe',
        email: 'john@example.com'
      });

      const deleted = await service.deleteUser(created.id!);
      expect(deleted).toBe(true);

      const retrieved = await service.getUserById(created.id!);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const deleted = await service.deleteUser('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('listUsers', () => {
    it('should return empty array when no users', async () => {
      const users = await service.listUsers();
      expect(users).toEqual([]);
    });

    it('should return all users', async () => {
      await service.createUser({ name: 'User 1', email: 'user1@example.com' });
      await service.createUser({ name: 'User 2', email: 'user2@example.com' });
      await service.createUser({ name: 'User 3', email: 'user3@example.com' });

      const users = await service.listUsers();
      expect(users).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum name length', async () => {
      const longName = 'a'.repeat(100);
      const user = await service.createUser({
        name: longName,
        email: 'test@example.com'
      });

      expect(user.name).toBe(longName);
    });

    it('should handle special characters in name', async () => {
      const user = await service.createUser({
        name: "O'Brien-Smith",
        email: 'obrien@example.com'
      });

      expect(user.name).toBe("O'Brien-Smith");
    });

    it('should handle boundary age values', async () => {
      const minAge = await service.createUser({
        name: 'Young Adult',
        email: 'young@example.com',
        age: 18
      });

      const maxAge = await service.createUser({
        name: 'Elder',
        email: 'elder@example.com',
        age: 150
      });

      expect(minAge.age).toBe(18);
      expect(maxAge.age).toBe(150);
    });
  });

  describe('Performance', () => {
    it('should handle bulk operations efficiently', async () => {
      const start = performance.now();

      const promises = Array.from({ length: 100 }, (_, i) =>
        service.createUser({
          name: `User ${i}`,
          email: `user${i}@example.com`
        })
      );

      await Promise.all(promises);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete under 1 second
      expect(await service.listUsers()).toHaveLength(100);
    });
  });
});
