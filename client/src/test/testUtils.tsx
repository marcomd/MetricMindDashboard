import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';

interface WrapperProps {
  children: ReactNode;
}

/**
 * Custom render function that wraps components with necessary providers
 * @param ui - Component to render
 * @param options - Render options
 * @returns Render result with additional utilities
 */
export function renderWithRouter(
  ui: ReactElement,
  options: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult {
  return render(ui, {
    wrapper: ({ children }: WrapperProps) => <BrowserRouter>{children}</BrowserRouter>,
    ...options,
  });
}

interface Repo {
  id: number;
  repo_name: string;
  total_commits: number;
  contributor_count: number;
}

interface Contributor {
  author_name: string;
  commit_count: number;
  repos_contributed: number;
}

interface Trend {
  month: string;
  commit_count: number;
  repo_name: string;
}

interface MockApiResponses {
  repos: Repo[];
  contributors: Contributor[];
  trends: Trend[];
}

/**
 * Mock API responses for testing
 */
export const mockApiResponses: MockApiResponses = {
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
 * @param ms - Milliseconds to wait
 */
export const wait = (ms: number = 0): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
