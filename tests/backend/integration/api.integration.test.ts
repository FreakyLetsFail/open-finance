import request from 'supertest';
import { app } from '@/backend/server';
import { userService } from '@/backend/services/userService';

describe('API Integration Tests', () => {
  beforeEach(() => {
    userService.clearAll();
  });

  afterEach(() => {
    userService.clearAll();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject(userData);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should reject invalid user data', async () => {
      const invalidData = {
        name: 'J',
        email: 'invalid-email'
      };

      await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(500);
    });

    it('should reject duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      await request(app).post('/api/users').send(userData).expect(201);

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(500);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        name: 'John Doe'
        // missing email
      };

      await request(app)
        .post('/api/users')
        .send(incompleteData)
        .expect(500);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should retrieve existing user', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe', email: 'john@example.com' });

      const userId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all users', async () => {
      await request(app)
        .post('/api/users')
        .send({ name: 'User 1', email: 'user1@example.com' });

      await request(app)
        .post('/api/users')
        .send({ name: 'User 2', email: 'user2@example.com' });

      await request(app)
        .post('/api/users')
        .send({ name: 'User 3', email: 'user3@example.com' });

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toHaveLength(3);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update existing user', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe', email: 'john@example.com' });

      const userId = createResponse.body.id;

      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'Jane Doe', age: 25 })
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        id: userId,
        name: 'Jane Doe',
        email: 'john@example.com',
        age: 25
      });
    });

    it('should return error for non-existent user', async () => {
      await request(app)
        .put('/api/users/non-existent')
        .send({ name: 'Test' })
        .expect(500);
    });

    it('should validate update data', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe', email: 'john@example.com' });

      const userId = createResponse.body.id;

      await request(app)
        .put(`/api/users/${userId}`)
        .send({ age: 15 })
        .expect(500);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete existing user', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe', email: 'john@example.com' });

      const userId = createResponse.body.id;

      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204);

      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .delete('/api/users/non-existent')
        .expect(404);
    });
  });

  describe('Complete User Workflow', () => {
    it('should handle complete CRUD operations', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe', email: 'john@example.com', age: 30 })
        .expect(201);

      const userId = createResponse.body.id;

      // Read
      const readResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(readResponse.body.name).toBe('John Doe');

      // Update
      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'Jane Doe', age: 25 })
        .expect(200);

      expect(updateResponse.body.name).toBe('Jane Doe');
      expect(updateResponse.body.age).toBe(25);

      // List
      const listResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(listResponse.body).toHaveLength(1);

      // Delete
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous creates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/users')
          .send({
            name: `User ${i}`,
            email: `user${i}@example.com`
          })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      const listResponse = await request(app).get('/api/users');
      expect(listResponse.body).toHaveLength(10);
    });

    it('should handle concurrent reads', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'John Doe', email: 'john@example.com' });

      const userId = createResponse.body.id;

      const promises = Array.from({ length: 20 }, () =>
        request(app).get(`/api/users/${userId}`)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(userId);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousInput = {
        name: "'; DROP TABLE users; --",
        email: 'hacker@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(maliciousInput)
        .expect(201);

      // Should create user with escaped input
      expect(response.body.name).toBe(maliciousInput.name);

      // Verify users table still works
      const listResponse = await request(app).get('/api/users');
      expect(listResponse.status).toBe(200);
    });
  });

  describe('Performance', () => {
    it('should respond to health check under 50ms', async () => {
      const start = Date.now();

      await request(app).get('/health').expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    it('should handle 100 users efficiently', async () => {
      const start = Date.now();

      const promises = Array.from({ length: 100 }, (_, i) =>
        request(app)
          .post('/api/users')
          .send({
            name: `User ${i}`,
            email: `user${i}@example.com`
          })
      );

      await Promise.all(promises);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete under 5 seconds
    });
  });
});
