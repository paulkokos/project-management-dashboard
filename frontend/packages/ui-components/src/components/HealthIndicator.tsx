import React from 'react';
import { HealthIndicatorProps } from '../types';

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  health,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const healthColors: Record<string, { color: string; label: string }> = {
    healthy: { color: '#10b981', label: 'Healthy' },
    at_risk: { color: '#f59e0b', label: 'At Risk' },
    critical: { color: '#ef4444', label: 'Critical' },
  };

  const sizeMap: Record<string, { dot: string; font: string }> = {
    sm: { dot: '8px', font: '12px' },
    md: { dot: '12px', font: '14px' },
    lg: { dot: '16px', font: '16px' },
  };

  const healthInfo = healthColors[health] || healthColors.healthy;
  const sizeStyle = sizeMap[size];

  return (
    <div
      className={`health-indicator ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <div
        style={{
          width: sizeStyle.dot,
          height: sizeStyle.dot,
          borderRadius: '50%',
          backgroundColor: healthInfo.color,
          animation: 'pulse-health 2s ease-in-out infinite',
        }}
      >
        <style>{`
          @keyframes pulse-health {
            0%, 100% {
              opacity: 1;
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            50% {
              opacity: 0.8;
              box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
            }
          }
        `}</style>
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: sizeStyle.font,
            fontWeight: '500',
            color: '#374151',
          }}
        >
          {healthInfo.label}
        </span>
      )}
    </div>
  );
};
