const request = require('supertest');
const express = require('express');

// Create test app
const app = express();
app.use(express.json());

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '服务器正常' });
});

describe('Health Check', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('message', '服务器正常');
    });
  });
});