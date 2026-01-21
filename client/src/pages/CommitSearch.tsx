import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit2, X, Save, Loader2 } from 'lucide-react';
import { searchCommits, updateCommit, fetchRepos } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import WeightBadge from '../components/WeightBadge';
import CommitDescription from '../components/CommitDescription';


interface Commit {
  id: number;
  hash: string;
  subject: string;
  description: string | null;
  author_name: string;
  author_email: string;
  commit_date: string;
  category: string;
  weight: number;
  ai_tools: string;
  lines_added: number;
  lines_deleted: number;
  repository_name: string;
}

interface Repo {
  id: number;
  name: string;
}

const CommitSearch = () => {
  const { user } = useAuth();
  const [commits, setCommits] = useState<Commit[]>([]);

  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    repo: '',
    author: '',
    dateFrom: '',
    dateTo: '',
    hash: '',
    search: ''
  });

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommit, setEditingCommit] = useState<Commit | null>(null);
  const [editForm, setEditForm] = useState({
    subject: '',
    category: '',
    weight: 100,
    ai_tools: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    try {
      const response = await fetchRepos();
      setRepos(response.data);
    } catch (error) {
      console.error('Error loading repos:', error);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const response = await searchCommits(searchParams);
      setCommits(response.data);
    } catch (error) {
      console.error('Error searching commits:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (commit: Commit) => {
    setEditingCommit(commit);
    setEditForm({
      subject: commit.subject,
      category: commit.category || '',
      weight: commit.weight,
      ai_tools: commit.ai_tools || ''
    });
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingCommit) return;
    setSaving(true);
    try {
      const response = await updateCommit(editingCommit.hash, editForm);

      // Update local state
      setCommits(commits.map(c =>
        c.hash === editingCommit.hash ? { ...c, ...response.data } : c
      ));

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating commit:', error);
      alert('Failed to update commit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Commit Search</h1>
        <p className="text-gray-600 dark:text-gray-400">Search and manage commit details</p>
      </div>

      {/* Search Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="repo-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repository</label>
            <select
              id="repo-select"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
              value={searchParams.repo}
              onChange={(e) => setSearchParams({ ...searchParams, repo: e.target.value })}
            >
              <option value="">All Repositories</option>
              {repos.map(repo => (
                <option key={repo.id} value={repo.name}>{repo.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="author-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author</label>
            <input
              id="author-input"
              type="text"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
              placeholder="Author name"
              value={searchParams.author}
              onChange={(e) => setSearchParams({ ...searchParams, author: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              id="date-from"
              type="date"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
              value={searchParams.dateFrom}
              onChange={(e) => setSearchParams({ ...searchParams, dateFrom: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              id="date-to"
              type="date"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
              value={searchParams.dateTo}
              onChange={(e) => setSearchParams({ ...searchParams, dateTo: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="hash-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commit Hash</label>
            <input
              id="hash-input"
              type="text"
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
              placeholder="e.g. 7b3f1a"
              value={searchParams.hash}
              onChange={(e) => setSearchParams({ ...searchParams, hash: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-5">
            <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Search</label>
            <div className="flex gap-2">
              <input
                id="search-input"
                type="text"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
                placeholder="Search in subject and description..."
                value={searchParams.search}
                onChange={(e) => setSearchParams({ ...searchParams, search: e.target.value })}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors"
                disabled={loading}
                aria-label="Search"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Repository</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Author</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weight</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hash</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {commits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No commits found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                commits.map((commit) => (
                  <tr key={commit.hash} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {new Date(commit.commit_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {commit.repository_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {commit.author_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-md">
                      <span className="inline">{commit.subject}</span>
                      <CommitDescription description={commit.description} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {commit.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <WeightBadge efficiency={commit.weight} showTooltip={false} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                      {commit.hash.substring(0, 7)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user?.email === commit.author_email && (
                        <button
                          onClick={() => openEditModal(commit)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Edit Commit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Commit</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input
                  id="edit-subject"
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
                  value={editForm.subject}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="edit-weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (0-100)</label>
                <input
                  id="edit-weight"
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
                  value={editForm.weight}
                  onChange={(e) => setEditForm({ ...editForm, weight: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AI Tools</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5"
                  placeholder="e.g. CLAUDE CODE, COPILOT"
                  value={editForm.ai_tools}
                  onChange={(e) => setEditForm({ ...editForm, ai_tools: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Indicate one or more tools separated by a comma
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitSearch;
