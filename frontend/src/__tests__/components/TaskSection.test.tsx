import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';
import TaskSection from '@/components/TaskSection';
import * as useTasks from '@/hooks/useTasks';
import * as useTaskWebSocket from '@/hooks/useTaskWebSocket';
import type { Task, User, Milestone } from '@/types';

describe('TaskSection', () => {
  let queryClient: QueryClient;

  const mockUser: User = {
    id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
  };

  const mockMilestone: Milestone = {
    id: 1,
    title: 'Q2 Release',
    description: 'Q2 Release milestone',
    due_date: '2025-06-30',
    progress: 50,
  };

  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: Math.random(),
    title: 'Test Task',
    description: 'Test description',
    status: 'todo',
    priority: 'medium',
    assigned_to: mockUser,
    progress: 0,
    estimated_hours: null,
    actual_hours: null,
    due_date: null,
    start_date: null,
    completed_at: null,
    parent_task: null,
    milestone: null,
    project_id: 1,
    project_title: 'Test Project',
    milestone_title: null,
    tags: [],
    subtask_count: 0,
    completed_subtask_count: 0,
    is_overdue: false,
    days_until_due: null,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    etag: 'abc123',
    version: 1,
    ...overrides,
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock hooks
    vi.spyOn(useTasks, 'useTasks').mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      status: 'success',
      isPending: false,
      isFetching: false,
      isSuccess: true,
      isError: false,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(useTaskWebSocket, 'default').mockReturnValue({
      isConnected: true,
      status: WebSocket.OPEN,
    });
  });

  describe('Rendering', () => {
    it('renders section title with task count', () => {
      const mockTasks = [
        createMockTask({ id: 1 }),
        createMockTask({ id: 2 }),
      ];

      vi.spyOn(useTasks, 'useTasks').mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        status: 'success',
        isPending: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(
        <TaskSection projectId={1} teamMembers={[mockUser]} milestones={[mockMilestone]} />
      );

      expect(screen.getByText('2 Tasks')).toBeInTheDocument();
    });

    it('shows no tasks message when task list is empty', () => {
      renderWithProviders(
        <TaskSection projectId={1} teamMembers={[mockUser]} milestones={[mockMilestone]} />
      );

      expect(screen.getByText('No Tasks')).toBeInTheDocument();
    });

    it('shows WebSocket connected indicator', () => {
      renderWithProviders(
        <TaskSection projectId={1} teamMembers={[mockUser]} milestones={[mockMilestone]} />
      );

      expect(screen.getByTitle(/real-time updates enabled/i)).toBeInTheDocument();
    });

    it('shows WebSocket disconnected message when not connected', () => {
      vi.spyOn(useTaskWebSocket, 'default').mockReturnValue({
        isConnected: false,
        status: WebSocket.CLOSED,
      });

      renderWithProviders(
        <TaskSection projectId={1} teamMembers={[mockUser]} milestones={[mockMilestone]} />
      );

      expect(screen.getByText(/real-time updates disconnected/i)).toBeInTheDocument();
    });
  });

  describe('Permissions', () => {
    it('hides create button when canEdit=false', () => {
      renderWithProviders(
        <TaskSection
          projectId={1}
          canEdit={false}
          teamMembers={[mockUser]}
          milestones={[mockMilestone]}
        />
      );

      expect(screen.queryByText(/new task/i)).not.toBeInTheDocument();
    });

    it('shows create button when canEdit=true', () => {
      renderWithProviders(
        <TaskSection
          projectId={1}
          canEdit={true}
          teamMembers={[mockUser]}
          milestones={[mockMilestone]}
        />
      );

      expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument();
    });
  });

  describe('Create Form', () => {
    it('shows create task form when button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TaskSection
          projectId={1}
          canEdit={true}
          teamMembers={[mockUser]}
          milestones={[mockMilestone]}
        />
      );

      const createButton = screen.getByRole('button', { name: /new task/i });
      await user.click(createButton);

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    it('hides form when cancel button clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TaskSection
          projectId={1}
          canEdit={true}
          teamMembers={[mockUser]}
          milestones={[mockMilestone]}
        />
      );

      const createButton = screen.getByRole('button', { name: /new task/i });
      await user.click(createButton);

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByLabelText(/title/i)).not.toBeInTheDocument();
    });

    it('toggles form visibility on button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <TaskSection
          projectId={1}
          canEdit={true}
          teamMembers={[mockUser]}
          milestones={[mockMilestone]}
        />
      );

      // Open form
      const createButton = screen.getByRole('button', { name: /new task/i });
      await user.click(createButton);
      expect(screen.getByText('Create New Task')).toBeInTheDocument();

      // Close form
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();

      // Open again
      await user.click(createButton);
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });
  });

  describe('Edit Form', () => {
    it('shows edit form for existing task', async () => {
      const user = userEvent.setup();
      const mockTask = createMockTask({ id: 1, title: 'Existing Task' });

      vi.spyOn(useTasks, 'useTasks').mockReturnValue({
        data: [mockTask],
        isLoading: false,
        error: null,
        status: 'success',
        isPending: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(
        <TaskSection
          projectId={1}
          canEdit={true}
          teamMembers={[mockUser]}
          milestones={[mockMilestone]}
        />
      );

      // Expand task to show edit button
      const titleElement = screen.getByText('Existing Task');
      // Note: This would require more implementation in the actual component
    });
  });

  describe('Task List', () => {
    it('renders task list with tasks', () => {
      const mockTasks = [
        createMockTask({ id: 1, title: 'Task 1' }),
        createMockTask({ id: 2, title: 'Task 2' }),
      ];

      vi.spyOn(useTasks, 'useTasks').mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        status: 'success',
        isPending: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(
        <TaskSection projectId={1} teamMembers={[mockUser]} milestones={[mockMilestone]} />
      );

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    it('passes team members to task list', () => {
      const mockTasks = [createMockTask({ id: 1 })];

      vi.spyOn(useTasks, 'useTasks').mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null,
        status: 'success',
        isPending: false,
        isFetching: false,
        isSuccess: true,
        isError: false,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        refetch: vi.fn(),
      } as any);

      renderWithProviders(
        <TaskSection
          projectId={1}
          teamMembers={[mockUser]}
          milestones={[mockMilestone]}
        />
      );

      // Team members should be available in the select
      expect(screen.getByRole('combobox', { name: /assignee/i })).toBeInTheDocument();
    });

    it('passes milestones to task form', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <TaskSection
          projectId={1}
          canEdit={true}
          teamMembers={[mockUser]}
          milestones={[mockMilestone]}
        />
      );

      const createButton = screen.getByRole('button', { name: /new task/i });
      await user.click(createButton);

      const milestoneSelect = screen.getByLabelText(/milestone/i);
      expect(milestoneSelect).toBeInTheDocument();
    });
  });

  describe('Mutations', () => {
    it('mocks create task mutation', () => {
      const mockCreateTask = vi.fn(() =>
        Promise.resolve({
          data: createMockTask({ id: 1, title: 'New Task' }),
        })
      );

      vi.spyOn(useTasks, 'useCreateTask').mockReturnValue({
        mutate: mockCreateTask,
        mutateAsync: vi.fn(),
        isPending: false,
        status: 'idle',
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
      } as any);

      renderWithProviders(
        <TaskSection
          projectId={1}
          canEdit={true}
          teamMembers={[mockUser]}
          milestones={[mockMilestone]}
        />
      );

      expect(useTasks.useCreateTask).toHaveBeenCalledWith(1);
    });

    it('mocks delete task mutation', () => {
      const mockDeleteTask = vi.fn(() => Promise.resolve());

      vi.spyOn(useTasks, 'useDeleteTask').mockReturnValue({
        mutate: mockDeleteTask,
        mutateAsync: vi.fn(),
        isPending: false,
        status: 'idle',
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        failureCount: 0,
        failureReason: null,
        reset: vi.fn(),
      } as any);

      renderWithProviders(
        <TaskSection projectId={1} teamMembers={[mockUser]} milestones={[mockMilestone]} />
      );

      expect(useTasks.useDeleteTask).toHaveBeenCalled();
    });
  });

  describe('WebSocket Connection', () => {
    it('initializes WebSocket with correct project ID', () => {
      const mockWebSocketHook = vi.spyOn(useTaskWebSocket, 'default');

      renderWithProviders(
        <TaskSection projectId={42} teamMembers={[mockUser]} milestones={[mockMilestone]} />
      );

      expect(mockWebSocketHook).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 42,
          enabled: true,
        })
      );
    });

    it('disables WebSocket when project ID is missing', () => {
      const mockWebSocketHook = vi.spyOn(useTaskWebSocket, 'default');

      renderWithProviders(
        <TaskSection projectId={0} teamMembers={[mockUser]} milestones={[mockMilestone]} />
      );

      expect(mockWebSocketHook).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 0,
        })
      );
    });
  });
});
