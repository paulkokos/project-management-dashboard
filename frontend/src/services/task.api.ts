import api from './api';
import type {
  Task,
  TaskDetail,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
} from '@/types';

/**
 * Task API Service
 * Handles all task-related API operations
 */
export const taskAPI = {
  /**
   * List tasks with optional filters
   */
  list: (filters?: TaskFilters) => api.get<Task[]>('/tasks/', { params: filters }),

  /**
   * Get a single task with full details including subtasks
   */
  get: (taskId: number) => api.get<TaskDetail>(`/tasks/${taskId}/`),

  /**
   * Create a new task
   */
  create: (data: CreateTaskRequest) => api.post<Task>('/tasks/', data),

  /**
   * Update a task (partial update)
   */
  update: (taskId: number, data: UpdateTaskRequest) =>
    api.patch<Task>(`/tasks/${taskId}/`, data),

  /**
   * Delete a task (soft delete)
   */
  delete: (taskId: number) => api.delete(`/tasks/${taskId}/`),

  /**
   * Mark a task as complete
   */
  markComplete: (taskId: number) =>
    api.post<Task>(`/tasks/${taskId}/mark_complete/`),

  /**
   * Mark a task as in progress
   */
  markInProgress: (taskId: number) =>
    api.post<Task>(`/tasks/${taskId}/mark_in_progress/`),
};

export default taskAPI;
