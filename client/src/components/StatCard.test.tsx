import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

// Mock CountUp component
vi.mock('react-countup', () => ({
  default: ({ end, suffix }: { end: number; suffix?: string }) => (
    <span>{end}{suffix}</span>
  ),
}));

describe('StatCard', () => {
  it('should render title and numeric value', () => {
    render(<StatCard title="Total Commits" value={1234} icon="📊" />);

    expect(screen.getByText('Total Commits')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('should render with custom color class', () => {
    const { container } = render(
      <StatCard title="Test" value={100} icon="🚀" color="purple" />
    );

    const card = container.querySelector('.stat-card');
    expect(card).toHaveClass('from-purple-500', 'to-purple-600');
  });

  it('should render with suffix', () => {
    render(<StatCard title="Success Rate" value={95} suffix="%" icon="✅" />);

    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('should show positive change indicator', () => {
    render(<StatCard title="Test" value={100} change={15} icon="📈" />);

    expect(screen.getByText('↑')).toBeInTheDocument();
    expect(screen.getByText(/15% from last period/)).toBeInTheDocument();
  });

  it('should show negative change indicator', () => {
    render(<StatCard title="Test" value={100} change={-10} icon="📉" />);

    expect(screen.getByText('↓')).toBeInTheDocument();
    expect(screen.getByText(/10% from last period/)).toBeInTheDocument();
  });

  it('should not show change when not provided', () => {
    render(<StatCard title="Test" value={100} icon="📊" />);

    expect(screen.queryByText(/from last period/)).not.toBeInTheDocument();
  });

  it('should handle string values with commas', () => {
    render(<StatCard title="Test" value="1,234" icon="📊" />);

    // The component should parse the string and convert to number
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('should render non-numeric values as-is', () => {
    render(<StatCard title="Status" value="Active" icon="🟢" />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should apply default blue color when no color specified', () => {
    const { container } = render(
      <StatCard title="Test" value={100} icon="📊" />
    );

    const card = container.querySelector('.stat-card');
    expect(card).toHaveClass('from-blue-500', 'to-blue-600');
  });

  it('should handle all available color variants', () => {
    const colors: Array<'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'indigo'> = [
      'blue', 'purple', 'green', 'orange', 'pink', 'indigo'
    ];

    colors.forEach(color => {
      const { container } = render(
        <StatCard title="Test" value={100} icon="📊" color={color} />
      );

      const card = container.querySelector('.stat-card');
      expect(card).toHaveClass(`from-${color}-500`, `to-${color}-600`);
    });
  });

  it('should handle zero change correctly', () => {
    render(<StatCard title="Test" value={100} change={0} icon="📊" />);

    expect(screen.getByText('↑')).toBeInTheDocument(); // 0 is treated as positive
    expect(screen.getByText(/0% from last period/)).toBeInTheDocument();
  });

  it('should handle decimal values', () => {
    render(<StatCard title="Average" value={95.5} icon="📊" />);

    expect(screen.getByText('95.5')).toBeInTheDocument();
  });
});
