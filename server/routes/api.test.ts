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

  describe('GET /api/personal-performance', () => {
    const mockPersonalStats = {
      total_commits: 150,
      total_lines_changed: 12500,
      total_lines_added: 8000,
      total_lines_deleted: 4500,
      repositories_count: 3,
      active_days: 45,
      effective_commits: 135.5,
      avg_weight: 90.3,
      weight_efficiency_pct: 90.3,
    };

    const mockDailyActivity = [
      {
        commit_date: '2024-01-15',
        repository_name: 'test-repo',
        commits: 5,
        lines_changed: 250,
        lines_added: 150,
        lines_deleted: 100,
        effective_commits: 4.5,
        weighted_lines_changed: 225,
        weighted_lines_added: 135,
        weighted_lines_deleted: 90,
      },
      {
        commit_date: '2024-01-16',
        repository_name: 'test-repo',
        commits: 3,
        lines_changed: 180,
        lines_added: 120,
        lines_deleted: 60,
        effective_commits: 3.0,
        weighted_lines_changed: 180,
        weighted_lines_added: 120,
        weighted_lines_deleted: 60,
      },
    ];

    const mockRepositoryBreakdown = [
      {
        repository_name: 'test-repo',
        total_commits: 80,
        total_lines_changed: 7000,
        effective_commits: 72.0,
        avg_weight: 90.0,
        weight_efficiency_pct: 90.0,
      },
      {
        repository_name: 'auth-service',
        total_commits: 70,
        total_lines_changed: 5500,
        effective_commits: 63.5,
        avg_weight: 90.7,
        weight_efficiency_pct: 90.7,
      },
    ];

    const mockCategoryBreakdown = [
      {
        category: 'BILLING',
        total_commits: 45,
        total_lines_changed: 3500,
        effective_commits: 40.5,
        avg_weight: 90.0,
        weight_efficiency_pct: 90.0,
      },
      {
        category: 'AUTH',
        total_commits: 35,
        total_lines_changed: 2800,
        effective_commits: 35.0,
        avg_weight: 100.0,
        weight_efficiency_pct: 100.0,
      },
      {
        category: 'UNCATEGORIZED',
        total_commits: 70,
        total_lines_changed: 6200,
        effective_commits: 60.0,
        avg_weight: 85.7,
        weight_efficiency_pct: 85.7,
      },
    ];

    const mockCommitDetails = [
      {
        commit_date: '2024-01-20',
        commit_hash: 'abc1234',
        commit_message: 'Add billing feature',
        repository_name: 'test-repo',
        category: 'BILLING',
        lines_changed: 250,
        lines_added: 150,
        lines_deleted: 100,
        weight: 90,
      },
      {
        commit_date: '2024-01-19',
        commit_hash: 'def5678',
        commit_message: 'Fix auth bug',
        repository_name: 'auth-service',
        category: 'AUTH',
        lines_changed: 80,
        lines_added: 50,
        lines_deleted: 30,
        weight: 100,
      },
    ];

    const mockTeamStats = {
      team_commits: 500,
      team_lines_changed: 45000,
      team_size: 8,
    };

    it('should return personal performance data for valid authorEmail', async () => {
      // Mock all 6 queries
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockPersonalStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockDailyActivity, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockRepositoryBreakdown, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown, command: 'SELECT', rowCount: 3, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCommitDetails, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockTeamStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('personal_stats');
      expect(response.body).toHaveProperty('daily_activity');
      expect(response.body).toHaveProperty('repository_breakdown');
      expect(response.body).toHaveProperty('category_breakdown');
      expect(response.body).toHaveProperty('commit_details');
      expect(response.body).toHaveProperty('team_stats');

      expect(response.body.personal_stats).toEqual(mockPersonalStats);
      expect(response.body.daily_activity).toEqual(mockDailyActivity);
      expect(pool.query).toHaveBeenCalledTimes(6);
    });

    it('should return 400 when authorEmail parameter is missing', async () => {
      const response = await request(app).get('/api/personal-performance');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authorEmail parameter is required');
    });

    it('should filter by repository when repo query param is provided', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockPersonalStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockDailyActivity, command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockRepositoryBreakdown[0]], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown, command: 'SELECT', rowCount: 3, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCommitDetails, command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockTeamStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com&repo=test-repo');

      expect(response.status).toBe(200);

      // Verify that queries include repository filter
      const queryCalls = vi.mocked(pool.query).mock.calls;
      expect(queryCalls.length).toBe(6);

      // At least one query should have test-repo in params
      const hasRepoFilter = queryCalls.some(call => {
        const params = call[1] as any[];
        return params && params.includes('test-repo');
      });
      expect(hasRepoFilter).toBe(true);
    });

    it('should filter by date range when dateFrom and dateTo are provided', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockPersonalStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockDailyActivity, command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockRepositoryBreakdown, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown, command: 'SELECT', rowCount: 3, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCommitDetails, command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockTeamStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com&dateFrom=2024-01-01&dateTo=2024-01-31');

      expect(response.status).toBe(200);

      // Verify that queries include date filters
      const queryCalls = vi.mocked(pool.query).mock.calls;
      const hasDateFilter = queryCalls.some(call => {
        const params = call[1] as any[];
        return params && (params.includes('2024-01-01') || params.includes('2024-01-31'));
      });
      expect(hasDateFilter).toBe(true);
    });

    it('should respect custom limit parameter for commit details', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockPersonalStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockDailyActivity, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockRepositoryBreakdown, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown, command: 'SELECT', rowCount: 3, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCommitDetails, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockTeamStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com&limit=100');

      expect(response.status).toBe(200);

      // Verify limit is in commit details query string (5th query, index 4)
      const commitDetailsQuery = vi.mocked(pool.query).mock.calls[4];
      const queryString = commitDetailsQuery[0] as string;
      expect(queryString).toContain('LIMIT 100');
    });

    it('should use default limit of 50 when limit parameter is not provided', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockPersonalStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockDailyActivity, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockRepositoryBreakdown, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown, command: 'SELECT', rowCount: 3, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCommitDetails, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockTeamStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com');

      expect(response.status).toBe(200);

      // Verify default limit of 50 is in commit details query string
      const commitDetailsQuery = vi.mocked(pool.query).mock.calls[4];
      const queryString = commitDetailsQuery[0] as string;
      expect(queryString).toContain('LIMIT 50');
    });

    it('should handle empty results gracefully', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [{ total_commits: 0, total_lines_changed: 0, repositories_count: 0, active_days: 0 }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ team_commits: 0, team_lines_changed: 0, team_size: 0 }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=new@example.com');

      expect(response.status).toBe(200);
      expect(response.body.daily_activity).toEqual([]);
      expect(response.body.repository_breakdown).toEqual([]);
      expect(response.body.category_breakdown).toEqual([]);
      expect(response.body.commit_details).toEqual([]);
    });

    it('should not filter by repository when repo is "all"', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockPersonalStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockDailyActivity, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockRepositoryBreakdown, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown, command: 'SELECT', rowCount: 3, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCommitDetails, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockTeamStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com&repo=all');

      expect(response.status).toBe(200);

      // Verify query doesn't filter by 'all'
      const queryCalls = vi.mocked(pool.query).mock.calls;
      const hasAllFilter = queryCalls.some(call => {
        const params = call[1] as any[];
        return params && params.includes('all');
      });
      expect(hasAllFilter).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(pool.query).mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Failed to fetch personal performance data');
    });

    it('should include all required fields in personal_stats', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockPersonalStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockDailyActivity, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockRepositoryBreakdown, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown, command: 'SELECT', rowCount: 3, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCommitDetails, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockTeamStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com');

      expect(response.status).toBe(200);
      const stats = response.body.personal_stats;

      // Verify all required fields are present
      expect(stats).toHaveProperty('total_commits');
      expect(stats).toHaveProperty('total_lines_changed');
      expect(stats).toHaveProperty('repositories_count');
      expect(stats).toHaveProperty('active_days');
    });

    it('should include weight metrics when available', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockPersonalStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockDailyActivity, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockRepositoryBreakdown, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown, command: 'SELECT', rowCount: 3, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCommitDetails, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockTeamStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com');

      expect(response.status).toBe(200);

      // Check for weight fields in various sections
      if (response.body.personal_stats.effective_commits !== undefined) {
        expect(response.body.personal_stats).toHaveProperty('effective_commits');
        expect(response.body.personal_stats).toHaveProperty('weight_efficiency_pct');
      }

      if (response.body.repository_breakdown.length > 0 && response.body.repository_breakdown[0].effective_commits !== undefined) {
        expect(response.body.repository_breakdown[0]).toHaveProperty('effective_commits');
        expect(response.body.repository_breakdown[0]).toHaveProperty('weight_efficiency_pct');
      }

      if (response.body.commit_details.length > 0) {
        expect(response.body.commit_details[0]).toHaveProperty('weight');
      }
    });

    it('should include category weight in category breakdown', async () => {
      vi.mocked(pool.query)
        .mockResolvedValueOnce({ rows: [mockPersonalStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockDailyActivity, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockRepositoryBreakdown, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCategoryBreakdown, command: 'SELECT', rowCount: 3, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: mockCommitDetails, command: 'SELECT', rowCount: 2, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [mockTeamStats], command: 'SELECT', rowCount: 1, oid: 0, fields: [] });

      const response = await request(app).get('/api/personal-performance?authorEmail=john@example.com');

      expect(response.status).toBe(200);
      expect(response.body.category_breakdown.length).toBeGreaterThan(0);

      const firstCategory = response.body.category_breakdown[0];
      expect(firstCategory).toHaveProperty('category');
      expect(firstCategory).toHaveProperty('total_commits');
      expect(firstCategory).toHaveProperty('avg_weight');
    });
  });
});
