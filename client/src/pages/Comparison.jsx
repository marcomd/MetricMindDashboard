import { useEffect, useState } from 'react';
import { fetchCompareRepos } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CountUp from 'react-countup';

const Comparison = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'total_commits', direction: 'desc' });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompareRepos()
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching comparison data:', err);
        setError('Failed to load comparison data');
        setLoading(false);
      });
  }, []);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data based on current sort configuration
  const sortedData = [...data].sort((a, b) => {
    const aValue = parseFloat(a[sortConfig.key]) || 0;
    const bValue = parseFloat(b[sortConfig.key]) || 0;

    if (sortConfig.direction === 'asc') {
      return aValue - bValue;
    }
    return bValue - aValue;
  });

  // Calculate percentage relative to max value
  const getPercentage = (value, key) => {
    if (data.length === 0) return 0;
    const max = Math.max(...data.map(item => parseFloat(item[key]) || 0));
    return max > 0 ? ((parseFloat(value) / max) * 100).toFixed(1) : 0;
  };

  // Get top repository for a specific metric
  const getTopRepo = (key) => {
    if (data.length === 0) return null;
    return data.reduce((max, repo) =>
      (parseFloat(repo[key]) || 0) > (parseFloat(max[key]) || 0) ? repo : max
    );
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{payload[0].payload.repository_name}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Data</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400">No repositories found for comparison</p>
        </div>
      </div>
    );
  }

  const topCommitsRepo = getTopRepo('total_commits');
  const topLinesRepo = getTopRepo('total_lines_changed');
  const topAuthorsRepo = getTopRepo('avg_authors_per_month');
  const mostActiveRepo = getTopRepo('months_active');

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Repository Comparison
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Compare repositories side-by-side across key metrics (last 6 months)
          </p>
        </div>
      </div>

      {/* Top Performers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Most Commits"
          value={topCommitsRepo?.repository_name || 'N/A'}
          suffix={topCommitsRepo ? `${parseInt(topCommitsRepo.total_commits).toLocaleString()} commits` : ''}
          icon="🏆"
          color="blue"
        />
        <StatCard
          title="Most Lines Changed"
          value={topLinesRepo?.repository_name || 'N/A'}
          suffix={topLinesRepo ? `${parseInt(topLinesRepo.total_lines_changed).toLocaleString()} lines` : ''}
          icon="📝"
          color="purple"
        />
        <StatCard
          title="Most Contributors"
          value={topAuthorsRepo?.repository_name || 'N/A'}
          suffix={topAuthorsRepo ? `${parseFloat(topAuthorsRepo.avg_authors_per_month).toFixed(1)} avg/month` : ''}
          icon="👥"
          color="green"
        />
        <StatCard
          title="Most Active"
          value={mostActiveRepo?.repository_name || 'N/A'}
          suffix={mostActiveRepo ? `${mostActiveRepo.months_active} months` : ''}
          icon="⚡"
          color="orange"
        />
      </div>

      {/* Multi-Metric Bar Chart */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Multi-Metric Comparison
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" opacity={0.2} />
            <XAxis
              dataKey="repository_name"
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar dataKey="total_commits" fill="#3b82f6" name="Total Commits" radius={[4, 4, 0, 0]} />
            <Bar dataKey="months_active" fill="#8b5cf6" name="Months Active" radius={[4, 4, 0, 0]} />
            <Bar dataKey="avg_authors_per_month" fill="#10b981" name="Avg Authors/Month" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lines Changed Comparison */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Lines Changed Comparison
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" opacity={0.2} />
            <XAxis
              dataKey="repository_name"
              angle={-45}
              textAnchor="end"
              height={100}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total_lines_changed" fill="#f59e0b" name="Total Lines Changed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Comparison Table */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Detailed Comparison
        </h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Repository
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={() => handleSort('total_commits')}
                >
                  Total Commits {sortConfig.key === 'total_commits' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={() => handleSort('total_lines_changed')}
                >
                  Lines Changed {sortConfig.key === 'total_lines_changed' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={() => handleSort('months_active')}
                >
                  Months Active {sortConfig.key === 'months_active' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={() => handleSort('avg_authors_per_month')}
                >
                  Avg Authors/Month {sortConfig.key === 'avg_authors_per_month' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={() => handleSort('avg_lines_per_commit')}
                >
                  Avg Lines/Commit {sortConfig.key === 'avg_lines_per_commit' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                  Relative Activity
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((repo, index) => {
                const percentage = getPercentage(repo.total_commits, 'total_commits');
                return (
                  <tr
                    key={repo.repository_name}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors stagger-item"
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                      {repo.repository_name}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      <CountUp end={parseInt(repo.total_commits)} duration={1.5} separator="," />
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      <CountUp end={parseInt(repo.total_lines_changed)} duration={1.5} separator="," />
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {repo.months_active}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      {parseFloat(repo.avg_authors_per_month).toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                      <CountUp end={parseFloat(repo.avg_lines_per_commit)} duration={1.5} decimals={0} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex-1 max-w-[100px] bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[45px]">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Click column headers to sort. Relative activity based on total commits.
        </p>
      </div>
    </div>
  );
};

export default Comparison;
