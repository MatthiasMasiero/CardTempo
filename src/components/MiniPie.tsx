'use client';

interface MiniPieProps {
  percentage: number; // 0-100
  size?: number;
  className?: string;
}

export function MiniPie({ percentage, size = 20, className = '' }: MiniPieProps) {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Calculate the pie slice path
  // For a pie chart, we draw an arc from 12 o'clock position
  const radius = size / 2;
  const centerX = radius;
  const centerY = radius;

  // Convert percentage to radians (starting from top, going clockwise)
  const angle = (clampedPercentage / 100) * 2 * Math.PI;

  // Calculate end point of the arc
  const endX = centerX + radius * Math.sin(angle);
  const endY = centerY - radius * Math.cos(angle);

  // Determine if we need the large arc flag (for > 50%)
  const largeArcFlag = clampedPercentage > 50 ? 1 : 0;

  // Determine color based on utilization
  const getColor = () => {
    if (clampedPercentage <= 10) return '#059669'; // emerald-600
    if (clampedPercentage <= 30) return '#d97706'; // amber-600
    return '#dc2626'; // red-600
  };

  const getBgColor = () => {
    if (clampedPercentage <= 10) return '#d1fae5'; // emerald-100
    if (clampedPercentage <= 30) return '#fef3c7'; // amber-100
    return '#fee2e2'; // red-100
  };

  // Handle edge cases
  if (clampedPercentage === 0) {
    return (
      <svg width={size} height={size} className={className}>
        <circle cx={centerX} cy={centerY} r={radius} fill={getBgColor()} />
      </svg>
    );
  }

  if (clampedPercentage >= 100) {
    return (
      <svg width={size} height={size} className={className}>
        <circle cx={centerX} cy={centerY} r={radius} fill={getColor()} />
      </svg>
    );
  }

  // Create the pie slice path
  const pathData = [
    `M ${centerX} ${centerY}`, // Move to center
    `L ${centerX} ${centerY - radius}`, // Line to top (12 o'clock)
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc to end point
    'Z' // Close path back to center
  ].join(' ');

  return (
    <svg width={size} height={size} className={className}>
      {/* Background circle */}
      <circle cx={centerX} cy={centerY} r={radius} fill={getBgColor()} />
      {/* Pie slice */}
      <path d={pathData} fill={getColor()} />
    </svg>
  );
}
