export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin?: boolean;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface Role {
  id: number;
  key: string;
  display_name: string;
  description: string;
  color: string;
  bg_color: string;
  text_color: string;
  border_color: string;
  sort_order: number;
}

export interface TeamMember {
  id: number;
  user: User;
  role: Role | 'lead' | 'developer' | 'designer' | 'qa' | 'manager' | 'stakeholder';
  capacity: number;
}

export interface Milestone {
  id: number;
  title: string;
  description: string;
  due_date: string;
  progress: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: User | null;
  progress: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  parent_task: number | null;
  milestone: number | null;
  project_id: number;
  project_title: string;
  milestone_title: string | null;
  tags: Tag[];
  subtask_count: number;
  completed_subtask_count: number;
  is_overdue: boolean;
  days_until_due: number | null;
  created_at: string;
  updated_at: string;
  etag: string;
  version: number;
}

export interface TaskDetail extends Task {
  subtasks: Task[];
}

export interface CreateTaskRequest {
  project: number;
  title: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  assigned_to_id?: number | null;
  progress?: number;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  due_date?: string | null;
  start_date?: string | null;
  parent_task?: number | null;
  milestone?: number | null;
  tags?: number[];
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;

export interface TaskFilters {
  project_id?: number;
  status?: Task['status'] | Task['status'][];
  priority?: Task['priority'] | Task['priority'][];
  assigned_to?: number;
  milestone?: number;
  search?: string;
  is_overdue?: boolean;
  parent_task__isnull?: boolean;
}

export interface Activity {
  id: number;
  activity_type: string;
  user: User;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  owner: User;
  status: 'active' | 'on_hold' | 'archived' | 'completed';
  health: 'healthy' | 'at_risk' | 'critical';
  progress: number;
  start_date: string | null;
  end_date: string | null;
  tags: Tag[];
  team_members?: TeamMember[];
  team_members_details?: TeamMember[];
  milestones?: Milestone[];
  recent_activities?: Activity[];
  milestone_progress?: number;
  team_count?: number;
  milestone_count?: number;
  completed_milestone_count?: number;
  days_until_deadline?: number | null;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  duration_display?: string | null;
  etag: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
