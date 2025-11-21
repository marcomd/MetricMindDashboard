import { useEffect, useState } from 'react';
import { Scale } from 'lucide-react';
import { fetchCompareRepos } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import CountUp from 'react-countup';

interface RepoComparisonData {
  repository_name: string;
  total_commits: string;
  effective_commits?: string | number;
  avg_weight?: string | number;
  weight_efficiency_pct?: string | number;
  total_lines_changed: string;
  weighted_lines_changed?: string | number;
  months_active: number;
  avg_authors_per_month: string;
  avg_lines_per_commit: string;
}

interface SortConfig {
  key: keyof RepoComparisonData;
  direction: 'asc' | 'desc';
}

interface TooltipPayload {
  name: string;
  value: number | string;
  color: string;
  payload: RepoComparisonData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

const Comparison = (): JSX.Element => {
  const [data, setData] = useState<RepoComparisonData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'total_commits', direction: 'desc' });
  const [error, setError] = useState<string | null>(null);
  const [useWeightedData, setUseWeightedData] = useState<boolean>(true);

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
  const handleSort = (key: keyof RepoComparisonData): void => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data based on current sort configuration
  const sortedData: RepoComparisonData[] = [...data].sort((a, b) => {
    const aValue = parseFloat(String(a[sortConfig.key])) || 0;
    const bValue = parseFloat(String(b[sortConfig.key])) || 0;

    if (sortConfig.direction === 'asc') {
      return aValue - bValue;
    }
    return bValue - aValue;
  });

  // Calculate percentage relative to max value
  const getPercentage = (value: string | number, key: keyof RepoComparisonData): string => {
    if (data.length === 0) return '0';
    const max = Math.max(...data.map(item => parseFloat(String(item[key])) || 0));
    return max > 0 ? ((parseFloat(String(value)) / max) * 100).toFixed(1) : '0';
  };

  // Get top repository for a specific metric
  const getTopRepo = (key: keyof RepoComparisonData): RepoComparisonData | null => {
    if (data.length === 0) return null;
    return data.reduce((max, repo) =>
      (parseFloat(String(repo[key])) || 0) > (parseFloat(String(max[key])) || 0) ? repo : max
    );
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: CustomTooltipProps): JSX.Element | null => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{payload[0].payload.repository_name}</p>
          {payload.map((entry) => (
            <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
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
  // Use weighted or total lines based on toggle
  const topLinesRepo = useWeightedData && data.length > 0 && data[0].weighted_lines_changed !== undefined
    ? data.reduce((max, repo) =>
        (parseFloat(String(repo.weighted_lines_changed)) || 0) > (parseFloat(String(max.weighted_lines_changed)) || 0) ? repo : max
      )
    : getTopRepo('total_lines_changed');
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
        <div>
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
          suffix={topLinesRepo ? `${Math.round(parseFloat(String(
            useWeightedData
              ? (topLinesRepo.weighted_lines_changed || topLinesRepo.total_lines_changed)
              : topLinesRepo.total_lines_changed
          ))).toLocaleString()} lines` : ''}
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
          Lines Changed Comparison{!useWeightedData && ' (unweighted)'}
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
            <Bar
              dataKey={useWeightedData ? "weighted_lines_changed" : "total_lines_changed"}
              fill="#f59e0b"
              name={useWeightedData ? "Lines Changed (Weighted)" : "Lines Changed"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Repository Weight Efficiency */}
      {(() => {
        const repoEfficiencyData = sortedData
          .map(repo => ({
            repository: repo.repository_name,
            efficiency: parseFloat(String(repo.weight_efficiency_pct || 100)),
            total_commits: parseInt(repo.total_commits),
            effective_commits: repo.effective_commits
              ? parseFloat(String(repo.effective_commits))
              : parseInt(repo.total_commits)
          }))
          .filter(r => r.efficiency < 100)
          .sort((a, b) => a.efficiency - b.efficiency);

        return repoEfficiencyData.length > 0 && (
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Repository Weight Efficiency
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={repoEfficiencyData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="efficiency"
                  type="number"
                  domain={[0, 100]}
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                  label={{ value: 'Weight Efficiency (%)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis
                  dataKey="repository"
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
                  content={({ payload }) => {
                    if (!payload || !payload[0]) return null;
                    const data = payload[0].payload as any;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">
                          {data.repository}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <div>Efficiency: {data.efficiency.toFixed(1)}%</div>
                          <div>Total: {data.total_commits.toLocaleString()} commits</div>
                          <div>Effective: {data.effective_commits.toFixed(1)}</div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="efficiency" animationDuration={1000}>
                  {repoEfficiencyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.efficiency >= 75 ? '#eab308' :
                        entry.efficiency >= 50 ? '#f97316' :
                        '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}

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
