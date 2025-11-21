import { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import { fetchContributors, fetchRepos, fetchContributorsDateRange } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Repository {
  id: number;
  name: string;
}

interface DateRange {
  min_date: string | null;
  max_date: string | null;
}

interface Contributor {
  author_name: string;
  author_email: string;
  total_commits: number;
  effective_commits?: string | number;
  avg_weight?: string | number;
  weight_efficiency_pct?: string | number;
  repositories_contributed: number;
  total_lines_changed: string;
  weighted_lines_changed?: string | number;
  avg_lines_changed_per_commit: number;
}

interface DateOption {
  value: string;
  label: string;
}

function Contributors(): JSX.Element {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [limitCount, setLimitCount] = useState<number>(20);
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ min_date: null, max_date: null });
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [useWeightedData, setUseWeightedData] = useState<boolean>(true);

  // Fetch repos and date range on mount
  useEffect(() => {
    Promise.all([
      fetchRepos(),
      fetchContributorsDateRange()
    ]).then(([reposRes, dateRangeRes]) => {
      setRepos(reposRes.data);
      setDateRange(dateRangeRes.data);
      // Don't set default dates - leave them empty to use unfiltered view
    }).catch(err => {
      console.error('Error fetching initial data:', err);
    });
  }, []);

  // Fetch contributors when filters change
  useEffect(() => {
    setLoading(true);
    // Only pass date filters if they're explicitly set
    const from = dateFrom || null;
    const to = dateTo || null;
    fetchContributors(limitCount, selectedRepo, from, to).then(res => {
      setContributors(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching contributors:', err);
      setLoading(false);
    });
  }, [limitCount, selectedRepo, dateFrom, dateTo]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Filter contributors based on search
  const filteredContributors: Contributor[] = contributors.filter(c =>
    c.author_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.author_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree: Contributor[] = filteredContributors.slice(0, 3);
  const chartData = filteredContributors.slice(0, 15).map(c => ({
    ...c,
    effective_commits: c.effective_commits ? Number(c.effective_commits) / 100 : c.total_commits
  }));

  const barColors: string[] = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#10b981', // green
    '#f59e0b', // orange
    '#ef4444', // red
  ];

  // Generate month/year options for date range selectors
  const generateDateOptions = (): DateOption[] => {
    if (!dateRange.min_date || !dateRange.max_date) return [];

    const options: DateOption[] = [];
    const start = new Date(dateRange.min_date);
    const end = new Date(dateRange.max_date);

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-01`;
      const label = current.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      options.push({ value: yearMonth, label });
      current.setMonth(current.getMonth() + 1);
    }

    return options;
  };

  const dateOptions: DateOption[] = generateDateOptions();

  return (
    <div className="space-y-8 fade-in">
      {/* Header with Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Top Contributors
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Leaderboard of most active developers
            </p>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-3">
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

          {/* Date From Selector */}
          <select
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">From...</option>
            {dateOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Date To Selector */}
          <select
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">To...</option>
            {dateOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search contributors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent flex-grow"
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

          {/* Use Weighted Data Checkbox */}
          <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
            <input
              type="checkbox"
              checked={useWeightedData}
              onChange={(e) => setUseWeightedData(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
            />
            <Scale className="w-4 h-4" />
            <span className="text-sm font-medium whitespace-nowrap">Use Weighted Data</span>
          </label>
        </div>
      </div>

      {/* Top 3 Podium */}
      {topThree.length >= 3 && (
        <div className="flex justify-center items-end space-x-4 mb-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center stagger-item">
            <div className="text-4xl mb-2">🥈</div>
            <div className="bg-gradient-to-br from-gray-300 to-gray-400 text-white rounded-t-xl p-4 h-40 w-28 sm:w-32 flex flex-col justify-end items-center shadow-lg hover:scale-105 transition-transform duration-300">
              <p className="font-bold text-center text-xs sm:text-sm mb-1 line-clamp-1">
                {topThree[1].author_name}
              </p>
              <p className="text-xl sm:text-2xl font-bold">
                {useWeightedData && topThree[1].effective_commits
                  ? Math.round(Number(topThree[1].effective_commits) / 100)
                  : topThree[1].total_commits}
              </p>
              <p className="text-xs opacity-80">commits</p>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center stagger-item">
            <div className="text-5xl mb-2">🏆</div>
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white rounded-t-xl p-4 h-48 w-28 sm:w-32 flex flex-col justify-end items-center shadow-lg hover:scale-105 transition-transform duration-300">
              <p className="font-bold text-center text-xs sm:text-sm mb-1 line-clamp-1">
                {topThree[0].author_name}
              </p>
              <p className="text-2xl sm:text-3xl font-bold">
                {useWeightedData && topThree[0].effective_commits
                  ? Math.round(Number(topThree[0].effective_commits) / 100)
                  : topThree[0].total_commits}
              </p>
              <p className="text-xs opacity-80">commits</p>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center stagger-item">
            <div className="text-4xl mb-2">🥉</div>
            <div className="bg-gradient-to-br from-orange-300 to-orange-400 text-white rounded-t-xl p-4 h-32 w-28 sm:w-32 flex flex-col justify-end items-center shadow-lg hover:scale-105 transition-transform duration-300">
              <p className="font-bold text-center text-xs sm:text-sm mb-1 line-clamp-1">
                {topThree[2].author_name}
              </p>
              <p className="text-xl sm:text-2xl font-bold">
                {useWeightedData && topThree[2].effective_commits
                  ? Math.round(Number(topThree[2].effective_commits) / 100)
                  : topThree[2].total_commits}
              </p>
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
            <Bar
              dataKey={useWeightedData ? "effective_commits" : "total_commits"}
              animationDuration={1000}
              radius={[0, 8, 8, 0]}
            >
              {chartData.map((_entry, index) => (
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
                    {(useWeightedData && contributor.effective_commits
                      ? Math.round(Number(contributor.effective_commits) / 100)
                      : contributor.total_commits
                    ).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {contributor.repositories_contributed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {Math.round(parseFloat(String(
                      useWeightedData
                        ? (contributor.weighted_lines_changed || contributor.total_lines_changed)
                        : contributor.total_lines_changed
                    ))).toLocaleString()}
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
