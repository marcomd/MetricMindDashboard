import { useEffect, useState } from 'react';
import { User, TrendingUp, Code, Calendar, Target, Users, Award, GitBranch } from 'lucide-react';
import { fetchPersonalPerformance, fetchRepos } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import WeightBadge from '../components/WeightBadge';
import { formatDate, toISOFormat, fromISOFormat, addMonths } from '../utils/dateFormat';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell
} from 'recharts';

interface Repository {
  id: number;
  name: string;
}

interface DailyActivity {
  commit_date: string;
  repository_name: string;
  total_commits: number;
  effective_commits: number;
  avg_weight: number;
  weight_efficiency_pct: number;
  total_lines_added: number;
  total_lines_deleted: number;
  total_lines_changed: number;
  weighted_lines_added: number;
  weighted_lines_deleted: number;
  weighted_lines_changed: number;
}

interface PersonalStats {
  total_commits: number;
  effective_commits: number;
  avg_weight: number;
  weight_efficiency_pct: number;
  total_lines_added: number;
  total_lines_deleted: number;
  total_lines_changed: number;
  weighted_lines_changed: number;
  avg_lines_changed_per_commit: number;
  repositories_contributed: number;
  active_days: number;
}

interface RepoBreakdown {
  repository_name: string;
  total_commits: number;
  effective_commits: number;
  avg_weight: number;
  weight_efficiency_pct: number;
  total_lines_changed: number;
  weighted_lines_changed: number;
}

interface CategoryBreakdown {
  category: string;
  category_weight: number;
  total_commits: number;
  effective_commits: number;
  avg_weight: number;
  weight_efficiency_pct: number;
  total_lines_changed: number;
  weighted_lines_changed: number;
}

interface CommitDetail {
  commit_date: string;
  commit_hash: string;
  commit_message: string;
  author_name: string;
  repository_name: string;
  category: string | null;
  lines_changed: number;
  lines_added: number;
  lines_deleted: number;
  weight: number;
}

interface TeamStats {
  total_commits: number;
  effective_commits: number;
  avg_weight: number;
  total_lines_changed: number;
  total_contributors: number;
}

interface PerformanceData {
  personal_stats: PersonalStats;
  daily_activity: DailyActivity[];
  repository_breakdown: RepoBreakdown[];
  category_breakdown: CategoryBreakdown[];
  commit_details: CommitDetail[];
  team_stats: TeamStats;
}

function PersonalPerformance(): JSX.Element {
  const { user } = useAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [useWeightedData, setUseWeightedData] = useState<boolean>(true);
  const [commitLimit, setCommitLimit] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<PerformanceData | null>(null);

  // Fetch repositories on mount
  useEffect(() => {
    fetchRepos().then(res => {
      setRepos(res.data);
    }).catch(err => {
      console.error('Error fetching repos:', err);
    });
  }, []);

  // Fetch personal performance data
  useEffect(() => {
    if (user?.email) {
      setLoading(true);
      fetchPersonalPerformance(user.email, selectedRepo, dateFrom || null, dateTo || null, commitLimit)
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching personal performance:', err);
          setLoading(false);
        });
    }
  }, [user, selectedRepo, dateFrom, dateTo, commitLimit]);

  // Quick date range actions
  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);
    setDateFrom(toISOFormat(formatDate(pastDate)));
    setDateTo(toISOFormat(formatDate(today)));
  };

  const setThisYear = () => {
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    setDateFrom(toISOFormat(formatDate(yearStart)));
    setDateTo(toISOFormat(formatDate(today)));
  };

  const clearDateRange = () => {
    setDateFrom('');
    setDateTo('');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No performance data available</p>
      </div>
    );
  }

  const { personal_stats, daily_activity, repository_breakdown, category_breakdown, commit_details, team_stats } = data;

  // Calculate team comparison metrics
  const teamCommitPercentage = team_stats.total_commits > 0
    ? ((personal_stats.total_commits / team_stats.total_commits) * 100).toFixed(1)
    : '0.0';

  const teamLinesPercentage = team_stats.total_lines_changed > 0
    ? ((personal_stats.total_lines_changed / team_stats.total_lines_changed) * 100).toFixed(1)
    : '0.0';

  // Aggregate daily data for charts (parse numeric values from PostgreSQL)
  const aggregatedData = daily_activity.reduce((acc: any[], item) => {
    const existingDate = acc.find(d => d.commit_date === item.commit_date);
    if (existingDate) {
      existingDate.total_commits += item.total_commits;
      existingDate.effective_commits += parseFloat(item.effective_commits as any) || 0;
      existingDate.total_lines_added += item.total_lines_added;
      existingDate.total_lines_deleted += item.total_lines_deleted;
      existingDate.total_lines_changed += item.total_lines_changed;
      existingDate.weighted_lines_added += parseFloat(item.weighted_lines_added as any) || 0;
      existingDate.weighted_lines_deleted += parseFloat(item.weighted_lines_deleted as any) || 0;
      existingDate.weighted_lines_changed += parseFloat(item.weighted_lines_changed as any) || 0;
    } else {
      // Parse numeric values when pushing new item
      acc.push({
        ...item,
        effective_commits: parseFloat(item.effective_commits as any) || 0,
        weighted_lines_added: parseFloat(item.weighted_lines_added as any) || 0,
        weighted_lines_deleted: parseFloat(item.weighted_lines_deleted as any) || 0,
        weighted_lines_changed: parseFloat(item.weighted_lines_changed as any) || 0,
      });
    }
    return acc;
  }, []);

  // Format chart data for display
  const chartData = aggregatedData.map(item => ({
    date: formatDate(new Date(item.commit_date)),
    commits: useWeightedData && item.effective_commits !== undefined ? item.effective_commits : item.total_commits,
    linesAdded: useWeightedData && item.weighted_lines_added !== undefined ? item.weighted_lines_added : item.total_lines_added,
    linesDeleted: useWeightedData && item.weighted_lines_deleted !== undefined ? item.weighted_lines_deleted : item.total_lines_deleted,
    linesChanged: useWeightedData && item.weighted_lines_changed !== undefined ? item.weighted_lines_changed : item.total_lines_changed,
  }));

  // Color palette for charts
  const barColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-primary-500" />
            Personal Performance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your contributions and impact - {user?.name}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          {/* Date Range */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Repository Filter */}
          <div className="w-full lg:w-auto">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repository
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full lg:w-48 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Repositories</option>
              {repos.map(repo => (
                <option key={repo.id} value={repo.name}>{repo.name}</option>
              ))}
            </select>
          </div>

          {/* Weighted Data Toggle */}
          <div className="w-full lg:w-auto">
            <label className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
              <input
                type="checkbox"
                checked={useWeightedData}
                onChange={(e) => setUseWeightedData(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Use Weighted Data
              </span>
            </label>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setQuickDateRange(30)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setQuickDateRange(60)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Last 60 Days
          </button>
          <button
            onClick={() => setQuickDateRange(90)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            Last 90 Days
          </button>
          <button
            onClick={setThisYear}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            This Year
          </button>
          <button
            onClick={clearDateRange}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Commits"
          value={personal_stats.total_commits}
          icon={<Code className="w-6 h-6" />}
          color="blue"
          effectiveValue={parseFloat(personal_stats.effective_commits as any) || undefined}
          weightEfficiency={parseFloat(personal_stats.weight_efficiency_pct as any) || undefined}
        />
        <StatCard
          title="Lines Changed"
          value={personal_stats.total_lines_changed}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Repositories"
          value={personal_stats.repositories_contributed}
          icon={<GitBranch className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Active Days"
          value={personal_stats.active_days}
          icon={<Calendar className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Team Comparison */}
      <div className="card p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-500" />
          Team Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">% of Team Commits</span>
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {teamCommitPercentage}%
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              {personal_stats.total_commits} of {team_stats.total_commits} total
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900 dark:text-purple-300">% of Team Lines</span>
              <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              {teamLinesPercentage}%
            </div>
            <div className="text-xs text-purple-700 dark:text-purple-400 mt-1">
              {personal_stats.total_lines_changed.toLocaleString()} of {team_stats.total_lines_changed.toLocaleString()} total
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900 dark:text-green-300">Team Size</span>
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              {team_stats.total_contributors}
            </div>
            <div className="text-xs text-green-700 dark:text-green-400 mt-1">
              Active contributors
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <>
          {/* Commits Over Time */}
          <div className="card p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Commits Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                  className="dark:stroke-gray-400"
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                  className="dark:stroke-gray-400"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="commits"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCommits)"
                  name={useWeightedData ? "Effective Commits" : "Commits"}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Lines Changed Over Time */}
          <div className="card p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Lines Changed Over Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                  className="dark:stroke-gray-400"
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                  className="dark:stroke-gray-400"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="linesChanged"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Lines Changed"
                />
                <Line
                  type="monotone"
                  dataKey="linesAdded"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Lines Added"
                />
                <Line
                  type="monotone"
                  dataKey="linesDeleted"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  name="Lines Deleted"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Repository Breakdown */}
      {repository_breakdown.length > 0 && (
        <div className="card p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Contribution by Repository
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Repository
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lines Changed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {repository_breakdown.map((repo, index) => {
                  const efficiency = parseFloat(repo.weight_efficiency_pct as any) || 0;
                  const avgWeight = parseFloat(repo.avg_weight as any) || 0;
                  const effectiveCommits = parseFloat(repo.effective_commits as any) || 0;

                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {repo.repository_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          {repo.total_commits}
                          {efficiency < 100 && (
                            <WeightBadge
                              efficiency={efficiency}
                              totalCommits={repo.total_commits}
                              effectiveCommits={effectiveCommits}
                              size="sm"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {repo.total_lines_changed.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {avgWeight.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {category_breakdown.length > 0 && (
        <div className="card p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Contribution by Category
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lines Changed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category Weight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {category_breakdown.map((cat, index) => {
                  const efficiency = parseFloat(cat.weight_efficiency_pct as any) || 0;
                  const effectiveCommits = parseFloat(cat.effective_commits as any) || 0;

                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {cat.category || 'UNCATEGORIZED'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          {cat.total_commits}
                          {efficiency < 100 && (
                            <WeightBadge
                              efficiency={efficiency}
                              totalCommits={cat.total_commits}
                              effectiveCommits={effectiveCommits}
                              size="sm"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {cat.total_lines_changed.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        cat.category_weight === null ? 'text-gray-600 dark:text-gray-400' :
                        cat.category_weight <= 20 ? 'text-red-600 dark:text-red-400' :
                        cat.category_weight <= 50 ? 'text-orange-600 dark:text-orange-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {cat.category_weight !== null ? `${cat.category_weight}%` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commit Details */}
      {commit_details.length > 0 && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Last {commitLimit} commits
            </h3>
            <select
              value={commitLimit}
              onChange={(e) => setCommitLimit(Number(e.target.value))}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={50}>Last 50 commits</option>
              <option value={100}>Last 100 commits</option>
              <option value={200}>Last 200 commits</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Repository
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lines
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {commit_details.map((commit, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(new Date(commit.commit_date))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {commit.repository_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-md">
                      <div className="line-clamp-2" title={commit.commit_message}>
                        {commit.commit_message}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {commit.commit_hash.substring(0, 7)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {commit.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span className="text-green-600 dark:text-green-400">+{commit.lines_added}</span>
                        <span className="text-red-600 dark:text-red-400">-{commit.lines_deleted}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`
                        ${commit.weight <= 20 ? 'text-red-600 dark:text-red-400' : ''}
                        ${commit.weight > 20 && commit.weight <= 50 ? 'text-orange-600 dark:text-orange-400' : ''}
                        ${commit.weight > 50 ? 'text-gray-600 dark:text-gray-400' : ''}
                        font-medium
                      `}>
                        {commit.weight}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PersonalPerformance;
