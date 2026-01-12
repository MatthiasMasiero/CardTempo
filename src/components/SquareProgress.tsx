'use client';

import { ReactNode } from 'react';

interface SquareProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
  className?: string;
}

export function SquareProgress({
  progress,
  size = 48,
  strokeWidth = 3,
  children,
  className = ''
}: SquareProgressProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const offset = strokeWidth / 2;
  const innerSize = size - strokeWidth;
  const radius = 8; // Corner radius

  // Calculate the perimeter (4 sides minus the corner cuts, plus the corner arcs)
  // Each corner arc length = (π * radius) / 2 (quarter circle)
  const straightLength = (innerSize - 2 * radius) * 4;
  const cornerLength = 2 * Math.PI * radius; // 4 quarter circles = 1 full circle
  const perimeter = straightLength + cornerLength;

  // Calculate dash offset
  const dashOffset = perimeter - (clampedProgress / 100) * perimeter;

  // Determine colors based on utilization thresholds
  const getColors = () => {
    if (clampedProgress <= 10) {
      return { stroke: '#059669', bg: '#d1fae5', fill: '#ecfdf5' }; // emerald
    }
    if (clampedProgress <= 30) {
      return { stroke: '#d97706', bg: '#fef3c7', fill: '#fef3c7' }; // amber
    }
    return { stroke: '#dc2626', bg: '#fee2e2', fill: '#fee2e2' }; // red
  };

  const colors = getColors();

  // Create path starting from top-center, going clockwise
  // Points (with offset for stroke):
  const left = offset;
  const right = size - offset;
  const top = offset;
  const bottom = size - offset;
  const centerX = size / 2;

  // Path starts at top-center, goes clockwise
  const pathD = [
    `M ${centerX} ${top}`, // Start at top-center
    `L ${right - radius} ${top}`, // Line to top-right (before corner)
    `A ${radius} ${radius} 0 0 1 ${right} ${top + radius}`, // Top-right corner
    `L ${right} ${bottom - radius}`, // Line down right side
    `A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`, // Bottom-right corner
    `L ${left + radius} ${bottom}`, // Line across bottom
    `A ${radius} ${radius} 0 0 1 ${left} ${bottom - radius}`, // Bottom-left corner
    `L ${left} ${top + radius}`, // Line up left side
    `A ${radius} ${radius} 0 0 1 ${left + radius} ${top}`, // Top-left corner
    `L ${centerX} ${top}`, // Line back to top-center
  ].join(' ');

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* Filled background */}
        <rect
          x={offset}
          y={offset}
          width={innerSize}
          height={innerSize}
          rx={radius}
          fill={colors.fill}
        />
        {/* Background border (shows unfilled portion) */}
        <path
          d={pathD}
          fill="none"
          stroke={colors.bg}
          strokeWidth={strokeWidth}
        />
        {/* Progress border - starts from top center, goes clockwise */}
        <path
          d={pathD}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={perimeter}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
