'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    gray: 'border-gray-600',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          animate-spin rounded-full border-2 border-gray-200 border-t-transparent
          ${sizeClasses[size]} ${colorClasses[color]}
        `}
        style={{
          borderTopColor: 'transparent',
        }}
      />
      {text && (
        <span className={`text-gray-600 ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  );
}

// Skeleton loader for content
interface SkeletonProps {
  className?: string;
  lines?: number;
  animate?: boolean;
}

export function Skeleton({ className = '', lines = 1, animate = true }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`
            bg-gray-200 rounded h-4
            ${animate ? 'animate-pulse' : ''}
            ${index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}
          `}
        />
      ))}
    </div>
  );
}

// Card skeleton
export function CardSkeleton({ animate = true }: { animate?: boolean }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${animate ? 'animate-pulse' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="bg-gray-200 rounded h-4 w-3/4"></div>
        <div className="bg-gray-200 rounded-full h-6 w-12"></div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="bg-gray-200 rounded h-3 w-full"></div>
        <div className="bg-gray-200 rounded h-3 w-2/3"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="bg-gray-200 rounded-full h-5 w-16"></div>
        <div className="bg-gray-200 rounded h-3 w-20"></div>
      </div>
    </div>
  );
}