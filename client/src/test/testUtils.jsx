import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} - Render result with additional utilities
 */
export function renderWithRouter(ui, options = {}) {
  return render(ui, {
    wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  });
}

/**
 * Mock API responses for testing
 */
export const mockApiResponses = {
  repos: [
    { id: 1, repo_name: 'test-repo-1', total_commits: 100, contributor_count: 5 },
    { id: 2, repo_name: 'test-repo-2', total_commits: 200, contributor_count: 10 },
  ],
  contributors: [
    { author_name: 'John Doe', commit_count: 50, repos_contributed: 2 },
    { author_name: 'Jane Smith', commit_count: 30, repos_contributed: 1 },
  ],
  trends: [
    { month: '2024-01', commit_count: 25, repo_name: 'test-repo-1' },
    { month: '2024-02', commit_count: 30, repo_name: 'test-repo-1' },
  ],
};

/**
 * Wait for async operations to complete
 * @param {number} ms - Milliseconds to wait
 */
export const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
