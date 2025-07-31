const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const testUser = {
        username: `testuser_${Date.now()}`,
        password: 'testpass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '注册成功');
      expect(response.body).toHaveProperty('userId');
    });

    it('should fail registration with missing username', async () => {
      const testUser = {
        password: 'testpass123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail registration with missing password', async () => {
      const testUser = {
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should fail login with invalid credentials', async () => {
      const invalidUser = {
        username: 'nonexistentuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidUser);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});