import { useEffect, useState } from 'react';
import { fetchContributors } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function Contributors() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [limitCount, setLimitCount] = useState(20);

  useEffect(() => {
    fetchContributors(limitCount).then(res => {
      setContributors(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching contributors:', err);
      setLoading(false);
    });
  }, [limitCount]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Filter contributors based on search
  const filteredContributors = contributors.filter(c =>
    c.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.author_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = filteredContributors.slice(0, 3);
  const chartData = filteredContributors.slice(0, 15);

  const barColors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#10b981', // green
    '#f59e0b', // orange
    '#ef4444', // red
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Top Contributors
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Leaderboard of most active developers
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search contributors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {/* Limit Selector */}
          <select
            value={limitCount}
            onChange={(e) => setLimitCount(Number(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="flex justify-center items-end space-x-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center stagger-item">
            <div className="text-4xl mb-2">🥈</div>
            <div className="bg-gradient-to-br from-gray-300 to-gray-400 text-white rounded-t-xl p-4 h-32 w-28 sm:w-32 flex flex-col justify-end items-center shadow-lg hover:scale-105 transition-transform duration-300">
              <p className="font-bold text-center text-xs sm:text-sm mb-1 line-clamp-1">
                {topThree[1].author_name}
              </p>
              <p className="text-xl sm:text-2xl font-bold">{topThree[1].total_commits}</p>
              <p className="text-xs opacity-80">commits</p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center stagger-item">
            <div className="text-5xl mb-2">🏆</div>
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-t-xl p-4 h-40 w-28 sm:w-32 flex flex-col justify-end items-center shadow-lg hover:scale-105 transition-transform duration-300">
              <p className="font-bold text-center text-xs sm:text-sm mb-1 line-clamp-1">
                {topThree[0].author_name}
              </p>
              <p className="text-2xl sm:text-3xl font-bold">{topThree[0].total_commits}</p>
              <p className="text-xs opacity-80">commits</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center stagger-item">
            <div className="text-4xl mb-2">🥉</div>
            <div className="bg-gradient-to-br from-orange-300 to-orange-400 text-white rounded-t-xl p-4 h-24 w-28 sm:w-32 flex flex-col justify-end items-center shadow-lg hover:scale-105 transition-transform duration-300">
              <p className="font-bold text-center text-xs sm:text-sm mb-1 line-clamp-1">
                {topThree[2].author_name}
              </p>
              <p className="text-xl sm:text-2xl font-bold">{topThree[2].total_commits}</p>
              <p className="text-xs opacity-80">commits</p>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Commits by Contributor
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
            <YAxis
              dataKey="author_name"
              type="category"
              width={150}
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar dataKey="total_commits" animationDuration={1000} radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="card overflow-hidden">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Detailed Statistics
        </h3>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Commits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Repos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Lines Changed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Lines/Commit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredContributors.map((contributor, index) => (
                <tr
                  key={contributor.author_email}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {contributor.author_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {contributor.author_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
                    {contributor.total_commits.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {contributor.repositories_contributed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {parseInt(contributor.total_lines_changed).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {Math.round(contributor.avg_lines_changed_per_commit).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Contributors;
