import { useEffect, useState } from 'react';
import { X, BarChart3, AlertTriangle, Inbox } from 'lucide-react';
import { fetchMonthlyCommits } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import LoadingSpinner from './LoadingSpinner';
import CommitDescription from './CommitDescription';

interface Commit {
  commit_hash: string;
  commit_date: string;
  commit_message: string;
  description: string | null;
  author_name: string;
  repository_name: string;
  lines_changed: number;
  lines_added: number;
  lines_deleted: number;
  weight?: number;
}

interface MonthlyCommitDetailsProps {
  selectedMonth: string | null;
  repository: string;
  onClose?: () => void;
}

const MonthlyCommitDetails: React.FC<MonthlyCommitDetailsProps> = ({
  selectedMonth,
  repository,
  onClose,
}) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMonth) {
      setCommits([]);
      setError(null);
      return;
    }

    const loadCommits = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchMonthlyCommits(selectedMonth, 10, repository);
        setCommits(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load commits');
      } finally {
        setLoading(false);
      }
    };

    loadCommits();
  }, [selectedMonth, repository]);

  // Empty state - no month selected
  if (!selectedMonth) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold mb-2 dark:text-white">
          Select a Month
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Click on a month in the chart above to view top commits
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <AlertTriangle className="w-16 h-16 text-red-500 dark:text-red-400 mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">
          Failed to load commits
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Please try again later
        </p>
      </div>
    );
  }

  // No results state
  if (commits.length === 0) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <Inbox className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold mb-2 dark:text-white">
          No commits found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No commits were found for {selectedMonth}
        </p>
      </div>
    );
  }

  // Data display
  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold dark:text-white">
            Top Commits - {selectedMonth}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Showing top {commits.length} commits by lines changed
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Lines
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Message
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
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {commits.map((commit, index) => (
              <tr
                key={`${commit.commit_hash}-${index}`}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {formatDate(commit.commit_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {commit.lines_changed.toLocaleString()}
                  </div>
                  <div className="text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      +{commit.lines_added.toLocaleString()}
                    </span>
                    {' '}
                    <span className="text-red-600 dark:text-red-400">
                      -{commit.lines_deleted.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-md">
                  <div className="line-clamp-2 inline">{commit.commit_message}</div>
                  <CommitDescription description={commit.description} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-400">
                  {commit.commit_hash.substring(0, 7)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {commit.author_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {commit.repository_name}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyCommitDetails;
