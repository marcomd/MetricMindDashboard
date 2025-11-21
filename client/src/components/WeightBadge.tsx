import { Info } from 'lucide-react';

interface WeightBadgeProps {
  efficiency: number | string;
  totalCommits?: number | string;
  effectiveCommits?: number | string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * WeightBadge Component
 *
 * Displays a color-coded badge indicating weight efficiency percentage.
 * Color scheme:
 * - 100%: Green (Full weight, no de-prioritization)
 * - 75-99%: Yellow (Partial weight, some de-prioritization)
 * - 50-74%: Orange (Reduced weight, significant de-prioritization)
 * - <50%: Red (Low weight, heavily de-prioritized)
 *
 * Following gradual disclosure principle: only displayed when efficiency < 100%
 */
const WeightBadge = ({
  efficiency,
  totalCommits,
  effectiveCommits,
  showTooltip = true,
  size = 'md'
}: WeightBadgeProps): JSX.Element | null => {
  const efficiencyNum = typeof efficiency === 'string' ? parseFloat(efficiency) : efficiency;

  // Gradual disclosure: don't show badge if efficiency is 100%
  if (efficiencyNum >= 100) {
    return null;
  }

  // Determine badge color and label based on efficiency
  const getBadgeStyle = (eff: number) => {
    if (eff >= 75) {
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-yellow-300 dark:border-yellow-700',
        label: 'Partial weight'
      };
    } else if (eff >= 50) {
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-800 dark:text-orange-300',
        border: 'border-orange-300 dark:border-orange-700',
        label: 'Reduced weight'
      };
    } else {
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-red-300 dark:border-red-700',
        label: 'Low weight'
      };
    }
  };

  const style = getBadgeStyle(efficiencyNum);

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const tooltipContent = totalCommits && effectiveCommits ? (
    <div className="text-xs">
      <div className="font-semibold mb-1">Weight Efficiency</div>
      <div>Total commits: {totalCommits}</div>
      <div>Effective commits: {typeof effectiveCommits === 'number' ? effectiveCommits.toFixed(1) : effectiveCommits}</div>
      <div>Efficiency: {efficiencyNum.toFixed(1)}%</div>
      <div className="mt-1 text-gray-400 dark:text-gray-500">
        Some commits are de-prioritized
      </div>
    </div>
  ) : (
    <div className="text-xs">
      <div className="font-semibold mb-1">Weight Efficiency: {efficiencyNum.toFixed(1)}%</div>
      <div className="text-gray-400 dark:text-gray-500">
        Some commits are de-prioritized
      </div>
    </div>
  );

  return (
    <div className="inline-flex items-center group relative">
      <span
        className={`
          ${style.bg} ${style.text} ${style.border}
          ${sizeClasses[size]}
          border rounded-full font-medium
          inline-flex items-center gap-1
          transition-all duration-300
        `}
      >
        {efficiencyNum.toFixed(0)}%
        {showTooltip && <Info className="w-3 h-3" />}
      </span>

      {showTooltip && (
        <div className="
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
          opacity-0 invisible group-hover:opacity-100 group-hover:visible
          transition-all duration-200 z-50
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          px-3 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700
          whitespace-nowrap pointer-events-none
          min-w-[200px]
        ">
          {tooltipContent}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-white dark:border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightBadge;
