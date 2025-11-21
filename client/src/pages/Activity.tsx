import { useEffect, useState, useMemo } from 'react';
import { Scale } from 'lucide-react';
import { fetchRepos, fetchDailyActivity } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Repository {
  id: number;
  name: string;
}

interface ActivityItem {
  commit_date: string;
  repository_name: string;
  total_commits: string | number;
  effective_commits?: string | number;
  avg_weight?: string | number;
  weight_efficiency_pct?: string | number;
  total_lines_changed: string | number;
  weighted_lines_changed?: string | number;
  unique_authors: string | number;
}

interface HeatmapDataPoint {
  date: string;
  count: number;
  lines_changed: number;
  authors: number;
}

interface DayOfWeekData {
  name: string;
  commits: number;
}

function Activity(): JSX.Element {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [activityData, setActivityData] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [daysToShow, setDaysToShow] = useState<number>(365);
  const [useWeightedData, setUseWeightedData] = useState<boolean>(true);

  // Fetch repos on mount
  useEffect(() => {
    fetchRepos().then(res => {
      setRepos(res.data);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching repos:', err);
      setLoading(false);
    });
  }, []);

  // Fetch activity data when filters change
  useEffect(() => {
    if (!loading) {
      setDataLoading(true);
      fetchDailyActivity(daysToShow).then(res => {
        let data = res.data;

        // Filter by repository if not 'all'
        if (selectedRepo !== 'all') {
          data = data.filter((d: ActivityItem) => d.repository_name === selectedRepo);
        }

        setActivityData(data);
        setDataLoading(false);
      }).catch(err => {
        console.error('Error fetching activity:', err);
        setDataLoading(false);
      });
    }
  }, [selectedRepo, daysToShow, loading]);

  // Aggregate data by date for calendar heatmap (must be before early return)
  const heatmapData: HeatmapDataPoint[] = useMemo(() => {
    if (!activityData || activityData.length === 0) {
      return [];
    }

    const dateMap: Record<string, {
      date: string;
      count: number;
      lines_changed: number;
      authors: Set<string | number>;
    }> = {};

    activityData.forEach(item => {
      // Convert UTC timestamp to local date (YYYY-MM-DD)
      const dateObj = new Date(item.commit_date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const date = `${year}-${month}-${day}`;

      if (!dateMap[date]) {
        dateMap[date] = {
          date: date,
          count: 0,
          lines_changed: 0,
          authors: new Set()
        };
      }
      // Use weighted or total commits based on toggle
      const commits = useWeightedData
        ? Math.round((parseInt(String(item.effective_commits || item.total_commits || 0), 10)) / 100)
        : parseInt(String(item.total_commits || 0), 10);
      dateMap[date].count += commits;
      // Use weighted or total lines based on toggle
      const linesChanged = useWeightedData
        ? parseInt(String(item.weighted_lines_changed || item.total_lines_changed || 0), 10)
        : parseInt(String(item.total_lines_changed || 0), 10);
      dateMap[date].lines_changed += linesChanged;
      dateMap[date].authors.add(item.unique_authors);
    });

    return Object.values(dateMap).map(d => ({
      date: d.date,
      count: d.count,
      lines_changed: d.lines_changed,
      authors: d.authors.size
    }));
  }, [activityData, useWeightedData]);

  // Calculate stats
  const totalCommits = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const activeDays = heatmapData.filter(d => d.count > 0).length;
  const avgCommitsPerDay = activeDays > 0 ? (totalCommits / activeDays).toFixed(1) : '0';

  // Find busiest day
  const busiestDay = heatmapData.length > 0
    ? heatmapData.reduce((max, d) => d.count > max.count ? d : max, heatmapData[0])
    : null;

  // Calculate day of week distribution
  const dayDistribution: DayOfWeekData[] = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap: DayOfWeekData[] = days.map(name => ({ name, commits: 0 }));

    heatmapData.forEach(item => {
      // Parse date string (YYYY-MM-DD) as local date to avoid timezone shifts
      const [year, month, day] = item.date.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      const dayIndex = date.getDay();
      if (dayIndex >= 0 && dayIndex < 7) {
        dayMap[dayIndex].commits += item.count;
      }
    });

    return dayMap;
  }, [heatmapData]);

  // Show loading spinner while initial data loads
  if (loading) {
    return <LoadingSpinner />;
  }

  // Prepare data for calendar heatmap (last N days)
  const getDateRange = (): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysToShow);
    return { start, end };
  };

  const { start, end } = getDateRange();

  // Colors for day of week chart
  const dayColors: string[] = [
    '#ef4444', // Sunday - red
    '#3b82f6', // Monday - blue
    '#8b5cf6', // Tuesday - purple
    '#10b981', // Wednesday - green
    '#f59e0b', // Thursday - orange
    '#06b6d4', // Friday - cyan
    '#ec4899', // Saturday - pink
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Activity Patterns
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track day-to-day commit patterns
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

          {/* Date Range Selector */}
          <select
            value={daysToShow}
            onChange={(e) => setDaysToShow(Number(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white transition-all duration-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value={365}>Last Year</option>
            <option value={180}>Last 6 Months</option>
            <option value={90}>Last 3 Months</option>
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

      {dataLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card stagger-item">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600 dark:text-gray-400">Total Commits</h4>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalCommits.toLocaleString()}
              </p>
            </div>

            <div className="card stagger-item">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600 dark:text-gray-400">Active Days</h4>
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {activeDays}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                out of {daysToShow} days
              </p>
            </div>

            <div className="card stagger-item">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600 dark:text-gray-400">Avg Commits/Day</h4>
                <span className="text-2xl">⚡</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {avgCommitsPerDay}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                on active days
              </p>
            </div>

            <div className="card stagger-item">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm text-gray-600 dark:text-gray-400">Busiest Day</h4>
                <span className="text-2xl">🔥</span>
              </div>
              {busiestDay ? (
                <>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {busiestDay.count}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(busiestDay.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </>
              ) : (
                <p className="text-xl text-gray-500 dark:text-gray-400">No data</p>
              )}
            </div>
          </div>

          {/* Calendar Heatmap */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Commit Activity Calendar
            </h3>
            <div className="overflow-x-auto">
              <CalendarHeatmap
                startDate={start}
                endDate={end}
                values={heatmapData}
                classForValue={(value: any) => {
                  if (!value || value.count === 0) {
                    return 'color-empty';
                  }
                  if (value.count < 3) return 'color-scale-1';
                  if (value.count < 6) return 'color-scale-2';
                  if (value.count < 10) return 'color-scale-3';
                  return 'color-scale-4';
                }}
                tooltipDataAttrs={(value: any) => {
                  if (!value || !value.date) {
                    return {
                      'data-tip': 'No commits'
                    } as any;
                  }
                  const date = new Date(value.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });
                  return {
                    'data-tip': `${date}: ${value.count} commit${value.count !== 1 ? 's' : ''}, ${value.lines_changed.toLocaleString()} lines changed`
                  } as any;
                }}
                showWeekdayLabels={true}
              />
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm color-empty border border-gray-300 dark:border-gray-600"></div>
                <div className="w-3 h-3 rounded-sm color-scale-1"></div>
                <div className="w-3 h-3 rounded-sm color-scale-2"></div>
                <div className="w-3 h-3 rounded-sm color-scale-3"></div>
                <div className="w-3 h-3 rounded-sm color-scale-4"></div>
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Day of Week Distribution */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Activity by Day of Week
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
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
                <Bar dataKey="commits" animationDuration={1000} radius={[8, 8, 0, 0]}>
                  {dayDistribution.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={dayColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity Timeline */}
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Activity Timeline
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {heatmapData
                .filter(d => d.count > 0)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 30)
                .map((activity, index) => {
                  const date = new Date(activity.date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();

                  let dateLabel = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  if (isToday) dateLabel = `Today, ${dateLabel}`;
                  if (isYesterday) dateLabel = `Yesterday, ${dateLabel}`;

                  return (
                    <div
                      key={activity.date}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-300 stagger-item"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                            {activity.count}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {activity.count} commit{activity.count !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {dateLabel}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.lines_changed.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          lines changed
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Activity;
