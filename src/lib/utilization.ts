/**
 * Shared utilities for credit utilization calculations and display.
 */

export type UtilizationStatus = 'good' | 'medium' | 'high' | 'overlimit';

export interface UtilizationBadge {
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
}

/**
 * Calculate utilization percentage from balance and limit.
 */
export function calculateUtilization(balance: number, limit: number): number {
  if (limit <= 0) return 0;
  return (balance / limit) * 100;
}

/**
 * Get the CSS color class for a utilization progress bar.
 */
export function getUtilizationColor(utilization: number): string {
  if (utilization > 30) return 'bg-red-500';
  if (utilization > 10) return 'bg-yellow-500';
  return 'bg-green-500';
}

/**
 * Get badge properties for displaying utilization status.
 */
export function getUtilizationBadge(utilization: number): UtilizationBadge {
  if (utilization > 100) return { label: 'Over Limit', variant: 'destructive' };
  if (utilization > 30) return { label: 'High', variant: 'destructive' };
  if (utilization > 10) return { label: 'Medium', variant: 'secondary' };
  return { label: 'Good', variant: 'default' };
}

/**
 * Get the utilization status category.
 */
export function getUtilizationStatus(utilization: number): UtilizationStatus {
  if (utilization > 100) return 'overlimit';
  if (utilization > 30) return 'high';
  if (utilization > 10) return 'medium';
  return 'good';
}

/**
 * Get gradient class for card header based on utilization.
 */
export function getUtilizationGradient(utilization: number): string {
  if (utilization > 30) return 'bg-gradient-to-r from-red-500 to-red-400';
  if (utilization > 10) return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
  return 'bg-gradient-to-r from-green-500 to-green-400';
}
