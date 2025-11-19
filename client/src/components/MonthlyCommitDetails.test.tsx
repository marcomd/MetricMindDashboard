import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MonthlyCommitDetails from './MonthlyCommitDetails';
import * as api from '../utils/api';

// Mock the API module
vi.mock('../utils/api', () => ({
  fetchMonthlyCommits: vi.fn(),
}));

// Mock the date format utility
vi.mock('../utils/dateFormat', () => ({
  formatDate: (date: string) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },
}));

interface MockCommit {
  commit_hash: string;
  commit_date: string;
  commit_message: string;
  author_name: string;
  repository_name: string;
  lines_changed: number;
  lines_added: number;
  lines_deleted: number;
}

describe('MonthlyCommitDetails', () => {
  const mockCommits: MockCommit[] = [
    {
      commit_hash: 'abc1234567890',
      commit_date: '2024-01-15',
      commit_message: 'Add new authentication feature',
      author_name: 'John Doe',
      repository_name: 'auth-service',
      lines_changed: 150,
      lines_added: 100,
      lines_deleted: 50,
    },
    {
      commit_hash: 'def9876543210',
      commit_date: '2024-01-20',
      commit_message: 'Fix bug in payment processing with a very long commit message that should be truncated properly in the UI',
      author_name: 'Jane Smith',
      repository_name: 'payment-gateway',
      lines_changed: 80,
      lines_added: 50,
      lines_deleted: 30,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should show empty state when no month is selected', () => {
      render(<MonthlyCommitDetails selectedMonth={null} repository="all" />);

      expect(screen.getByText(/Click on a month/i)).toBeInTheDocument();
      expect(screen.getByText(/to view top commits/i)).toBeInTheDocument();
    });

    it('should show empty state icon', () => {
      const { container } = render(<MonthlyCommitDetails selectedMonth={null} repository="all" />);

      // Check for lucide-react icon (BarChart3) in empty state
      const iconSvg = container.querySelector('svg');
      expect(iconSvg).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching data', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: mockCommits }), 100))
      );

      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner has role="status"
    });

    it('should not show loading spinner when no month selected', () => {
      render(<MonthlyCommitDetails selectedMonth={null} repository="all" />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({
        data: mockCommits,
      } as any);
    });

    it('should fetch and display commit data when month is selected', async () => {
      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display table headers', async () => {
      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Lines')).toBeInTheDocument();
        expect(screen.getByText('Message')).toBeInTheDocument();
        expect(screen.getByText('Hash')).toBeInTheDocument();
        expect(screen.getByText('Author')).toBeInTheDocument();
        expect(screen.getByText('Repository')).toBeInTheDocument();
      });
    });

    it('should format dates correctly (dd/mm/yyyy)', async () => {
      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText('15/01/2024')).toBeInTheDocument();
        expect(screen.getByText('20/01/2024')).toBeInTheDocument();
      });
    });

    it('should truncate commit hash to 7 characters', async () => {
      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText('abc1234')).toBeInTheDocument();
        expect(screen.getByText('def9876')).toBeInTheDocument();
      });
    });

    it('should display lines changed with +added/-deleted breakdown', async () => {
      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('+100')).toBeInTheDocument();
        expect(screen.getByText('-50')).toBeInTheDocument();
      });
    });

    it('should truncate long commit messages', async () => {
      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        const message = screen.getByText(/Fix bug in payment processing/);
        expect(message).toBeInTheDocument();
        // Check for line-clamp CSS class
        expect(message.className).toContain('line-clamp');
      });
    });

    it('should display repository names', async () => {
      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText('auth-service')).toBeInTheDocument();
        expect(screen.getByText('payment-gateway')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call fetchMonthlyCommits with correct parameters', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: [] } as any);

      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(api.fetchMonthlyCommits).toHaveBeenCalledWith('2024-01', 10, 'all');
      });
    });

    it('should refetch data when month changes', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: [] } as any);

      const { rerender } = render(
        <MonthlyCommitDetails selectedMonth="2024-01" repository="all" />
      );

      await waitFor(() => {
        expect(api.fetchMonthlyCommits).toHaveBeenCalledWith('2024-01', 10, 'all');
      });

      rerender(<MonthlyCommitDetails selectedMonth="2024-02" repository="all" />);

      await waitFor(() => {
        expect(api.fetchMonthlyCommits).toHaveBeenCalledWith('2024-02', 10, 'all');
      });
    });

    it('should refetch data when repository filter changes', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: [] } as any);

      const { rerender } = render(
        <MonthlyCommitDetails selectedMonth="2024-01" repository="all" />
      );

      await waitFor(() => {
        expect(api.fetchMonthlyCommits).toHaveBeenCalledWith('2024-01', 10, 'all');
      });

      rerender(<MonthlyCommitDetails selectedMonth="2024-01" repository="test-repo" />);

      await waitFor(() => {
        expect(api.fetchMonthlyCommits).toHaveBeenCalledWith('2024-01', 10, 'test-repo');
      });
    });

    it('should not fetch when month is null', () => {
      render(<MonthlyCommitDetails selectedMonth={null} repository="all" />);

      expect(api.fetchMonthlyCommits).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockRejectedValue(new Error('Network error'));

      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load commits/i)).toBeInTheDocument();
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should show retry message on error', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockRejectedValue(new Error('Timeout'));

      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText(/try again/i)).toBeInTheDocument();
      });
    });

    it('should handle empty results gracefully', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: [] } as any);

      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText(/No commits found/i)).toBeInTheDocument();
        expect(screen.getByText(/2024-01/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode classes', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: mockCommits } as any);

      const { container } = render(
        <MonthlyCommitDetails selectedMonth="2024-01" repository="all" />
      );

      await waitFor(() => {
        // Check for dark mode classes in various elements
        const darkElements = container.querySelectorAll('[class*="dark:"]');
        expect(darkElements.length).toBeGreaterThan(0);

        // Specifically check thead and tbody for dark mode support
        const thead = container.querySelector('thead');
        expect(thead?.className).toContain('dark:');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have horizontal scroll on small screens', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: mockCommits } as any);

      const { container } = render(
        <MonthlyCommitDetails selectedMonth="2024-01" repository="all" />
      );

      await waitFor(() => {
        const scrollContainer = container.querySelector('.overflow-x-auto');
        expect(scrollContainer).toBeInTheDocument();
      });
    });
  });

  describe('Title Display', () => {
    it('should display month in title when month is selected', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: mockCommits } as any);

      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText(/Top Commits/i)).toBeInTheDocument();
        expect(screen.getByText(/2024-01/i)).toBeInTheDocument();
      });
    });
  });

  describe('Close Button', () => {
    it('should render close button when onClose prop is provided', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: mockCommits } as any);
      const onCloseMock = vi.fn();

      render(
        <MonthlyCommitDetails selectedMonth="2024-01" repository="all" onClose={onCloseMock} />
      );

      await waitFor(() => {
        const closeButton = screen.getByLabelText(/close panel/i);
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('should not render close button when onClose prop is not provided', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: mockCommits } as any);

      render(<MonthlyCommitDetails selectedMonth="2024-01" repository="all" />);

      await waitFor(() => {
        expect(screen.getByText(/Top Commits/i)).toBeInTheDocument();
      });

      const closeButton = screen.queryByLabelText(/close panel/i);
      expect(closeButton).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      vi.mocked(api.fetchMonthlyCommits).mockResolvedValue({ data: mockCommits } as any);
      const onCloseMock = vi.fn();

      render(
        <MonthlyCommitDetails selectedMonth="2024-01" repository="all" onClose={onCloseMock} />
      );

      await waitFor(() => {
        const closeButton = screen.getByLabelText(/close panel/i);
        expect(closeButton).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText(/close panel/i);
      closeButton.click();

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });
});
