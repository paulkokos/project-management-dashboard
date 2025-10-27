/**
 * TypeScript type definitions for Project Dashboard UI Components
 */

export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  health: 'healthy' | 'at_risk' | 'critical';
  progress: number;
  owner: User;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

export interface TeamMember {
  id: number;
  user: User;
  project: number;
  role: 'owner' | 'manager' | 'contributor' | 'viewer';
  joined_at: string;
}

export interface Activity {
  id: number;
  project: number;
  user: User;
  activity_type: string;
  description: string;
  created_at: string;
}

export interface ProjectTag {
  id: number;
  name: string;
  color?: string;
}

export interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  className?: string;
}

export interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: 'success' | 'warning' | 'danger' | 'info';
  animated?: boolean;
  className?: string;
}

export interface StatusBadgeProps {
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface HealthIndicatorProps {
  health: 'healthy' | 'at_risk' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export interface TeamRosterProps {
  teamMembers: TeamMember[];
  maxDisplay?: number;
  onMemberClick?: (member: TeamMember) => void;
  className?: string;
}

export interface ActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  onActivityClick?: (activity: Activity) => void;
  className?: string;
}
