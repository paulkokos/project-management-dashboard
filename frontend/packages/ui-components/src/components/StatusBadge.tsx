import React from 'react';
import { StatusBadgeProps } from '../types';

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    active: { bg: '#d1fae5', text: '#065f46' },
    on_hold: { bg: '#fef3c7', text: '#78350f' },
    completed: { bg: '#e0e7ff', text: '#3730a3' },
    archived: { bg: '#f3f4f6', text: '#374151' },
  };

  const sizeMap: Record<string, { padding: string; fontSize: string }> = {
    sm: { padding: '4px 8px', fontSize: '12px' },
    md: { padding: '6px 12px', fontSize: '14px' },
    lg: { padding: '8px 16px', fontSize: '16px' },
  };

  const colors = statusColors[status] || statusColors.active;
  const sizeStyle = sizeMap[size];

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: 'inline-block',
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        fontWeight: '500',
        borderRadius: '6px',
        backgroundColor: colors.bg,
        color: colors.text,
        textTransform: 'capitalize',
      }}
    >
      {status.replace('_', ' ')}
    </span>
  );
};
