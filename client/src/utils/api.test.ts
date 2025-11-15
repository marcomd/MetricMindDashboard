import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AxiosInstance } from 'axios';

// Mock axios with a factory function
vi.mock('axios', () => {
  const mockGet = vi.fn();
  const mockUse = vi.fn();
  return {
    default: {
      create: vi.fn(() => ({
        get: mockGet,
        interceptors: {
          response: {
            use: mockUse,
          },
        },
      })),
    },
    // Export mockGet for testing
    mockGet,
  };
});

// Import AFTER mocking
import axios from 'axios';
import {
  fetchRepos,
  fetchGlobalMonthlyTrends,
  fetchMonthlyTrends,
  fetchContributors,
  fetchContributorsDateRange,
  fetchDailyActivity,
  fetchCompareRepos,
  fetchBeforeAfter,
} from './api';

// Get the mock instance
const getMockGet = (): Mock => {
  const mockInstance = axios.create() as AxiosInstance & { get: Mock };
  return mockInstance.get;
};

interface MockResponse<T = unknown> {
  data: T;
}

describe('API utilities', () => {
  let mockGet: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGet = getMockGet();
  });

  describe('fetchRepos', () => {
    it('should fetch repositories', async () => {
      const mockData: MockResponse = { data: [{ id: 1, name: 'test-repo' }] };
      mockGet.mockResolvedValue(mockData);

      const result = await fetchRepos();

      expect(mockGet).toHaveBeenCalledWith('/repos');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchGlobalMonthlyTrends', () => {
    it('should fetch global monthly trends with default limit', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchGlobalMonthlyTrends();

      expect(mockGet).toHaveBeenCalledWith('/monthly-trends?limit=12');
    });

    it('should fetch global monthly trends with custom limit', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchGlobalMonthlyTrends(24);

      expect(mockGet).toHaveBeenCalledWith('/monthly-trends?limit=24');
    });
  });

  describe('fetchMonthlyTrends', () => {
    it('should fetch monthly trends for a specific repo', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchMonthlyTrends('test-repo', 12);

      expect(mockGet).toHaveBeenCalledWith('/monthly-trends/test-repo?limit=12');
    });
  });

  describe('fetchContributors', () => {
    it('should fetch contributors with default parameters', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchContributors();

      expect(mockGet).toHaveBeenCalledWith('/contributors?limit=20');
    });

    it('should fetch contributors with custom limit', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchContributors(50);

      expect(mockGet).toHaveBeenCalledWith('/contributors?limit=50');
    });

    it('should fetch contributors filtered by repo', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchContributors(20, 'test-repo');

      expect(mockGet).toHaveBeenCalledWith('/contributors?limit=20&repo=test-repo');
    });

    it('should not add repo filter when repo is "all"', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchContributors(20, 'all');

      expect(mockGet).toHaveBeenCalledWith('/contributors?limit=20');
    });

    it('should fetch contributors with date range', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchContributors(20, null, '2024-01-01', '2024-12-31');

      expect(mockGet).toHaveBeenCalledWith(
        '/contributors?limit=20&dateFrom=2024-01-01&dateTo=2024-12-31'
      );
    });

    it('should fetch contributors with all filters', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchContributors(50, 'test-repo', '2024-01-01', '2024-12-31');

      expect(mockGet).toHaveBeenCalledWith(
        '/contributors?limit=50&repo=test-repo&dateFrom=2024-01-01&dateTo=2024-12-31'
      );
    });
  });

  describe('fetchContributorsDateRange', () => {
    it('should fetch contributors date range', async () => {
      const mockData: MockResponse = { data: { minDate: '2024-01-01', maxDate: '2024-12-31' } };
      mockGet.mockResolvedValue(mockData);

      const result = await fetchContributorsDateRange();

      expect(mockGet).toHaveBeenCalledWith('/contributors/date-range');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchDailyActivity', () => {
    it('should fetch daily activity with default days', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchDailyActivity();

      expect(mockGet).toHaveBeenCalledWith('/daily-activity?days=30');
    });

    it('should fetch daily activity with custom days', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      await fetchDailyActivity(90);

      expect(mockGet).toHaveBeenCalledWith('/daily-activity?days=90');
    });
  });

  describe('fetchCompareRepos', () => {
    it('should fetch comparison data', async () => {
      const mockData: MockResponse = { data: [] };
      mockGet.mockResolvedValue(mockData);

      const result = await fetchCompareRepos();

      expect(mockGet).toHaveBeenCalledWith('/compare-repos');
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchBeforeAfter', () => {
    it('should fetch before/after analysis with parameters', async () => {
      const mockData: MockResponse = { data: {} };
      const params = {
        beforeStart: '2024-01-01',
        beforeEnd: '2024-03-31',
        afterStart: '2024-04-01',
        afterEnd: '2024-06-30',
      };
      mockGet.mockResolvedValue(mockData);

      const result = await fetchBeforeAfter('test-repo', params);

      expect(mockGet).toHaveBeenCalledWith('/before-after/test-repo', { params });
      expect(result).toEqual(mockData);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from failed requests', async () => {
      const error = new Error('Network error');
      mockGet.mockRejectedValue(error);

      await expect(fetchRepos()).rejects.toThrow('Network error');
    });
  });
});
