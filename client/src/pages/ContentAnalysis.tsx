import { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import { fetchRepos, fetchCategories, fetchCategoryTrends, fetchCategoryByRepo } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import WeightBadge from '../components/WeightBadge';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label
} from 'recharts';

interface Repository {
  id: number;
  name: string;
}

interface CategoryData {
  category: string;
  category_weight?: number;
  total_commits: string;
  effective_commits?: string | number;
  avg_weight?: string | number;
  weight_efficiency_pct?: string | number;
  total_lines_changed: string;
  unique_authors: string;
}

interface TrendData {
  year_month: string;
  month_start_date: string;
  category: string;
  total_commits: string;
  effective_commits?: string | number;
  avg_weight?: string | number;
  weight_efficiency_pct?: string | number;
  total_lines_changed: string;
}

interface RepoMatrixData {
  repository: string;
  category: string;
  category_weight?: number;
  total_commits: string;
  effective_commits?: string | number;
  avg_weight?: string | number;
  weight_efficiency_pct?: string | number;
  total_lines_changed: string;
}

interface DonutDataPoint {
  name: string;
  value: number;
  loc: number;
}

interface ComparisonDataPoint {
  category: string;
  commits: number;
  loc: number;
  authors: number;
}

interface TrendChartDataPoint {
  month: string;
  month_date: string;
  [key: string]: string | number;
}

interface RepoMatrixChartDataPoint {
  repository: string;
  [key: string]: string | number;
}

interface TooltipPayload {
  name?: string;
  value: number;
  color?: string;
  payload: any;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

interface DonutTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const ContentAnalysis = (): JSX.Element => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [fullCategoryData, setFullCategoryData] = useState<CategoryData[]>([]); // For de-prioritized categories
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [repoMatrixData, setRepoMatrixData] = useState<RepoMatrixData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [monthsToShow, setMonthsToShow] = useState<number>(12);
  const [showMetric, setShowMetric] = useState<'commits' | 'loc'>('commits');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [useWeightedData, setUseWeightedData] = useState<boolean>(true);

  // Category colors - consistent across all charts
  const categoryColors: Record<string, string> = {
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
  const getCategoryColor = (category: string, index: number): string => {
    return categoryColors[category] || `hsl(${index * 40}, 70%, 50%)`;
  };

  // Set default date range (previous month)
  useEffect(() => {
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const today = new Date();

    // First day of previous month
    const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    // Last day of previous month (day 0 of current month = last day of previous month)
    const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    setDateFrom(formatLocalDate(firstDayPrevMonth));
    setDateTo(formatLocalDate(lastDayPrevMonth));
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
        // Filter out UNCATEGORIZED
        const allCategories = categoriesRes.data
          .filter((c: CategoryData) => c.category !== 'UNCATEGORIZED');

        // Limit to top 15 categories for charts
        const filteredCategories = allCategories.slice(0, 15);

        // Get the top 15 category names for filtering other datasets
        const top15CategoryNames = filteredCategories.map((c: CategoryData) => c.category);

        // Filter trends data to only include top 15 categories
        const filteredTrends = trendsRes.data.filter((t: TrendData) =>
          top15CategoryNames.includes(t.category)
        );

        // Filter repo matrix data to only include top 15 categories
        const filteredRepoMatrix = repoMatrixRes.data.filter((r: RepoMatrixData) =>
          top15CategoryNames.includes(r.category)
        );

        setCategoryData(filteredCategories);
        setFullCategoryData(allCategories); // Store full data for de-prioritized section
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
  const handleQuickDateRange = (months: number): void => {
    const formatLocalDate = (date: Date): string => {
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
  const totalCommits = categoryData.reduce((sum, c) => {
    if (useWeightedData && c.effective_commits) {
      return sum + parseFloat(String(c.effective_commits));
    }
    return sum + parseInt(c.total_commits || '0');
  }, 0);
  const topCategory = categoryData.length > 0 ? categoryData[0] : null;
  const mostActiveRepo = repoMatrixData.length > 0
    ? repoMatrixData.reduce((acc: Record<string, number>, curr) => {
        const repoTotal = acc[curr.repository] || 0;
        const commits = useWeightedData && curr.effective_commits
          ? parseFloat(String(curr.effective_commits))
          : parseInt(curr.total_commits || '0');
        acc[curr.repository] = repoTotal + commits;
        return acc;
      }, {})
    : {};
  const topRepo = Object.keys(mostActiveRepo).length > 0
    ? Object.keys(mostActiveRepo).reduce((a, b) => mostActiveRepo[a] > mostActiveRepo[b] ? a : b)
    : 'N/A';

  // Prepare donut chart data
  const donutData: DonutDataPoint[] = categoryData.map(item => ({
    name: item.category,
    value: useWeightedData && item.effective_commits
      ? parseFloat(String(item.effective_commits))
      : parseInt(item.total_commits || '0'),
    loc: parseInt(item.total_lines_changed || '0')
  }));

  // Prepare comparison bar chart data
  const comparisonData: ComparisonDataPoint[] = categoryData.map(item => ({
    category: item.category,
    commits: useWeightedData && item.effective_commits
      ? parseFloat(String(item.effective_commits))
      : parseInt(item.total_commits || '0'),
    loc: parseInt(item.total_lines_changed || '0'),
    authors: parseInt(item.unique_authors || '0')
  }));

  // Prepare stacked area chart data
  const prepareTrendData = (): TrendChartDataPoint[] => {
    if (!trendData || trendData.length === 0) return [];

    // Group by month
    const monthlyData: Record<string, TrendChartDataPoint> = {};
    trendData.forEach(item => {
      const month = item.year_month;
      if (!monthlyData[month]) {
        monthlyData[month] = { month, month_date: item.month_start_date };
      }

      if (showMetric === 'commits') {
        monthlyData[month][item.category] = useWeightedData && item.effective_commits
          ? parseFloat(String(item.effective_commits))
          : parseInt(item.total_commits || '0');
      } else {
        monthlyData[month][item.category] = parseInt(item.total_lines_changed || '0');
      }
    });

    // Convert to array and sort by date (newest first, but we'll reverse for display)
    const result = Object.values(monthlyData).sort((a, b) =>
      new Date(a.month_date).getTime() - new Date(b.month_date).getTime()
    );

    return result;
  };

  const trendChartData: TrendChartDataPoint[] = prepareTrendData();

  // Get all unique categories for stacked area chart
  const allCategories: string[] = [...new Set(trendData.map(item => item.category))].sort();

  // Prepare grouped bar chart data for category by repository
  const prepareRepoMatrixData = (): RepoMatrixChartDataPoint[] => {
    if (!repoMatrixData || repoMatrixData.length === 0) return [];

    // Group by repository
    const repoGroups: Record<string, RepoMatrixChartDataPoint> = {};
    repoMatrixData.forEach(item => {
      const repo = item.repository;
      if (!repoGroups[repo]) {
        repoGroups[repo] = { repository: repo };
      }

      let value: number;
      if (showMetric === 'commits') {
        value = useWeightedData && item.effective_commits
          ? parseFloat(String(item.effective_commits))
          : parseInt(item.total_commits || '0');
      } else {
        value = parseInt(item.total_lines_changed || '0');
      }
      repoGroups[repo][item.category] = value;
    });

    return Object.values(repoGroups);
  };

  const repoMatrixChartData: RepoMatrixChartDataPoint[] = prepareRepoMatrixData();

  // Get all unique categories for repo matrix
  const matrixCategories: string[] = [...new Set(repoMatrixData.map(item => item.category))].sort();

  // Custom tooltip for donut chart
  const DonutTooltip = ({ active, payload }: DonutTooltipProps): JSX.Element | null => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DonutDataPoint;
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
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps): JSX.Element | null => {
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
  const handlePieClick = (data: DonutDataPoint): void => {
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

      {/* StatCards */}
      {!dataLoading && categoryData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Top Categories"
            value={totalCategories}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="Top Category"
            value={topCategory?.category || 'N/A'}
            icon="🏆"
            color="purple"
            suffix={topCategory ? ` - ${
              useWeightedData && topCategory.effective_commits
                ? parseFloat(String(topCategory.effective_commits)).toFixed(1)
                : parseInt(topCategory.total_commits).toLocaleString()
            } commits` : ''}
          />
          <StatCard
            title={useWeightedData ? 'Effective Commits' : 'Total Commits'}
            value={Math.round(totalCommits).toLocaleString()}
            icon="💬"
            color="green"
          />
          <StatCard
            title="Most Active Repo"
            value={topRepo}
            icon="🔥"
            color="orange"
            suffix={topRepo !== 'N/A' ? ` - ${Math.round(mostActiveRepo[topRepo]).toLocaleString()} commits` : ''}
          />
        </div>
      )}

      {/* Weight Impact Section */}
      {!dataLoading && categoryData.length > 0 && (() => {
        // Calculate weight impact metrics using FULL category data (not limited to top 15)
        const fullTotalCommits = fullCategoryData.reduce((sum, c) => {
          if (useWeightedData && c.effective_commits) {
            return sum + parseFloat(String(c.effective_commits));
          }
          return sum + parseInt(c.total_commits || '0');
        }, 0);
        const fullTotalEffectiveCommits = fullCategoryData.reduce((sum, c) =>
          sum + parseFloat(String(c.effective_commits || c.total_commits)), 0
        );
        const fullRawCommits = fullCategoryData.reduce((sum, c) => sum + parseInt(c.total_commits || '0'), 0);
        const overallEfficiency = fullRawCommits > 0
          ? (fullTotalEffectiveCommits / fullRawCommits) * 100
          : 100;
        const deprioritizedCategories = fullCategoryData.filter(c =>
          c.category_weight !== undefined && c.category_weight < 100
        ).sort((a, b) => parseInt(b.total_commits || '0') - parseInt(a.total_commits || '0'));

        return (overallEfficiency < 100 || deprioritizedCategories.length > 0) && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Weight Impact Analysis
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Understanding commit prioritization and category weighting effects
              </p>
            </div>

            {/* Weight Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard
                title="Overall Weight Efficiency"
                value={overallEfficiency.toFixed(1)}
                icon="⚖️"
                color="indigo"
                suffix="%"
              />
              <StatCard
                title="De-prioritized Categories"
                value={deprioritizedCategories.length}
                icon="⚠️"
                color="orange"
              />
            </div>

            {/* De-prioritized Categories Table */}
            {deprioritizedCategories.length > 0 && (
              <div className="card">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  De-prioritized Categories
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Weight
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Commits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Effective Commits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Discounted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Efficiency
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {deprioritizedCategories.map((cat) => {
                        const commits = parseInt(String(cat.total_commits));
                        const effective = parseFloat(String(cat.effective_commits || commits));
                        const discounted = commits - effective;
                        const efficiency = parseFloat(String(cat.weight_efficiency_pct || 100));

                        return (
                          <tr key={cat.category} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: getCategoryColor(cat.category, 0) }}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {cat.category}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`font-medium ${
                                (cat.category_weight || 100) >= 75 ? 'text-yellow-600 dark:text-yellow-400' :
                                (cat.category_weight || 100) >= 50 ? 'text-orange-600 dark:text-orange-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {cat.category_weight}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {commits.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {effective.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {discounted.toFixed(1)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <WeightBadge
                                efficiency={efficiency}
                                totalCommits={commits}
                                effectiveCommits={effective}
                                size="sm"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        );
      })()}

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
                  Category Breakdown{!useWeightedData && ' (unweighted)'}
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
                  data={donutData as any}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(data: any) => handlePieClick(data as DonutDataPoint)}
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
                  Category Comparison{!useWeightedData && ' (unweighted)'}
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
                  Category Trends Over Time{!useWeightedData && ' (unweighted)'}
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
                  Category by Repository{!useWeightedData && ' (unweighted)'}
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
