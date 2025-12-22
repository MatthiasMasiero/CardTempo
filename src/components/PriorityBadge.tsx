import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  rank: number;
  className?: string;
  showLabel?: boolean;
}

export function PriorityBadge({ rank, className, showLabel = true }: PriorityBadgeProps) {
  // Color scheme based on rank
  const getColorClasses = (rank: number) => {
    if (rank === 1) {
      return {
        bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
        text: 'text-yellow-900',
        border: 'border-yellow-500',
        ring: 'ring-yellow-400',
      };
    } else if (rank === 2) {
      return {
        bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
        text: 'text-gray-900',
        border: 'border-gray-400',
        ring: 'ring-gray-300',
      };
    } else if (rank === 3) {
      return {
        bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        text: 'text-orange-900',
        border: 'border-orange-500',
        ring: 'ring-orange-400',
      };
    } else {
      return {
        bg: 'bg-gradient-to-br from-blue-400 to-blue-600',
        text: 'text-blue-900',
        border: 'border-blue-500',
        ring: 'ring-blue-400',
      };
    }
  };

  const colors = getColorClasses(rank);
  const isPriority = rank <= 3;

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center',
          'w-10 h-10 rounded-full border-2',
          'font-bold text-sm',
          colors.bg,
          colors.text,
          colors.border,
          rank === 1 && 'animate-pulse shadow-lg'
        )}
      >
        <span className="relative z-10">#{rank}</span>
        {rank === 1 && (
          <span className={cn('absolute inset-0 rounded-full', colors.ring, 'ring-2 opacity-75')} />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-gray-700">
          {isPriority ? 'PRIORITY' : 'Standard'}
        </span>
      )}
    </div>
  );
}
