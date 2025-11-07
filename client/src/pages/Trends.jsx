import { useEffect, useState } from 'react';
import { fetchRepos, fetchMonthlyTrends, fetchGlobalMonthlyTrends } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

function Trends() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [monthsToShow, setMonthsToShow] = useState(12);

  useEffect(() => {
    fetchRepos().then(res => {
      setRepos(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching repos:', err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      setDataLoading(true);
      const fetchData = selectedRepo === 'all'
        ? fetchGlobalMonthlyTrends()
        : fetchMonthlyTrends(selectedRepo);

      fetchData.then(res => {
        // Reverse to show oldest first
        const reversedData = [...res.data].reverse();
        setTrends(reversedData.slice(-monthsToShow));
        setDataLoading(false);
      }).catch(err => {
        console.error('Error fetching trends:', err);
        setDataLoading(false);
      });
    }
  }, [selectedRepo, monthsToShow]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const avgCommitsPerMonth = trends.length > 0
    ? Math.round(trends.reduce((sum, t) => sum + (t.total_commits || 0), 0) / trends.length)
    : 0;

  const avgLinesPerCommit = trends.length > 0
    ? Math.round(trends.reduce((sum, t) => sum + parseFloat(t.avg_lines_changed_per_commit || 0), 0) / trends.length)
    : 0;

  const avgAuthorsPerMonth = trends.length > 0
    ? Math.round(trends.reduce((sum, t) => sum + (selectedRepo === 'all' ? (t.total_authors || t.unique_authors || 0) : (t.unique_authors || 0)), 0) / trends.length)
    : 0;

  return (
    <div className="space-y-8 fade-in">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Monthly Trends
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track productivity over time
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Repository Selector */}
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Repositories</option>
            {repos.map(repo => (
              <option key={repo.id} value={repo.name}>{repo.name}</option>
            ))}
          </select>

          {/* Time Range Selector */}
          <select
            value={monthsToShow}
            onChange={(e) => setMonthsToShow(Number(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
            <option value={24}>Last 24 Months</option>
          </select>
        </div>
      </div>

      {dataLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Commits Over Time */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Commits Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="year_month"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_commits"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCommits)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Lines Changed */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Lines Added vs Deleted
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="year_month"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_lines_added"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Lines Added"
                  animationDuration={1000}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="total_lines_deleted"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Lines Deleted"
                  animationDuration={1000}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Average Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Commits/Month
                </h4>
                <span className="text-2xl">📈</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {avgCommitsPerMonth.toLocaleString()}
              </p>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Lines/Commit
                </h4>
                <span className="text-2xl">💻</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {avgLinesPerCommit.toLocaleString()}
              </p>
            </div>
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600 dark:text-gray-400">
                  Avg Contributors/Month
                </h4>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {avgAuthorsPerMonth}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Trends;
