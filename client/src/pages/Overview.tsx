import { useEffect, useState } from 'react';
import { fetchSummary, fetchRepos, fetchContributorsDateRange } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import WeightBadge from '../components/WeightBadge';
import { formatDate } from '../utils/dateFormat';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Repository {
  id: number;
  name: string;
  description: string | null;
  total_commits: string | number;
  effective_commits?: string | number;
  avg_weight?: string | number;
  unique_authors: number;
  latest_commit: string | null;
}

interface DateRange {
  min_date: string | null;
  max_date: string | null;
}

interface OverallStats {
  total_commits: number;
  effective_commits?: string | number;
  avg_weight?: string | number;
  weight_efficiency_pct?: string | number;
  total_lines_added: string;
  total_lines_deleted: string;
  total_lines_changed: string;
  avg_lines_changed_per_commit: string;
  avg_lines_added_per_commit: string;
  avg_lines_deleted_per_commit: string;
}

interface LargestCommit {
  commit_hash: string;
  commit_date: string;
  commit_message: string;
  author_name: string;
  repository_name: string;
  lines_added: number;
  lines_deleted: number;
  lines_changed: number;
  weight?: number;
}

interface TopContributor {
  author_name: string;
  author_email: string;
  total_commits: number;
  effective_commits?: string | number;
  avg_weight?: string | number;
  weight_efficiency_pct?: string | number;
  repositories_contributed: number;
  total_lines_changed: string;
  avg_lines_changed_per_commit: number;
}

interface SummaryData {
  overall_stats: OverallStats;
  largest_commits: LargestCommit[];
  top_contributors: TopContributor[];
}

interface ChartDataPoint {
  name: string;
  lines_changed: number;
  date: string;
}

interface ContributorChartDataPoint {
  name: string;
  commits: number;
}

interface DateOption {
  value: string;
  label: string;
}

function Overview(): JSX.Element {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ min_date: null, max_date: null });
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Fetch repos and date range on mount
  useEffect(() => {
    Promise.all([
      fetchRepos(),
      fetchContributorsDateRange()
    ]).then(([reposRes, dateRangeRes]) => {
      setRepos(reposRes.data);
      setDateRange(dateRangeRes.data);

      // Set default dates to last month and month before
      if (dateRangeRes.data.max_date) {
        const maxDate = new Date(dateRangeRes.data.max_date);
        const lastMonthYear = maxDate.getFullYear();
        const lastMonth = maxDate.getMonth() + 1; // JS months are 0-indexed

        // Set "To" to first day of last month
        const toDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`;
        setDateTo(toDate);

        // Set "From" to first day of month before
        const fromMonthDate = new Date(lastMonthYear, lastMonth - 2, 1); // -2 because months are 0-indexed
        const fromDate = `${fromMonthDate.getFullYear()}-${String(fromMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
        setDateFrom(fromDate);
      }
    }).catch(err => {
      console.error('Error fetching initial data:', err);
    });
  }, []);

  // Fetch summary data when filters change
  useEffect(() => {
    setLoading(true);
    const from = dateFrom || null;
    const to = dateTo || null;
    fetchSummary(selectedRepo, from, to).then(res => {
      setSummaryData(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching summary:', err);
      setLoading(false);
    });
  }, [selectedRepo, dateFrom, dateTo]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!summaryData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const { overall_stats, largest_commits, top_contributors } = summaryData;

  const barColors: string[] = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#10b981', // green
    '#f59e0b', // orange
    '#ef4444', // red
  ];

  // Prepare chart data for largest commits
  const largestCommitsChartData: ChartDataPoint[] = largest_commits.map(commit => ({
    name: commit.author_name,
    lines_changed: commit.lines_changed,
    date: formatDate(commit.commit_date),
  }));

  // Prepare chart data for top contributors
  const topContributorsChartData: ContributorChartDataPoint[] = top_contributors.map(contributor => ({
    name: contributor.author_name,
    commits: contributor.total_commits,
  }));

  // Generate date options for selectors
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

  // Format period for display
  const formatPeriod = (): string => {
    if (dateFrom && dateTo) {
      return `${formatDate(dateFrom)} to ${formatDate(dateTo)}`;
    } else if (dateFrom) {
      return `From ${formatDate(dateFrom)}`;
    } else if (dateTo) {
      return `Until ${formatDate(dateTo)}`;
    }
    return 'All Time';
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your git productivity at a glance
        </p>
      </div>

      {/* Repository Cards - Not subject to filters */}
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
                    {parseInt(String(repo.total_commits || 0)).toLocaleString()}
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

      {/* Filters Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Filter Analytics
        </h3>

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
        </div>

        {/* Period Display */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Period: <span className="text-primary-600 dark:text-primary-400">{formatPeriod()}</span>
          </p>
        </div>
      </div>

      {/* Overall Statistics Cards */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Overall Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Commits"
            value={overall_stats.total_commits}
            icon="📊"
            color="blue"
            effectiveValue={overall_stats.effective_commits ? parseFloat(String(overall_stats.effective_commits)) : undefined}
            weightEfficiency={overall_stats.weight_efficiency_pct ? parseFloat(String(overall_stats.weight_efficiency_pct)) : undefined}
          />
          <StatCard
            title="Total Lines Added"
            value={parseInt(overall_stats.total_lines_added)}
            icon="➕"
            color="green"
          />
          <StatCard
            title="Total Lines Deleted"
            value={parseInt(overall_stats.total_lines_deleted)}
            icon="➖"
            color="orange"
          />
          <StatCard
            title="Total Lines Changed"
            value={parseInt(overall_stats.total_lines_changed)}
            icon="🔄"
            color="purple"
          />
          <StatCard
            title="Avg Lines Changed/Commit"
            value={parseFloat(overall_stats.avg_lines_changed_per_commit)}
            icon="📈"
            color="pink"
          />
          <StatCard
            title="Avg Lines Added/Commit"
            value={parseFloat(overall_stats.avg_lines_added_per_commit)}
            icon="📊"
            color="indigo"
          />
          <StatCard
            title="Avg Lines Deleted/Commit"
            value={parseFloat(overall_stats.avg_lines_deleted_per_commit)}
            icon="📉"
            color="blue"
          />
        </div>
      </div>

      {/* Top 10 Largest Commits Section */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Top 10 Largest Commits
        </h3>

        {/* Bar Chart */}
        <div className="card mb-6">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Lines Changed by Commit
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={largestCommitsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="lines_changed" animationDuration={1000} radius={[8, 8, 0, 0]}>
                {largestCommitsChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Table */}
        <div className="card overflow-hidden">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Commit Details
          </h4>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lines Changed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commit Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Repository
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {largest_commits.map((commit, index) => (
                  <tr
                    key={`${commit.commit_hash}-${index}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatDate(commit.commit_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
                      {commit.lines_changed.toLocaleString()}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{commit.lines_added.toLocaleString()} -{commit.lines_deleted.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {commit.weight !== undefined && commit.weight < 100 ? (
                        <span className={`font-medium ${
                          commit.weight >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                          commit.weight >= 50 ? 'text-orange-600 dark:text-orange-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {commit.weight}%
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">100%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-md">
                      <div className="line-clamp-2" title={commit.commit_message}>
                        {commit.commit_message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {commit.commit_hash.substring(0, 7)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {commit.author_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {commit.repository_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top 10 Contributors Section */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Top 10 Contributors (by commit count)
        </h3>

        {/* Bar Chart */}
        <div className="card mb-6">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Commits by Contributor
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topContributorsChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
              <YAxis
                dataKey="name"
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
              <Bar dataKey="commits" animationDuration={1000} radius={[0, 8, 8, 0]}>
                {topContributorsChartData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Table */}
        <div className="card overflow-hidden">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Contributor Details
          </h4>
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
                    Weight Efficiency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Repos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Lines Changed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg Lines/Commit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {top_contributors.map((contributor, index) => (
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
                      {contributor.effective_commits && contributor.weight_efficiency_pct && parseFloat(String(contributor.weight_efficiency_pct)) < 100 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {typeof contributor.effective_commits === 'number'
                            ? contributor.effective_commits.toFixed(1)
                            : parseFloat(String(contributor.effective_commits)).toFixed(1)} effective
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {contributor.weight_efficiency_pct !== undefined ? (
                        <WeightBadge
                          efficiency={parseFloat(String(contributor.weight_efficiency_pct))}
                          totalCommits={contributor.total_commits}
                          effectiveCommits={contributor.effective_commits}
                          size="sm"
                        />
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
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
    </div>
  );
}

export default Overview;
