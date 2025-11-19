import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import apiRouter from './api.js';
import pool from '../db.js';

// Mock the database pool
vi.mock('../db.js', () => ({
  default: {
    query: vi.fn(),
  },
}));

describe('API Routes - Monthly Commits', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/monthly-commits/:year_month', () => {
    const mockCommits = [
      {
        commit_date: '2024-01-15',
        commit_hash: 'abc1234',
        commit_message: 'Add new feature',
        author_name: 'John Doe',
        repository_name: 'test-repo',
        lines_changed: 150,
        lines_added: 100,
        lines_deleted: 50,
      },
      {
        commit_date: '2024-01-20',
        commit_hash: 'def5678',
        commit_message: 'Fix bug in authentication',
        author_name: 'Jane Smith',
        repository_name: 'auth-service',
        lines_changed: 80,
        lines_added: 50,
        lines_deleted: 30,
      },
    ];

    it('should return top 10 commits for a valid year_month', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: mockCommits,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const response = await request(app).get('/api/monthly-commits/2024-01');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCommits);
      expect(pool.query).toHaveBeenCalledTimes(1);

      // Verify query structure
      const queryCall = vi.mocked(pool.query).mock.calls[0];
      const query = queryCall[0] as string;
      expect(query).toContain('SELECT');
      expect(query).toContain('FROM commits');
      expect(query).toContain('ORDER BY lines_changed DESC');
      expect(query).toContain('LIMIT');
    });

    it('should filter by repository when repo query param is provided', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockCommits[0]],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const response = await request(app).get('/api/monthly-commits/2024-01?repo=test-repo');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].repository_name).toBe('test-repo');

      // Verify that the query includes repository filter
      const queryCall = vi.mocked(pool.query).mock.calls[0];
      const params = queryCall[1] as any[];
      expect(params).toContain('test-repo');
    });

    it('should respect custom limit parameter', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: mockCommits.slice(0, 5),
        command: 'SELECT',
        rowCount: 5,
        oid: 0,
        fields: [],
      });

      const response = await request(app).get('/api/monthly-commits/2024-01?limit=5');

      expect(response.status).toBe(200);

      // Verify limit is passed to query
      const queryCall = vi.mocked(pool.query).mock.calls[0];
      const params = queryCall[1] as any[];
      expect(params).toContain(5);
    });

    it('should return 400 for invalid year_month format', async () => {
      const response = await request(app).get('/api/monthly-commits/invalid-date');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid year_month format');
    });

    it('should return 400 for year_month with invalid month', async () => {
      const response = await request(app).get('/api/monthly-commits/2024-13');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return empty array when no commits found for the month', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const response = await request(app).get('/api/monthly-commits/2024-01');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(pool.query).mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app).get('/api/monthly-commits/2024-01');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to fetch monthly commits');
    });

    it('should format the date range correctly for the entire month', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: mockCommits,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      await request(app).get('/api/monthly-commits/2024-01');

      // Verify the query uses correct date range for the whole month
      const queryCall = vi.mocked(pool.query).mock.calls[0];
      const params = queryCall[1] as any[];

      // Should have date range parameters
      expect(params).toContain('2024-01-01');
      expect(params).toContain('2024-01-31');
    });

    it('should include all required fields in response', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: mockCommits,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const response = await request(app).get('/api/monthly-commits/2024-01');

      expect(response.status).toBe(200);
      const commit = response.body[0];

      // Verify all required fields are present
      expect(commit).toHaveProperty('commit_date');
      expect(commit).toHaveProperty('commit_hash');
      expect(commit).toHaveProperty('commit_message');
      expect(commit).toHaveProperty('author_name');
      expect(commit).toHaveProperty('repository_name');
      expect(commit).toHaveProperty('lines_changed');
      expect(commit).toHaveProperty('lines_added');
      expect(commit).toHaveProperty('lines_deleted');
    });

    it('should not filter by repository when repo is "all"', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: mockCommits,
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const response = await request(app).get('/api/monthly-commits/2024-01?repo=all');

      expect(response.status).toBe(200);

      // Verify query doesn't filter by repository
      const queryCall = vi.mocked(pool.query).mock.calls[0];
      const params = queryCall[1] as any[];
      expect(params).not.toContain('all');
    });
  });
});
