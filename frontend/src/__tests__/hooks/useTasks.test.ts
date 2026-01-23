import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useMarkTaskComplete,
  useMarkTaskInProgress,
} from '@/hooks/useTasks';
import * as taskAPI from '@/services/task.api';
import * as notificationContext from '@/contexts/NotificationContext';
import type { Task, CreateTaskRequest } from '@/types';

describe('useTasks Hooks', () => {
  let queryClient: QueryClient;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test description',
    status: 'todo',
    priority: 'high',
    assigned_to: {
      id: 1,
      username: 'john_doe',
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
    },
    progress: 50,
    estimated_hours: 8,
    actual_hours: null,
    due_date: '2025-06-30',
    start_date: '2025-06-01',
    completed_at: null,
    parent_task: null,
    milestone: 1,
    project_id: 1,
    project_title: 'Test Project',
    milestone_title: 'Q2 Release',
    tags: [],
    subtask_count: 0,
    completed_subtask_count: 0,
    is_overdue: false,
    days_until_due: 7,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    etag: 'abc123',
    version: 1,
  };

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock notification context
    vi.spyOn(notificationContext, 'useNotification').mockReturnValue({
      addNotification: vi.fn(),
      removeNotification: vi.fn(),
    } as any);
  });

  describe('useTasks', () => {
    it('fetches tasks with project_id filter', async () => {
      const mockList = vi.spyOn(taskAPI.taskAPI, 'list').mockResolvedValue({
        data: [mockTask],
        status: 200,
      } as any);

      const { result } = renderHook(
        () => useTasks({ project_id: 1 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockList).toHaveBeenCalledWith({ project_id: 1 });
      expect(result.current.data).toEqual([mockTask]);
    });

    it('returns undefined data when disabled', async () => {
      const mockList = vi.spyOn(taskAPI.taskAPI, 'list');

      const { result } = renderHook(
        () => useTasks(undefined),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When query is disabled (no project_id), data should be undefined
      expect(result.current.data).toEqual(undefined);
      // And the API should not be called
      expect(mockList).not.toHaveBeenCalled();
    });

    it('applies status filter', async () => {
      const mockList = vi.spyOn(taskAPI.taskAPI, 'list').mockResolvedValue({
        data: [{ ...mockTask, status: 'in_progress' }],
        status: 200,
      } as any);

      const { result } = renderHook(
        () => useTasks({ project_id: 1, status: 'in_progress' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockList).toHaveBeenCalledWith({ project_id: 1, status: 'in_progress' });
    });

    it('applies priority filter', async () => {
      const mockList = vi.spyOn(taskAPI.taskAPI, 'list').mockResolvedValue({
        data: [{ ...mockTask, priority: 'critical' }],
        status: 200,
      } as any);

      const { result } = renderHook(
        () => useTasks({ project_id: 1, priority: 'critical' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockList).toHaveBeenCalledWith({ project_id: 1, priority: 'critical' });
    });

    it('applies search filter', async () => {
      const mockList = vi.spyOn(taskAPI.taskAPI, 'list').mockResolvedValue({
        data: [mockTask],
        status: 200,
      } as any);

      const { result } = renderHook(
        () => useTasks({ project_id: 1, search: 'authentication' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockList).toHaveBeenCalledWith({ project_id: 1, search: 'authentication' });
    });
  });

  describe('useTask', () => {
    it('fetches single task by ID', async () => {
      const mockGet = vi.spyOn(taskAPI.taskAPI, 'get').mockResolvedValue({
        data: mockTask,
        status: 200,
      } as any);

      const { result } = renderHook(
        () => useTask(1),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledWith(1);
      expect(result.current.data).toEqual(mockTask);
    });

    it('disables query when ID is null', async () => {
      const mockGet = vi.spyOn(taskAPI.taskAPI, 'get');

      const { result } = renderHook(
        () => useTask(null),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGet).not.toHaveBeenCalled();
    });

    it('refetches when task ID changes', async () => {
      const mockGet = vi.spyOn(taskAPI.taskAPI, 'get').mockResolvedValue({
        data: mockTask,
        status: 200,
      } as any);

      const { result, rerender } = renderHook(
        ({ id }) => useTask(id),
        { wrapper, initialProps: { id: 1 } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGet).toHaveBeenCalledWith(1);

      rerender({ id: 2 });

      expect(mockGet).toHaveBeenCalledWith(2);
    });
  });

  describe('useCreateTask', () => {
    it('creates task successfully', async () => {
      const mockCreate = vi.spyOn(taskAPI.taskAPI, 'create').mockResolvedValue({
        data: mockTask,
        status: 201,
      } as any);

      const mockAddNotification = vi.fn();
      vi.spyOn(notificationContext, 'useNotification').mockReturnValue({
        addNotification: mockAddNotification,
        removeNotification: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useCreateTask(1),
        { wrapper }
      );

      const taskData: CreateTaskRequest = {
        project: 1,
        title: 'New Task',
        priority: 'medium',
      };

      result.current.mutate(taskData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCreate).toHaveBeenCalledWith({
        project: 1,
        title: 'New Task',
        priority: 'medium',
      });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('created'),
        })
      );
    });

    it('handles creation error', async () => {
      const error = new Error('Failed to create');
      vi.spyOn(taskAPI.taskAPI, 'create').mockRejectedValue(error);

      const mockAddNotification = vi.fn();
      vi.spyOn(notificationContext, 'useNotification').mockReturnValue({
        addNotification: mockAddNotification,
        removeNotification: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useCreateTask(1),
        { wrapper }
      );

      result.current.mutate({
        project: 1,
        title: 'New Task',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to create'),
        })
      );
    });

    it('includes project ID in request', async () => {
      const mockCreate = vi.spyOn(taskAPI.taskAPI, 'create').mockResolvedValue({
        data: mockTask,
        status: 201,
      } as any);

      const { result } = renderHook(
        () => useCreateTask(42),
        { wrapper }
      );

      result.current.mutate({
        project: 42,
        title: 'New Task',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ project: 42 })
      );
    });
  });

  describe('useUpdateTask', () => {
    it('updates task successfully', async () => {
      const mockUpdate = vi.spyOn(taskAPI.taskAPI, 'update').mockResolvedValue({
        data: { ...mockTask, status: 'done' },
        status: 200,
      } as any);

      const mockAddNotification = vi.fn();
      vi.spyOn(notificationContext, 'useNotification').mockReturnValue({
        addNotification: mockAddNotification,
        removeNotification: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useUpdateTask(),
        { wrapper }
      );

      result.current.mutate({
        id: 1,
        data: { status: 'done' },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdate).toHaveBeenCalledWith(1, { status: 'done' });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('updated'),
        })
      );
    });

    it('handles update error', async () => {
      const error = new Error('Failed to update');
      vi.spyOn(taskAPI.taskAPI, 'update').mockRejectedValue(error);

      const mockAddNotification = vi.fn();
      vi.spyOn(notificationContext, 'useNotification').mockReturnValue({
        addNotification: mockAddNotification,
        removeNotification: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useUpdateTask(),
        { wrapper }
      );

      result.current.mutate({
        id: 1,
        data: { status: 'done' },
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to update'),
        })
      );
    });
  });

  describe('useDeleteTask', () => {
    it('deletes task successfully', async () => {
      const mockDelete = vi.spyOn(taskAPI.taskAPI, 'delete').mockResolvedValue({
        status: 204,
      } as any);

      const mockAddNotification = vi.fn();
      vi.spyOn(notificationContext, 'useNotification').mockReturnValue({
        addNotification: mockAddNotification,
        removeNotification: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useDeleteTask(),
        { wrapper }
      );

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDelete).toHaveBeenCalledWith(1);

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('deleted'),
        })
      );
    });

    it('handles delete error', async () => {
      const error = new Error('Failed to delete');
      vi.spyOn(taskAPI.taskAPI, 'delete').mockRejectedValue(error);

      const mockAddNotification = vi.fn();
      vi.spyOn(notificationContext, 'useNotification').mockReturnValue({
        addNotification: mockAddNotification,
        removeNotification: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useDeleteTask(),
        { wrapper }
      );

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('Failed to delete'),
        })
      );
    });
  });

  describe('useMarkTaskComplete', () => {
    it('marks task as complete', async () => {
      const mockMarkComplete = vi.spyOn(taskAPI.taskAPI, 'markComplete').mockResolvedValue({
        data: { ...mockTask, status: 'done', progress: 100 },
        status: 200,
      } as any);

      const mockAddNotification = vi.fn();
      vi.spyOn(notificationContext, 'useNotification').mockReturnValue({
        addNotification: mockAddNotification,
        removeNotification: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useMarkTaskComplete(),
        { wrapper }
      );

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockMarkComplete).toHaveBeenCalledWith(1);

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('completed'),
        })
      );
    });
  });

  describe('useMarkTaskInProgress', () => {
    it('marks task as in progress', async () => {
      const mockMarkInProgress = vi.spyOn(taskAPI.taskAPI, 'markInProgress').mockResolvedValue({
        data: { ...mockTask, status: 'in_progress' },
        status: 200,
      } as any);

      const mockAddNotification = vi.fn();
      vi.spyOn(notificationContext, 'useNotification').mockReturnValue({
        addNotification: mockAddNotification,
        removeNotification: vi.fn(),
      } as any);

      const { result } = renderHook(
        () => useMarkTaskInProgress(),
        { wrapper }
      );

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockMarkInProgress).toHaveBeenCalledWith(1);

      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('started'),
        })
      );
    });
  });

  describe('Query Invalidation', () => {
    it('invalidates task list on create', async () => {
      const mockCreate = vi.spyOn(taskAPI.taskAPI, 'create').mockResolvedValue({
        data: mockTask,
        status: 201,
      } as any);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useCreateTask(1),
        { wrapper }
      );

      result.current.mutate({
        project: 1,
        title: 'New Task',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify queries were invalidated
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('invalidates task list on update', async () => {
      const mockUpdate = vi.spyOn(taskAPI.taskAPI, 'update').mockResolvedValue({
        data: mockTask,
        status: 200,
      } as any);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useUpdateTask(),
        { wrapper }
      );

      result.current.mutate({
        id: 1,
        data: { status: 'done' },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('invalidates task list on delete', async () => {
      const mockDelete = vi.spyOn(taskAPI.taskAPI, 'delete').mockResolvedValue({
        status: 204,
      } as any);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useDeleteTask(),
        { wrapper }
      );

      result.current.mutate(1);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });
});
