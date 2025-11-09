import { useEffect, useState } from 'react';
import { fetchRepos, fetchCategories, fetchCategoryTrends, fetchCategoryByRepo } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { formatDate, toISOFormat, fromISOFormat } from '../utils/dateFormat';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label
} from 'recharts';

const ContentAnalysis = () => {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [repoMatrixData, setRepoMatrixData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [monthsToShow, setMonthsToShow] = useState(12);
  const [showMetric, setShowMetric] = useState('commits'); // 'commits' or 'loc'
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Category colors - consistent across all charts
  const categoryColors = {
    'BILLING': '#3b82f6',
    'CS': '#8b5cf6',
    'INFRA': '#10b981',
    'AUTH': '#f59e0b',
    'API': '#ef4444',
    'UI': '#ec4899',
    'DOCS': '#06b6d4',
    'SECURITY': '#f43f5e',
    'PERFORMANCE': '#14b8a6',
    'UNCATEGORIZED': '#6b7280'
  };

  // Get color for a category (with fallback)
  const getCategoryColor = (category, index) => {
    return categoryColors[category] || `hsl(${index * 40}, 70%, 50%)`;
  };

  // Set default date range (last 3 months)
  useEffect(() => {
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());

    setDateFrom(formatLocalDate(threeMonthsAgo));
    setDateTo(formatLocalDate(today));
  }, []);

  // Load repositories on mount
  useEffect(() => {
    fetchRepos()
      .then(res => {
        setRepos(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching repositories:', err);
        setLoading(false);
      });
  }, []);

  // Fetch category data when filters change
  useEffect(() => {
    if (!dateFrom || !dateTo) return;

    setDataLoading(true);
    Promise.all([
      fetchCategories(selectedRepo, dateFrom, dateTo),
      fetchCategoryTrends(monthsToShow, selectedRepo),
      fetchCategoryByRepo(dateFrom, dateTo)
    ])
      .then(([categoriesRes, trendsRes, repoMatrixRes]) => {
        // Filter out UNCATEGORIZED and limit to top 15 categories
        const filteredCategories = categoriesRes.data
          .filter(c => c.category !== 'UNCATEGORIZED')
          .slice(0, 15);

        // Get the top 15 category names for filtering other datasets
        const top15CategoryNames = filteredCategories.map(c => c.category);

        // Filter trends data to only include top 15 categories
        const filteredTrends = trendsRes.data.filter(t =>
          top15CategoryNames.includes(t.category)
        );

        // Filter repo matrix data to only include top 15 categories
        const filteredRepoMatrix = repoMatrixRes.data.filter(r =>
          top15CategoryNames.includes(r.category)
        );

        setCategoryData(filteredCategories);
        setTrendData(filteredTrends);
        setRepoMatrixData(filteredRepoMatrix);
        setDataLoading(false);
      })
      .catch(err => {
        console.error('Error fetching category data:', err);
        setDataLoading(false);
      });
  }, [selectedRepo, dateFrom, dateTo, monthsToShow]);

  // Quick action buttons to set date ranges
  const handleQuickDateRange = (months) => {
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - months, today.getDate());

    setDateFrom(formatLocalDate(startDate));
    setDateTo(formatLocalDate(today));
  };

  // Calculate stats for StatCards (categoryData is already filtered)
  const totalCategories = categoryData.length;
  const totalCommits = categoryData.reduce((sum, c) => sum + parseInt(c.total_commits || 0), 0);
  const topCategory = categoryData.length > 0 ? categoryData[0] : null;
  const mostActiveRepo = repoMatrixData.length > 0
    ? repoMatrixData.reduce((acc, curr) => {
        const repoTotal = acc[curr.repository] || 0;
        acc[curr.repository] = repoTotal + parseInt(curr.total_commits || 0);
        return acc;
      }, {})
    : {};
  const topRepo = Object.keys(mostActiveRepo).length > 0
    ? Object.keys(mostActiveRepo).reduce((a, b) => mostActiveRepo[a] > mostActiveRepo[b] ? a : b)
    : 'N/A';

  // Prepare donut chart data
  const donutData = categoryData.map(item => ({
    name: item.category,
    value: parseInt(item.total_commits || 0),
    loc: parseInt(item.total_lines_changed || 0)
  }));

  // Prepare comparison bar chart data
  const comparisonData = categoryData.map(item => ({
    category: item.category,
    commits: parseInt(item.total_commits || 0),
    loc: parseInt(item.total_lines_changed || 0),
    authors: parseInt(item.unique_authors || 0)
  }));

  // Prepare stacked area chart data
  const prepareTrendData = () => {
    if (!trendData || trendData.length === 0) return [];

    // Group by month
    const monthlyData = {};
    trendData.forEach(item => {
      const month = item.year_month;
      if (!monthlyData[month]) {
        monthlyData[month] = { month, month_date: item.month_start_date };
      }
      monthlyData[month][item.category] = parseInt(showMetric === 'commits'
        ? item.total_commits
        : item.total_lines_changed || 0);
    });

    // Convert to array and sort by date (newest first, but we'll reverse for display)
    const result = Object.values(monthlyData).sort((a, b) =>
      new Date(a.month_date) - new Date(b.month_date)
    );

    return result;
  };

  const trendChartData = prepareTrendData();

  // Get all unique categories for stacked area chart
  const allCategories = [...new Set(trendData.map(item => item.category))].sort();

  // Prepare grouped bar chart data for category by repository
  const prepareRepoMatrixData = () => {
    if (!repoMatrixData || repoMatrixData.length === 0) return [];

    // Group by repository
    const repoGroups = {};
    repoMatrixData.forEach(item => {
      const repo = item.repository;
      if (!repoGroups[repo]) {
        repoGroups[repo] = { repository: repo };
      }
      const value = showMetric === 'commits'
        ? parseInt(item.total_commits || 0)
        : parseInt(item.total_lines_changed || 0);
      repoGroups[repo][item.category] = value;
    });

    return Object.values(repoGroups);
  };

  const repoMatrixChartData = prepareRepoMatrixData();

  // Get all unique categories for repo matrix
  const matrixCategories = [...new Set(repoMatrixData.map(item => item.category))].sort();

  // Custom tooltip for donut chart
  const DonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalCommits) * 100).toFixed(1);
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Commits: {data.value.toLocaleString()} ({percentage}%)
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Lines Changed: {data.loc.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for other charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Handle pie chart click
  const handlePieClick = (data) => {
    setSelectedCategory(selectedCategory === data.name ? null : data.name);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Content Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Top 15 business domains by commit volume (excluding uncategorized)
          </p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
          {/* Repository Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Repository
            </label>
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Repositories</option>
              {repos.map(repo => (
                <option key={repo.id} value={repo.name}>{repo.name}</option>
              ))}
            </select>
          </div>

          {/* Date Range Pickers */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickDateRange(1)}
              className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm whitespace-nowrap"
            >
              Last Month
            </button>
            <button
              onClick={() => handleQuickDateRange(3)}
              className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm whitespace-nowrap"
            >
              Last Quarter
            </button>
            <button
              onClick={() => handleQuickDateRange(6)}
              className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm whitespace-nowrap"
            >
              6 Months
            </button>
            <button
              onClick={() => handleQuickDateRange(12)}
              className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm whitespace-nowrap"
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {/* StatCards */}
      {!dataLoading && categoryData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Top Categories"
            value={totalCategories}
            icon="📊"
            color="blue"
            subtitle="(out of top 15)"
          />
          <StatCard
            title="Top Category"
            value={topCategory?.category || 'N/A'}
            icon="🏆"
            color="purple"
            subtitle={topCategory ? `${parseInt(topCategory.total_commits).toLocaleString()} commits` : ''}
          />
          <StatCard
            title="Total Commits"
            value={totalCommits}
            icon="💬"
            color="green"
          />
          <StatCard
            title="Most Active Repo"
            value={topRepo}
            icon="🔥"
            color="orange"
            subtitle={topRepo !== 'N/A' ? `${mostActiveRepo[topRepo].toLocaleString()} commits` : ''}
          />
        </div>
      )}

      {/* Loading State */}
      {dataLoading && (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      )}

      {/* Empty State */}
      {!dataLoading && categoryData.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            No category data available for the selected filters
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Try adjusting your date range or repository selection
          </p>
        </div>
      )}

      {/* Charts */}
      {!dataLoading && categoryData.length > 0 && (
        <>
          {/* Category Breakdown - Donut Chart */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Category Breakdown
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Distribution of commits across business domains
                  {selectedCategory && ` • Filtered: ${selectedCategory}`}
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={handlePieClick}
                  style={{ cursor: 'pointer' }}
                >
                  {donutData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCategoryColor(entry.name, index)}
                      opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                    />
                  ))}
                  <Label
                    value={`${totalCommits.toLocaleString()}`}
                    position="center"
                    className="text-2xl font-bold"
                    fill="currentColor"
                  />
                </Pie>
                <Tooltip content={<DonutTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-gray-900 dark:text-white">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Comparison - Horizontal Bar Chart */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Category Comparison
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compare effort across all categories
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMetric('commits')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    showMetric === 'commits'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Commits
                </button>
                <button
                  onClick={() => setShowMetric('loc')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    showMetric === 'loc'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Lines Changed
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  type="number"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  width={120}
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={showMetric === 'commits' ? 'commits' : 'loc'}
                  radius={[0, 8, 8, 0]}
                  animationDuration={1000}
                >
                  {comparisonData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCategoryColor(entry.category, index)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Trends Over Time - Stacked Area Chart */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Category Trends Over Time
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Evolution of category distribution month-to-month
                </p>
              </div>
              <select
                value={monthsToShow}
                onChange={(e) => setMonthsToShow(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
                <option value={24}>Last 24 Months</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={trendChartData}>
                <defs>
                  {allCategories.map((category, index) => (
                    <linearGradient key={category} id={`color${category}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getCategoryColor(category, index)} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={getCategoryColor(category, index)} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-gray-900 dark:text-white">{value}</span>
                  )}
                />
                {allCategories.map((category, index) => (
                  <Area
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stackId="1"
                    stroke={getCategoryColor(category, index)}
                    strokeWidth={2}
                    fill={`url(#color${category})`}
                    animationDuration={1000}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category by Repository - Grouped Bar Chart */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Category by Repository
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Domain ownership patterns across repositories
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={repoMatrixChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="repository"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-gray-900 dark:text-white">{value}</span>
                  )}
                />
                {matrixCategories.map((category, index) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    fill={getCategoryColor(category, index)}
                    animationDuration={1000}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default ContentAnalysis;
