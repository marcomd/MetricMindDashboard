import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import apiRoutes from '../routes/api';
import pool from '../db';

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('Commit API Endpoints', () => {
  // Mock authentication middleware if needed, or assume tests run in an env where auth is bypassed or mocked
  // For this test, we are testing the routes directly. If auth middleware is applied in index.ts, we might need to mock it.
  // Looking at api.ts, it doesn't seem to have auth middleware applied directly in the file, it's likely applied in index.ts before mounting the router.
  // So testing the router directly should work without auth if we mount it to a fresh express app.

  it('should search commits with filters', async () => {
    const response = await request(app)
      .get('/api/commits')
      .query({ limit: 5 });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty('hash');
      expect(response.body[0]).toHaveProperty('subject');
    }
  });

  it('should update a commit', async () => {
    // First get a commit to update
    const searchResponse = await request(app).get('/api/commits').query({ limit: 1 });
    if (searchResponse.body.length === 0) {
      console.warn('No commits found to test update');
      return;
    }

    const commit = searchResponse.body[0];
    const newWeight = 95;
    const newAiTools = 'COPILOT';

    const updateResponse = await request(app)
      .put(`/api/commits/${commit.hash}`)
      .send({
        weight: newWeight,
        ai_tools: newAiTools
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.weight).toBe(newWeight);
    expect(updateResponse.body.ai_tools).toBe(newAiTools);

    // Verify persistence
    const verifyResponse = await request(app)
      .get('/api/commits')
      .query({ hash: commit.hash });

    expect(verifyResponse.body[0].weight).toBe(newWeight);
    expect(verifyResponse.body[0].ai_tools).toBe(newAiTools);
  });
});
