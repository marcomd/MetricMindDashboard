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
export const fetchGlobalMonthlyTrends = () => api.get('/monthly-trends');
export const fetchMonthlyTrends = (repoName) => api.get(`/monthly-trends/${repoName}`);

// Contributors endpoint
export const fetchContributors = (limit = 20) => api.get(`/contributors?limit=${limit}`);

// Activity endpoints
export const fetchDailyActivity = (days = 30) => api.get(`/daily-activity?days=${days}`);

// Comparison endpoint
export const fetchCompareRepos = () => api.get('/compare-repos');

// Before/After analysis endpoint
export const fetchBeforeAfter = (repoName, params) =>
  api.get(`/before-after/${repoName}`, { params });

export default api;
