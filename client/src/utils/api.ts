import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = (import.meta.env?.VITE_API_URL as string | undefined) || '/api';

const api: AxiosInstance = axios.create({
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
export const fetchRepos = (): Promise<AxiosResponse> => api.get('/repos');

// Trends endpoints
export const fetchGlobalMonthlyTrends = (limit: number = 12): Promise<AxiosResponse> =>
  api.get(`/monthly-trends?limit=${limit}`);

export const fetchMonthlyTrends = (repoName: string, limit: number = 12): Promise<AxiosResponse> =>
  api.get(`/monthly-trends/${repoName}?limit=${limit}`);

export const fetchMonthlyCommits = (
  yearMonth: string,
  limit: number = 10,
  repo: string | null = null
): Promise<AxiosResponse> => {
  let url = `/monthly-commits/${yearMonth}?limit=${limit}`;
  if (repo && repo !== 'all') url += `&repo=${repo}`;
  return api.get(url);
};

// Contributors endpoints
export const fetchContributors = (
  limit: number = 20,
  repo: string | null = null,
  dateFrom: string | null = null,
  dateTo: string | null = null
): Promise<AxiosResponse> => {
  let url = `/contributors?limit=${limit}`;
  if (repo && repo !== 'all') url += `&repo=${repo}`;
  if (dateFrom) url += `&dateFrom=${dateFrom}`;
  if (dateTo) url += `&dateTo=${dateTo}`;
  return api.get(url);
};

export const fetchContributorsDateRange = (): Promise<AxiosResponse> =>
  api.get('/contributors/date-range');

// Activity endpoints
export const fetchDailyActivity = (days: number = 30): Promise<AxiosResponse> =>
  api.get(`/daily-activity?days=${days}`);

// Comparison endpoint
export const fetchCompareRepos = (): Promise<AxiosResponse> => api.get('/compare-repos');

// Before/After analysis endpoint
export const fetchBeforeAfter = (
  repoName: string,
  params: Record<string, string>
): Promise<AxiosResponse> =>
  api.get(`/before-after/${repoName}`, { params });

// Category endpoints
export const fetchCategories = (
  repo: string | null = null,
  dateFrom: string | null = null,
  dateTo: string | null = null
): Promise<AxiosResponse> => {
  const params = new URLSearchParams();
  if (repo && repo !== 'all') params.append('repo', repo);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const queryString = params.toString();
  return api.get(`/categories${queryString ? '?' + queryString : ''}`);
};

export const fetchCategoryTrends = (
  months: number = 12,
  repo: string | null = null
): Promise<AxiosResponse> => {
  let url = `/category-trends?months=${months}`;
  if (repo && repo !== 'all') url += `&repo=${repo}`;
  return api.get(url);
};

export const fetchCategoryByRepo = (
  dateFrom: string | null = null,
  dateTo: string | null = null
): Promise<AxiosResponse> => {
  const params = new URLSearchParams();
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const queryString = params.toString();
  return api.get(`/category-by-repo${queryString ? '?' + queryString : ''}`);
};

// Summary report endpoint
export const fetchSummary = (
  repo: string | null = null,
  dateFrom: string | null = null,
  dateTo: string | null = null
): Promise<AxiosResponse> => {
  const params = new URLSearchParams();
  if (repo && repo !== 'all') params.append('repo', repo);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  const queryString = params.toString();
  return api.get(`/summary${queryString ? '?' + queryString : ''}`);
};

// Personal performance endpoint
export const fetchPersonalPerformance = (
  authorEmail: string,
  repo: string | null = null,
  dateFrom: string | null = null,
  dateTo: string | null = null,
  limit: number = 50
): Promise<AxiosResponse> => {
  const params = new URLSearchParams();
  params.append('authorEmail', authorEmail);
  if (repo && repo !== 'all') params.append('repo', repo);
  if (dateFrom) params.append('dateFrom', dateFrom);
  if (dateTo) params.append('dateTo', dateTo);
  params.append('limit', limit.toString());
  return api.get(`/personal-performance?${params.toString()}`);
};

// Auth endpoints (proxied to backend by Vite in dev)
export const checkAuth = (): Promise<AxiosResponse> =>
  axios.get('/auth/check', { withCredentials: true });

export const logout = (): Promise<AxiosResponse> =>
  axios.post('/auth/logout', {}, { withCredentials: true });


// Commit endpoints
export const searchCommits = (params: any): Promise<AxiosResponse> =>
  api.get('/commits', { params });

export const updateCommit = (hash: string, data: any): Promise<AxiosResponse> =>
  api.put(`/commits/${hash}`, data);

export default api;

