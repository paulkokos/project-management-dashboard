import React from 'react';
import { ProgressBarProps } from '../types';

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  color = 'success',
  animated = false,
  className = '',
}) => {
  const colorMap: Record<string, string> = {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  };

  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div
      className={`progress-bar-container ${className}`}
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: '#e5e7eb',
        borderRadius: `${height / 2}px`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${normalizedProgress}%`,
          backgroundColor: colorMap[color],
          borderRadius: `${height / 2}px`,
          transition: 'width 0.3s ease',
          animation: animated ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        }}
      >
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
