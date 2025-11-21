import React from 'react';
import CountUp from 'react-countup';
import WeightBadge from './WeightBadge';

type StatCardColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'indigo';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ReactNode;
  color?: StatCardColor;
  suffix?: string;
  // Weight-related props
  effectiveValue?: number | string;
  weightEfficiency?: number | string;
  showWeightBadge?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'blue',
  suffix = '',
  effectiveValue,
  weightEfficiency,
  showWeightBadge = true
}) => {
  const colorClasses: Record<StatCardColor, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  // Parse value if it's a string with commas or other formatting
  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/,/g, ''))
    : value;

  return (
    <div className={`stat-card bg-gradient-to-br ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold mt-2 text-white">
            {typeof numericValue === 'number' && !isNaN(numericValue) ? (
              <CountUp
                end={numericValue}
                duration={2}
                separator=","
                decimals={numericValue % 1 !== 0 ? 1 : 0}
                suffix={suffix}
              />
            ) : (
              value
            )}
          </p>
          {/* Weight sub-text */}
          {effectiveValue !== undefined && weightEfficiency !== undefined && (
            <div className="text-white/90 text-sm mt-2 flex items-center gap-2">
              <span>
                {typeof effectiveValue === 'number' ? effectiveValue.toFixed(1) : effectiveValue} effective
              </span>
              {showWeightBadge && weightEfficiency && (
                <WeightBadge
                  efficiency={weightEfficiency}
                  totalCommits={value}
                  effectiveCommits={effectiveValue}
                  size="sm"
                />
              )}
            </div>
          )}
          {/* Change indicator */}
          {change !== undefined && change !== null && (
            <p className="text-white/80 text-sm mt-2 flex items-center">
              <span className={`mr-1 ${change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {change >= 0 ? '↑' : '↓'}
              </span>
              {Math.abs(change)}% from last period
            </p>
          )}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );
};

export default StatCard;
