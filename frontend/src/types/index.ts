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
  description: string;
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

export type ReportType = 'project_progress' | 'task_completion';
export type ReportStatus = 'draft' | 'generating' | 'completed' | 'failed';
export type ExportFormat = 'json' | 'pdf' | 'csv';

export interface ReportConfiguration {
  id: number;
  user: User;
  name: string;
  report_type: ReportType;
  start_date: string | null;
  end_date: string | null;
  relative_time_range: string | null;
  projects: Project[];
  project_ids?: number[];
  status_filter: string | null;
  health_filter: string | null;
  include_charts: boolean;
  chart_types: string[];
  config_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ReportConfigurationListItem {
  id: number;
  name: string;
  report_type: ReportType;
  start_date: string | null;
  end_date: string | null;
  relative_time_range: string | null;
  include_charts: boolean;
  project_count: number;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  user: User;
  configuration: ReportConfiguration | null;
  configuration_name: string | null;
  configuration_id: number | null;
  title: string;
  description: string;
  report_type: ReportType;
  status: ReportStatus;
  start_date: string | null;
  end_date: string | null;
  report_data: Record<string, any>;
  export_format: ExportFormat;
  exported_file: string | null;
  generated_at: string | null;
  generation_time_seconds: number | null;
  error_message: string;
  created_at: string;
  updated_at: string;
}

export interface ReportListItem {
  id: number;
  title: string;
  report_type: ReportType;
  status: ReportStatus;
  configuration_name: string | null;
  start_date: string | null;
  end_date: string | null;
  export_format: ExportFormat;
  generated_at: string | null;
  created_at: string;
}

export interface ProjectProgressReport {
  success: boolean;
  report_type: 'project_progress';
  total_projects: number;
  start_date: string | null;
  end_date: string | null;
  summary: {
    average_progress: number;
    completed_count: number;
    active_count: number;
    on_hold_count: number;
    archived_count: number;
  };
  by_status: Array<{ status: string; count: number }>;
  by_health: Array<{ health: string; count: number }>;
  progress_distribution: Array<{ range: string; count: number; low: number; high: number }>;
  projects: Array<{
    id: number;
    title: string;
    status: string;
    health: string;
    progress: number;
    start_date: string | null;
    end_date: string | null;
    days_until_deadline: number | null;
    risk_level: string;
    milestone_count: number;
    completed_milestone_count: number;
    team_count: number;
  }>;
  generation_time_seconds: number;
  generated_at: string;
}

export interface TaskCompletionReport {
  success: boolean;
  report_type: 'task_completion';
  total_tasks: number;
  start_date: string | null;
  end_date: string | null;
  summary: {
    completion_rate: number;
    completed_count: number;
    in_progress_count: number;
    todo_count: number;
    review_count: number;
    backlog_count: number;
    cancelled_count: number;
  };
  by_status: Array<{ status: string; count: number }>;
  by_priority: Array<{ priority: string; count: number }>;
  by_project: Array<{ project_id: number; project__title: string; total: number; completed: number }>;
  tasks: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    progress: number;
    project_id: number;
    project_title: string | null;
    assigned_to: { id: number; username: string } | null;
    due_date: string | null;
    start_date: string | null;
    completed_at: string | null;
    is_overdue: boolean;
    days_until_due: number | null;
    estimated_hours: number | null;
    actual_hours: number | null;
  }>;
  generation_time_seconds: number;
  generated_at: string;
}

export type TimeRangeOption = 
  | 'last_7_days' 
  | 'last_30_days' 
  | 'last_90_days' 
  | 'this_month' 
  | 'this_quarter' 
  | 'this_year' 
  | 'custom';
