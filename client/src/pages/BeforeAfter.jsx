import { useEffect, useState } from 'react';
import { fetchRepos, fetchBeforeAfter } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { addMonths } from '../utils/dateFormat';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BeforeAfter = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [beforeStart, setBeforeStart] = useState('');
  const [beforeEnd, setBeforeEnd] = useState('');
  const [afterStart, setAfterStart] = useState('');
  const [afterEnd, setAfterEnd] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Load repositories on mount
  useEffect(() => {
    fetchRepos()
      .then(res => {
        setRepos(res.data);
        if (res.data.length > 0) {
          setSelectedRepo(res.data[0].name);
        }
      })
      .catch(err => {
        console.error('Error fetching repositories:', err);
        setError('Failed to load repositories');
      });
  }, []);

  // Set default date ranges for year-over-year comparison
  useEffect(() => {
    // Helper function to format date as yyyy-mm-dd in local time (no timezone conversion)
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();

    // After End: Last day of previous month
    // If today is November 9, 2025 -> October 31, 2025
    const lastDayOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const afterEndISO = formatLocalDate(lastDayOfPrevMonth);

    // After Start: First day of current month, minus 12 months
    // If today is November 9, 2025 -> November 1, 2025 - 12 months = November 1, 2024
    const afterStartDate = new Date(today.getFullYear(), today.getMonth() - 12, 1);
    const afterStartISO = formatLocalDate(afterStartDate);

    // Before period: Same dates but 1 year earlier
    const beforeStartDate = new Date(today.getFullYear() - 1, today.getMonth() - 12, 1);
    const beforeStartISO = formatLocalDate(beforeStartDate);

    const beforeEndDate = new Date(today.getFullYear() - 1, today.getMonth(), 0);
    const beforeEndISO = formatLocalDate(beforeEndDate);

    // Set all dates in yyyy-mm-dd format
    setBeforeStart(beforeStartISO);
    setBeforeEnd(beforeEndISO);
    setAfterStart(afterStartISO);
    setAfterEnd(afterEndISO);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedRepo || !beforeStart || !beforeEnd || !afterStart || !afterEnd) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setHasAnalyzed(false);

    try {
      // Dates are already in yyyy-mm-dd format, pass directly to API
      const res = await fetchBeforeAfter(selectedRepo, {
        beforeStart,
        beforeEnd,
        afterStart,
        afterEnd
      });
      setData(res.data);
      setHasAnalyzed(true);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching before/after analysis:', err);
      setError('Failed to load analysis data');
      setLoading(false);
    }
  };

  // Quick action to set After period based on Before period
  const handleQuickSetAfter = (months) => {
    if (!beforeStart || !beforeEnd) {
      setError('Please set Before period dates first');
      return;
    }

    // Dates are already in yyyy-mm-dd format, add months directly
    setAfterStart(addMonths(beforeStart, months));
    setAfterEnd(addMonths(beforeEnd, months));
    setError(null);
  };

  // Quick action to set Before period based on After period (backward)
  const handleQuickSetBefore = (months) => {
    if (!afterStart || !afterEnd) {
      setError('Please set After period dates first');
      return;
    }

    // Dates are already in yyyy-mm-dd format, subtract months
    setBeforeStart(addMonths(afterStart, -months));
    setBeforeEnd(addMonths(afterEnd, -months));
    setError(null);
  };

  // Calculate percentage change
  const calculateChange = (before, after) => {
    const beforeVal = parseFloat(before) || 0;
    const afterVal = parseFloat(after) || 0;
    if (beforeVal === 0) return afterVal > 0 ? 100 : 0;
    return ((afterVal - beforeVal) / beforeVal * 100).toFixed(1);
  };

  // Get color for change (green = positive, red = negative)
  const getChangeColor = (change) => {
    return parseFloat(change) >= 0 ? 'text-green-500' : 'text-red-500';
  };

  // Get arrow for change
  const getChangeArrow = (change) => {
    return parseFloat(change) >= 0 ? '↑' : '↓';
  };

  // Prepare chart data
  const getChartData = () => {
    if (!data) return [];
    return [
      {
        metric: 'Commits/Month',
        Before: parseFloat(data.before?.avg_commits_per_month) || 0,
        After: parseFloat(data.after?.avg_commits_per_month) || 0,
      },
      {
        metric: 'Lines/Commit',
        Before: parseFloat(data.before?.avg_lines_per_commit) || 0,
        After: parseFloat(data.after?.avg_lines_per_commit) || 0,
      },
      {
        metric: 'Contributors',
        Before: parseFloat(data.before?.avg_authors) || 0,
        After: parseFloat(data.after?.avg_authors) || 0,
      },
      {
        metric: 'Commits/Committer',
        Before: parseFloat(data.before?.avg_commits_per_committer) || 0,
        After: parseFloat(data.after?.avg_commits_per_committer) || 0,
      },
    ];
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const beforeVal = payload[0].value;
      const afterVal = payload[1].value;
      const change = calculateChange(beforeVal, afterVal);
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{payload[0].payload.metric}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Before: {beforeVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            After: {afterVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </p>
          <p className={`text-sm font-semibold mt-1 ${getChangeColor(change)}`}>
            Change: {getChangeArrow(change)} {Math.abs(change)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Before/After Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Measure the impact of changes, new tools, or process improvements
          </p>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Configure Analysis
        </h3>

        {/* Repository Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Repository
          </label>
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
          >
            <option value="all">All Repositories</option>
            {repos.map(repo => (
              <option key={repo.name} value={repo.name}>
                {repo.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Pickers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Before Period */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
              <span>📅</span> Before Period
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={beforeStart}
                  onChange={(e) => setBeforeStart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={beforeEnd}
                  onChange={(e) => setBeforeEnd(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Quick set After period:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickSetAfter(3)}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-300 hover:scale-105"
                  >
                    → 3 months
                  </button>
                  <button
                    onClick={() => handleQuickSetAfter(6)}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-300 hover:scale-105"
                  >
                    → 6 months
                  </button>
                  <button
                    onClick={() => handleQuickSetAfter(12)}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-300 hover:scale-105"
                  >
                    → 12 months
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* After Period */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
              <span>📅</span> After Period
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={afterStart}
                  onChange={(e) => setAfterStart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={afterEnd}
                  onChange={(e) => setAfterEnd(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-3 border-t border-purple-200 dark:border-purple-800">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Quick set Before period:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickSetBefore(3)}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all duration-300 hover:scale-105"
                  >
                    ← 3 months
                  </button>
                  <button
                    onClick={() => handleQuickSetBefore(6)}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all duration-300 hover:scale-105"
                  >
                    ← 6 months
                  </button>
                  <button
                    onClick={() => handleQuickSetBefore(12)}
                    className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-all duration-300 hover:scale-105"
                  >
                    ← 12 months
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Analyzing...' : 'Analyze Impact'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner />}

      {/* Results */}
      {!loading && hasAnalyzed && data && (
        <>
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Average Commits per Month */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Before</h4>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {parseFloat(data.before?.avg_commits_per_month || 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">commits/month</p>
              </div>
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <span className={`text-2xl font-bold ${getChangeColor(calculateChange(data.before?.avg_commits_per_month, data.after?.avg_commits_per_month))}`}>
                    {getChangeArrow(calculateChange(data.before?.avg_commits_per_month, data.after?.avg_commits_per_month))}
                    {Math.abs(calculateChange(data.before?.avg_commits_per_month, data.after?.avg_commits_per_month))}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Commits per Month</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">After</h4>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {parseFloat(data.after?.avg_commits_per_month || 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">commits/month</p>
              </div>
            </div>

            {/* Average Lines per Commit */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Before</h4>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {parseFloat(data.before?.avg_lines_per_commit || 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">lines/commit</p>
              </div>
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <span className={`text-2xl font-bold ${getChangeColor(calculateChange(data.before?.avg_lines_per_commit, data.after?.avg_lines_per_commit))}`}>
                    {getChangeArrow(calculateChange(data.before?.avg_lines_per_commit, data.after?.avg_lines_per_commit))}
                    {Math.abs(calculateChange(data.before?.avg_lines_per_commit, data.after?.avg_lines_per_commit))}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Lines per Commit</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">After</h4>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {parseFloat(data.after?.avg_lines_per_commit || 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">lines/commit</p>
              </div>
            </div>

            {/* Average Contributors */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Before</h4>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {parseFloat(data.before?.avg_authors || 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">contributors</p>
              </div>
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <span className={`text-2xl font-bold ${getChangeColor(calculateChange(data.before?.avg_authors, data.after?.avg_authors))}`}>
                    {getChangeArrow(calculateChange(data.before?.avg_authors, data.after?.avg_authors))}
                    {Math.abs(calculateChange(data.before?.avg_authors, data.after?.avg_authors))}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Contributors</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">After</h4>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {parseFloat(data.after?.avg_authors || 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">contributors</p>
              </div>
            </div>

            {/* Commits per Committer */}
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Before</h4>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {parseFloat(data.before?.avg_commits_per_committer || 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">commits/committer</p>
              </div>
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                  <span className={`text-2xl font-bold ${getChangeColor(calculateChange(data.before?.avg_commits_per_committer, data.after?.avg_commits_per_committer))}`}>
                    {getChangeArrow(calculateChange(data.before?.avg_commits_per_committer, data.after?.avg_commits_per_committer))}
                    {Math.abs(calculateChange(data.before?.avg_commits_per_committer, data.after?.avg_commits_per_committer))}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Commits per Committer</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-2">After</h4>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {parseFloat(data.after?.avg_commits_per_committer || 0).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">commits/committer</p>
              </div>
            </div>
          </div>

          {/* Visualization Chart */}
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Visual Comparison
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#6b7280" opacity={0.2} />
                <XAxis
                  dataKey="metric"
                  stroke="#6b7280"
                  style={{ fontSize: '14px' }}
                />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar dataKey="Before" fill="#3b82f6" name="Before Period" radius={[4, 4, 0, 0]} />
                <Bar dataKey="After" fill="#8b5cf6" name="After Period" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights Section */}
          <div className="card p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-2 border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>💡</span> Key Insights
            </h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  Commit frequency {parseFloat(calculateChange(data.before?.avg_commits_per_month, data.after?.avg_commits_per_month)) >= 0 ? 'increased' : 'decreased'} by{' '}
                  <strong className={getChangeColor(calculateChange(data.before?.avg_commits_per_month, data.after?.avg_commits_per_month))}>
                    {Math.abs(calculateChange(data.before?.avg_commits_per_month, data.after?.avg_commits_per_month))}%
                  </strong>
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>
                  Code change size {parseFloat(calculateChange(data.before?.avg_lines_per_commit, data.after?.avg_lines_per_commit)) >= 0 ? 'increased' : 'decreased'} by{' '}
                  <strong className={getChangeColor(calculateChange(data.before?.avg_lines_per_commit, data.after?.avg_lines_per_commit))}>
                    {Math.abs(calculateChange(data.before?.avg_lines_per_commit, data.after?.avg_lines_per_commit))}%
                  </strong>
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                <span>
                  Team size {parseFloat(calculateChange(data.before?.avg_authors, data.after?.avg_authors)) >= 0 ? 'grew' : 'shrank'} by{' '}
                  <strong className={getChangeColor(calculateChange(data.before?.avg_authors, data.after?.avg_authors))}>
                    {Math.abs(calculateChange(data.before?.avg_authors, data.after?.avg_authors))}%
                  </strong>
                </span>
              </p>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && !hasAnalyzed && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Ready to Analyze
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Configure the periods above and click "Analyze Impact" to see results
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeforeAfter;
