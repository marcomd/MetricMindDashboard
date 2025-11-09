import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable sending cookies with requests
});

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on authentication errors
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

// Category endpoints
export const fetchCategories = (repo = null, dateFrom = null, dateTo = null) => {
  const params = new URLSearchParams();
  if (repo && repo !== 'all') params.append('repo', repo);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const queryString = params.toString();
  return api.get(`/categories${queryString ? '?' + queryString : ''}`);
};

export const fetchCategoryTrends = (months = 12, repo = null) => {
  let url = `/category-trends?months=${months}`;
  if (repo && repo !== 'all') url += `&repo=${repo}`;
  return api.get(url);
};

export const fetchCategoryByRepo = (dateFrom = null, dateTo = null) => {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const queryString = params.toString();
  return api.get(`/category-by-repo${queryString ? '?' + queryString : ''}`);
};

// Auth endpoints (proxied to backend by Vite in dev)
export const checkAuth = () => axios.get('/auth/check', { withCredentials: true });
export const logout = () => axios.post('/auth/logout', {}, { withCredentials: true });

export default api;
