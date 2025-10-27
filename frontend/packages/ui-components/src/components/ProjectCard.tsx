import React from 'react';
import { ProjectCardProps } from '../types';

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onClick,
  className = '',
}) => {
  const statusColors: Record<string, string> = {
    active: '#10b981',
    on_hold: '#f59e0b',
    completed: '#6366f1',
    archived: '#6b7280',
  };

  return (
    <div
      onClick={onClick}
      className={`project-card ${className}`}
      style={{
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#fff',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
          {project.name}
        </h3>
        <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.description}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: statusColors[project.status] || '#d1d5db',
            color: '#fff',
          }}
        >
          {project.status.replace('_', ' ').toUpperCase()}
        </span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
          {project.progress}% complete
        </span>
      </div>

      <div style={{ width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            backgroundColor: project.health === 'critical' ? '#ef4444' : project.health === 'at_risk' ? '#f59e0b' : '#10b981',
            width: `${project.progress}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', fontSize: '13px', color: '#6b7280' }}>
        <span style={{ marginRight: '8px' }}>Owner:</span>
        <strong>{project.owner.first_name || project.owner.email}</strong>
      </div>
    </div>
  );
};
