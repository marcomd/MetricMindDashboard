import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Repository endpoints
export const fetchRepos = () => api.get('/repos');

// Trends endpoints
export const fetchGlobalMonthlyTrends = (limit = 12) => api.get(`/monthly-trends?limit=${limit}`);
export const fetchMonthlyTrends = (repoName, limit = 12) => api.get(`/monthly-trends/${repoName}?limit=${limit}`);

// Contributors endpoints
export const fetchContributors = (limit = 20, repo = null, dateFrom = null, dateTo = null) => {
  let url = `/contributors?limit=${limit}`;
  if (repo && repo !== 'all') url += `&repo=${repo}`;
  if (dateFrom) url += `&dateFrom=${dateFrom}`;
  if (dateTo) url += `&dateTo=${dateTo}`;
  return api.get(url);
};
export const fetchContributorsDateRange = () => api.get('/contributors/date-range');

// Activity endpoints
export const fetchDailyActivity = (days = 30) => api.get(`/daily-activity?days=${days}`);

// Comparison endpoint
export const fetchCompareRepos = () => api.get('/compare-repos');

// Before/After analysis endpoint
export const fetchBeforeAfter = (repoName, params) =>
  api.get(`/before-after/${repoName}`, { params });

export default api;
