import React from 'react';
import { ActivityFeedProps } from '../types';

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  maxItems = 10,
  onActivityClick,
  className = '',
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getActivityIcon = (activityType: string): string => {
    const iconMap: Record<string, string> = {
      created: '✨',
      updated: '✎',
      status_changed: '→',
      member_added: '👤',
      member_removed: '✕',
      comment_added: '💬',
      bulk_updated: '⚡',
    };
    return iconMap[activityType] || '•';
  };

  return (
    <div className={`activity-feed ${className}`} style={{ width: '100%' }}>
      {displayedActivities.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px',
          }}
        >
          No activities yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayedActivities.map((activity, index) => (
            <div
              key={activity.id}
              onClick={() => onActivityClick?.(activity)}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: '#f9fafb',
                cursor: onActivityClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                borderLeft: '3px solid #e5e7eb',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (onActivityClick) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                  (e.currentTarget as HTMLElement).style.borderLeftColor = '#3b82f6';
                }
              }}
              onMouseLeave={(e) => {
                if (onActivityClick) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
                  (e.currentTarget as HTMLElement).style.borderLeftColor = '#e5e7eb';
                }
              }}
            >
              <div
                style={{
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '24px',
                }}
              >
                {getActivityIcon(activity.activity_type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
                    {activity.user.first_name || activity.user.email}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'capitalize',
                    }}
                  >
                    {activity.activity_type.replace('_', ' ')}
                  </span>
                </div>
                <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#6b7280' }}>
                  {activity.description}
                </p>
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {formatDate(activity.created_at)}
                </span>
              </div>

              {index === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '-3px',
                    top: '50%',
                    width: '3px',
                    height: '24px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '3px',
                    transform: 'translateY(-50%)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
