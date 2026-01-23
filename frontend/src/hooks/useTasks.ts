import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI } from '@/services';
import type {
  Task,
  TaskDetail,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilters,
} from '@/types';
import { useNotification } from '@/contexts/NotificationContext';

const TASKS_QUERY_KEY = ['tasks'];

/**
 * Hook to fetch tasks with optional filters
 */
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, filters],
    queryFn: async () => {
      const response = await taskAPI.list(filters);
      return response.data as Task[];
    },
    enabled: !!filters?.project_id,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch single task detail with subtasks
 */
export function useTask(taskId: number | null) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, taskId],
    queryFn: async () => {
      const response = await taskAPI.get(taskId!);
      return response.data as TaskDetail;
    },
    enabled: !!taskId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to create a new task
 */
export function useCreateTask(projectId: number) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) =>
      taskAPI.create({ ...data, project: projectId }),
    onSuccess: (response) => {
      const task = response.data;

      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: ['project', projectId.toString()],
      });

      addNotification({
        type: 'success',
        message: 'Task created successfully',
        description: `"${task.title}" has been added`,
        duration: 3000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to create task',
        description: error.response?.data?.detail || 'Please try again',
        duration: 5000,
      });
    },
  });
}

/**
 * Hook to update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskRequest }) =>
      taskAPI.update(id, data),
    onSuccess: (response, variables) => {
      const task = response.data;

      queryClient.setQueryData([...TASKS_QUERY_KEY, variables.id], task);
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });

      addNotification({
        type: 'success',
        message: 'Task updated',
        duration: 2000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to update task',
        description: error.response?.data?.detail || 'Please try again',
        duration: 5000,
      });
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  return useMutation({
    mutationFn: (taskId: number) => taskAPI.delete(taskId),
    onSuccess: (_, taskId) => {
      queryClient.removeQueries({ queryKey: [...TASKS_QUERY_KEY, taskId] });
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });

      addNotification({
        type: 'success',
        message: 'Task deleted',
        duration: 2000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to delete task',
        description: error.response?.data?.detail || 'Please try again',
        duration: 5000,
      });
    },
  });
}

/**
 * Hook to mark task as complete
 */
export function useMarkTaskComplete() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  return useMutation({
    mutationFn: (taskId: number) => taskAPI.markComplete(taskId),
    onSuccess: (response) => {
      const task = response.data;

      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });

      addNotification({
        type: 'success',
        message: 'Task completed!',
        description: `"${task.title}" marked as done`,
        duration: 3000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to complete task',
        description: error.response?.data?.detail || 'Please try again',
        duration: 5000,
      });
    },
  });
}

/**
 * Hook to mark task as in progress
 */
export function useMarkTaskInProgress() {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  return useMutation({
    mutationFn: (taskId: number) => taskAPI.markInProgress(taskId),
    onSuccess: (response) => {
      const task = response.data;

      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });

      addNotification({
        type: 'success',
        message: 'Task started',
        description: `"${task.title}" is now in progress`,
        duration: 3000,
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to update task',
        description: error.response?.data?.detail || 'Please try again',
        duration: 5000,
      });
    },
  });
}

export default {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useMarkTaskComplete,
  useMarkTaskInProgress,
};
