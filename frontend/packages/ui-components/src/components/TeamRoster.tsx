import React from 'react';
import { TeamRosterProps } from '../types';

export const TeamRoster: React.FC<TeamRosterProps> = ({
  teamMembers,
  maxDisplay = 5,
  onMemberClick,
  className = '',
}) => {
  const roleColors: Record<string, string> = {
    owner: '#6366f1',
    manager: '#3b82f6',
    contributor: '#10b981',
    viewer: '#6b7280',
  };

  const displayedMembers = teamMembers.slice(0, maxDisplay);
  const hiddenCount = Math.max(0, teamMembers.length - maxDisplay);

  return (
    <div
      className={`team-roster ${className}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
      }}
    >
      {displayedMembers.map((member) => (
        <div
          key={member.id}
          onClick={() => onMemberClick?.(member)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: '#f3f4f6',
            cursor: onMemberClick ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (onMemberClick) {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            if (onMemberClick) {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
            }
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: roleColors[member.role],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {(member.user.first_name?.[0] || member.user.email[0]).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
              {member.user.first_name || member.user.email}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'capitalize' }}>
              {member.role}
            </div>
          </div>
        </div>
      ))}
      {hiddenCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            backgroundColor: '#f3f4f6',
            fontSize: '13px',
            fontWeight: '600',
            color: '#6b7280',
          }}
        >
          +{hiddenCount}
        </div>
      )}
    </div>
  );
};
