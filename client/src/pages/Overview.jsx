import { useEffect, useState } from 'react';
import { fetchRepos, fetchCompareRepos } from '../utils/api';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function Overview() {
  const [repos, setRepos] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchRepos(),
      fetchCompareRepos()
    ]).then(([reposRes, comparisonRes]) => {
      setRepos(reposRes.data);
      setComparison(comparisonRes.data);
      setLoading(false);
    }).catch(err => {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data. Please check your connection.');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalCommits = repos.reduce((sum, r) => sum + parseInt(r.total_commits || 0), 0);
  const totalAuthors = repos.reduce((sum, r) => sum + parseInt(r.unique_authors || 0), 0);
  const activeRepos = repos.filter(r => parseInt(r.total_commits) > 0).length;

  const chartColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your git productivity at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stagger-item">
          <StatCard
            title="Total Repositories"
            value={repos.length}
            icon="📦"
            color="blue"
          />
        </div>
        <div className="stagger-item">
          <StatCard
            title="Total Commits"
            value={totalCommits}
            icon="✨"
            color="purple"
          />
        </div>
        <div className="stagger-item">
          <StatCard
            title="Contributors"
            value={totalAuthors}
            icon="👥"
            color="green"
          />
        </div>
        <div className="stagger-item">
          <StatCard
            title="Active Repos"
            value={activeRepos}
            icon="🚀"
            color="orange"
          />
        </div>
      </div>

      {/* Repository Cards */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Repositories
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map((repo, index) => (
            <div key={repo.id} className="card stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {repo.name}
                </h4>
                <span className="text-2xl">📂</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {repo.description || 'No description available'}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Commits:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {parseInt(repo.total_commits || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Contributors:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {repo.unique_authors}
                  </span>
                </div>
                {repo.latest_commit && (
                  <div className="flex justify-between items-center py-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Latest:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Date(repo.latest_commit).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Chart */}
      {comparison.length > 0 && (
        <div className="card fade-in">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Repository Comparison (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="repository_name"
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
              <Bar
                dataKey="total_commits"
                name="Total Commits"
                radius={[8, 8, 0, 0]}
                animationDuration={1000}
              >
                {comparison.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default Overview;
