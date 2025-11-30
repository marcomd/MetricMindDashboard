import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BeforeAfter from './BeforeAfter';
import * as api from '../utils/api';

// Mock the API module
vi.mock('../utils/api', () => ({
  fetchRepos: vi.fn(),
  fetchBeforeAfter: vi.fn(),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('BeforeAfter', () => {
  const mockRepos = [
    { name: 'repo-1' },
    { name: 'repo-2' },
  ];

  const mockBeforeAfterData = {
    before: {
      avg_commits_per_month: '45.2',
      avg_effective_commits_per_month: '40.8',
      avg_weight: '90.3',
      avg_lines_per_commit: '125.5',
      avg_authors: '5.0',
      avg_commits_per_committer: '9.04',
      avg_weighted_lines_per_commit: '113.0',
      avg_effective_commits_per_committer: '8.16',
    },
    after: {
      avg_commits_per_month: '62.5',
      avg_effective_commits_per_month: '58.1',
      avg_weight: '93.0',
      avg_lines_per_commit: '98.3',
      avg_authors: '6.5',
      avg_commits_per_committer: '9.62',
      avg_weighted_lines_per_commit: '91.4',
      avg_effective_commits_per_committer: '8.94',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchRepos).mockResolvedValue({ data: mockRepos } as any);
    vi.mocked(api.fetchBeforeAfter).mockResolvedValue({ data: mockBeforeAfterData } as any);
  });

  describe('Initial Render', () => {
    it('should render the page title', async () => {
      renderWithRouter(<BeforeAfter />);

      expect(screen.getByText('Before/After Analysis')).toBeInTheDocument();
    });

    it('should render the repository selector with "All Repositories" as default', async () => {
      renderWithRouter(<BeforeAfter />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toHaveValue('all');
      });
    });

    it('should render the "Use Weighted Data" toggle', async () => {
      renderWithRouter(<BeforeAfter />);

      expect(screen.getByText('Use Weighted Data')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should have "Use Weighted Data" toggle checked by default', async () => {
      renderWithRouter(<BeforeAfter />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  describe('Weighted Data Toggle', () => {
    it('should toggle the checkbox when clicked', async () => {
      renderWithRouter(<BeforeAfter />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should show weighted labels when toggle is checked and data is displayed', async () => {
      renderWithRouter(<BeforeAfter />);

      // Click Analyze button
      const analyzeButton = screen.getByRole('button', { name: /analyze impact/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        // Check for weighted labels (toggle is on by default)
        // Using getAllByText since there are multiple Before/After cards with this label
        const weightedLabels = screen.getAllByText(/eff\. commits\/month/i);
        expect(weightedLabels.length).toBeGreaterThan(0);
      });
    });

    it('should show unweighted labels when toggle is unchecked and data is displayed', async () => {
      renderWithRouter(<BeforeAfter />);

      // Uncheck the toggle
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Click Analyze button
      const analyzeButton = screen.getByRole('button', { name: /analyze impact/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        // Check that weighted label is NOT present (only unweighted should be there)
        const weightedLabels = screen.queryAllByText(/eff\. commits\/month/i);
        expect(weightedLabels.length).toBe(0);
      });
    });

    it('should display effective commits value when weighted toggle is on', async () => {
      renderWithRouter(<BeforeAfter />);

      // Click Analyze button
      const analyzeButton = screen.getByRole('button', { name: /analyze impact/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        // Should display effective commits value (40.8) - the Before value
        const values = screen.getAllByText('40.8');
        expect(values.length).toBeGreaterThan(0);
      });
    });

    it('should display total commits value when weighted toggle is off', async () => {
      renderWithRouter(<BeforeAfter />);

      // Uncheck the toggle
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Click Analyze button
      const analyzeButton = screen.getByRole('button', { name: /analyze impact/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        // Should display total commits value (45.2) - the Before value
        const values = screen.getAllByText('45.2');
        expect(values.length).toBeGreaterThan(0);
      });
    });

    it('should toggle between weighted and unweighted values dynamically', async () => {
      renderWithRouter(<BeforeAfter />);

      // Click Analyze button first
      const analyzeButton = screen.getByRole('button', { name: /analyze impact/i });
      fireEvent.click(analyzeButton);

      // Wait for weighted data to appear (40.8 is effective commits)
      await waitFor(() => {
        const values = screen.getAllByText('40.8');
        expect(values.length).toBeGreaterThan(0);
      });

      // Now toggle off
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      // Wait for unweighted data to appear (45.2 is total commits)
      await waitFor(() => {
        const values = screen.getAllByText('45.2');
        expect(values.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Analysis Button', () => {
    it('should call fetchBeforeAfter when Analyze button is clicked', async () => {
      renderWithRouter(<BeforeAfter />);

      const analyzeButton = screen.getByRole('button', { name: /analyze impact/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(api.fetchBeforeAfter).toHaveBeenCalled();
      });
    });

    it('should display results after clicking Analyze', async () => {
      renderWithRouter(<BeforeAfter />);

      const analyzeButton = screen.getByRole('button', { name: /analyze impact/i });
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        // Check that comparison cards are displayed
        expect(screen.getAllByText('Before').length).toBeGreaterThan(0);
        expect(screen.getAllByText('After').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty State', () => {
    it('should show ready to analyze message before analysis', () => {
      renderWithRouter(<BeforeAfter />);

      expect(screen.getByText('Ready to Analyze')).toBeInTheDocument();
      expect(screen.getByText(/Configure the periods above/i)).toBeInTheDocument();
    });
  });
});
