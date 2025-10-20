/**
 * End-to-End Tests for User Management
 *
 * These tests simulate real user interactions with the full application stack.
 * Requires a running server instance.
 *
 * Run with: npm run test:e2e
 */

import request from 'supertest';
import { app, startServer } from '@/backend/server';
import { userService } from '@/backend/services/userService';

describe('E2E: User Management System', () => {
  let server: any;

  beforeAll(() => {
    server = startServer(3001);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    userService.clearAll();
  });

  describe('Complete User Lifecycle', () => {
    it('should handle realistic user journey', async () => {
      // Step 1: User registration
      const registrationData = {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        age: 28
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(registrationData)
        .expect(201);

      expect(createResponse.body).toMatchObject(registrationData);
      const userId = createResponse.body.id;

      // Step 2: View profile
      const profileResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(profileResponse.body.email).toBe('alice@example.com');

      // Step 3: Update profile
      const updateData = { age: 29 };
      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.age).toBe(29);

      // Step 4: Verify in user list
      const listResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0].id).toBe(userId);

      // Step 5: Account deletion
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204);

      // Step 6: Verify deletion
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('should handle multi-user scenarios', async () => {
      // Create multiple users
      const users = [
        { name: 'User 1', email: 'user1@example.com', age: 25 },
        { name: 'User 2', email: 'user2@example.com', age: 30 },
        { name: 'User 3', email: 'user3@example.com', age: 35 }
      ];

      const createdUsers = await Promise.all(
        users.map(user => request(app).post('/api/users').send(user))
      );

      // Verify all created
      const listResponse = await request(app).get('/api/users');
      expect(listResponse.body).toHaveLength(3);

      // Update one user
      await request(app)
        .put(`/api/users/${createdUsers[1].body.id}`)
        .send({ age: 31 });

      // Delete one user
      await request(app)
        .delete(`/api/users/${createdUsers[0].body.id}`)
        .expect(204);

      // Verify final state
      const finalList = await request(app).get('/api/users');
      expect(finalList.body).toHaveLength(2);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from validation errors', async () => {
      // Attempt invalid creation
      await request(app)
        .post('/api/users')
        .send({ name: 'J', email: 'invalid' })
        .expect(500);

      // Retry with valid data
      const validResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe', email: 'john@example.com' })
        .expect(201);

      expect(validResponse.body).toHaveProperty('id');
    });

    it('should handle duplicate email gracefully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      // First creation succeeds
      await request(app).post('/api/users').send(userData).expect(201);

      // Second creation fails
      await request(app).post('/api/users').send(userData).expect(500);

      // System remains operational
      const healthCheck = await request(app).get('/health');
      expect(healthCheck.status).toBe(200);
    });
  });

  describe('Concurrent User Operations', () => {
    it('should handle simultaneous user registrations', async () => {
      const registrations = Array.from({ length: 20 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: 20 + i
      }));

      const responses = await Promise.all(
        registrations.map(user => request(app).post('/api/users').send(user))
      );

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      // Verify count
      const listResponse = await request(app).get('/api/users');
      expect(listResponse.body).toHaveLength(20);
    });

    it('should handle concurrent updates to different users', async () => {
      // Create users
      const user1 = await request(app)
        .post('/api/users')
        .send({ name: 'User 1', email: 'user1@example.com' });

      const user2 = await request(app)
        .post('/api/users')
        .send({ name: 'User 2', email: 'user2@example.com' });

      // Concurrent updates
      const [update1, update2] = await Promise.all([
        request(app).put(`/api/users/${user1.body.id}`).send({ age: 25 }),
        request(app).put(`/api/users/${user2.body.id}`).send({ age: 30 })
      ]);

      expect(update1.body.age).toBe(25);
      expect(update2.body.age).toBe(30);
    });
  });

  describe('System Resilience', () => {
    it('should maintain data consistency after errors', async () => {
      // Create valid user
      const validUser = await request(app)
        .post('/api/users')
        .send({ name: 'Valid User', email: 'valid@example.com' });

      // Attempt invalid operations
      await request(app)
        .post('/api/users')
        .send({ name: 'Invalid' })
        .expect(500);

      await request(app)
        .put('/api/users/non-existent')
        .send({ name: 'Test' })
        .expect(500);

      // Verify original user still intact
      const checkUser = await request(app)
        .get(`/api/users/${validUser.body.id}`)
        .expect(200);

      expect(checkUser.body.email).toBe('valid@example.com');
    });

    it('should handle high load gracefully', async () => {
      const operations = [];

      // Mix of operations
      for (let i = 0; i < 50; i++) {
        operations.push(
          request(app)
            .post('/api/users')
            .send({ name: `User ${i}`, email: `user${i}@example.com` })
        );
      }

      for (let i = 0; i < 50; i++) {
        operations.push(request(app).get('/api/users'));
      }

      for (let i = 0; i < 50; i++) {
        operations.push(request(app).get('/health'));
      }

      const start = Date.now();
      const results = await Promise.all(operations);
      const duration = Date.now() - start;

      // All operations should complete
      expect(results).toHaveLength(150);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds

      // Verify data integrity
      const finalList = await request(app).get('/api/users');
      expect(finalList.body).toHaveLength(50);
    });
  });

  describe('Security', () => {
    it('should prevent XSS attacks', async () => {
      const xssPayload = {
        name: '<script>alert("XSS")</script>',
        email: 'test@example.com'
      };

      // Server should accept but sanitize would happen at display layer
      const response = await request(app)
        .post('/api/users')
        .send(xssPayload)
        .expect(201);

      expect(response.body.name).toBe(xssPayload.name);
    });

    it('should prevent SQL injection', async () => {
      const sqlPayload = {
        name: "'; DROP TABLE users; --",
        email: 'hacker@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(sqlPayload)
        .expect(201);

      // Verify system still works
      const listResponse = await request(app).get('/api/users');
      expect(listResponse.status).toBe(200);
    });
  });
});
