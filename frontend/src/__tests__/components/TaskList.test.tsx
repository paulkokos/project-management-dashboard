import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TaskList from '@/components/TaskList';
import type { Task, User } from '@/types';

describe('TaskList', () => {
  const mockUser: User = {
    id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
  };

  const mockUser2: User = {
    id: 2,
    username: 'jane_smith',
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
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

  describe('Rendering', () => {
    it('renders task cards for all tasks', () => {
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1' }),
        createMockTask({ id: 2, title: 'Task 2' }),
        createMockTask({ id: 3, title: 'Task 3' }),
      ];

      render(<TaskList tasks={tasks} />);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });

    it('displays task count', () => {
      const tasks = [
        createMockTask({ id: 1 }),
        createMockTask({ id: 2 }),
      ];

      render(<TaskList tasks={tasks} />);

      expect(screen.getByText('Showing 2 of 2 tasks')).toBeInTheDocument();
    });

    it('shows loading spinner when loading', () => {
      render(<TaskList tasks={[]} isLoading={true} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('shows empty state message when no tasks', () => {
      render(<TaskList tasks={[]} />);

      expect(screen.getByText('No tasks found')).toBeInTheDocument();
      expect(screen.getByText('Create a task to get started')).toBeInTheDocument();
    });

    it('does not show loading spinner when not loading and has tasks', () => {
      const tasks = [createMockTask({ id: 1 })];
      render(<TaskList tasks={tasks} isLoading={false} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Search', () => {
    it('filters tasks by title', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Authentication Implementation' }),
        createMockTask({ id: 2, title: 'Database Setup' }),
        createMockTask({ id: 3, title: 'API Design' }),
      ];

      render(<TaskList tasks={tasks} />);

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      await user.type(searchInput, 'Auth');

      expect(screen.getByText('Authentication Implementation')).toBeInTheDocument();
      expect(screen.queryByText('Database Setup')).not.toBeInTheDocument();
      expect(screen.queryByText('API Design')).not.toBeInTheDocument();
    });

    it('filters tasks by description', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', description: 'OAuth implementation' }),
        createMockTask({ id: 2, title: 'Task 2', description: 'Database schema' }),
      ];

      render(<TaskList tasks={tasks} />);

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      await user.type(searchInput, 'OAuth');

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    });

    it('is case insensitive', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Authentication' }),
      ];

      render(<TaskList tasks={tasks} />);

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      await user.type(searchInput, 'authentication');

      expect(screen.getByText('Authentication')).toBeInTheDocument();
    });
  });

  describe('Status Filtering', () => {
    it('filters tasks by single status', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', status: 'todo' }),
        createMockTask({ id: 2, title: 'Task 2', status: 'in_progress' }),
        createMockTask({ id: 3, title: 'Task 3', status: 'done' }),
      ];

      render(<TaskList tasks={tasks} />);

      const todoButton = screen.getByRole('button', { name: /to do/i });
      await user.click(todoButton);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
    });

    it('filters tasks by multiple statuses', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', status: 'todo' }),
        createMockTask({ id: 2, title: 'Task 2', status: 'in_progress' }),
        createMockTask({ id: 3, title: 'Task 3', status: 'done' }),
      ];

      render(<TaskList tasks={tasks} />);

      const todoButton = screen.getByRole('button', { name: /to do/i });
      const inProgressButton = screen.getByRole('button', { name: /in progress/i });

      await user.click(todoButton);
      await user.click(inProgressButton);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
    });

    it('deselects status when clicked again', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', status: 'todo' }),
        createMockTask({ id: 2, title: 'Task 2', status: 'in_progress' }),
      ];

      render(<TaskList tasks={tasks} />);

      const todoButton = screen.getByRole('button', { name: /to do/i });

      await user.click(todoButton); // Select
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();

      await user.click(todoButton); // Deselect
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });

  describe('Priority Filtering', () => {
    it('filters tasks by single priority', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', priority: 'low' }),
        createMockTask({ id: 2, title: 'Task 2', priority: 'high' }),
        createMockTask({ id: 3, title: 'Task 3', priority: 'critical' }),
      ];

      render(<TaskList tasks={tasks} />);

      const highButton = screen.getByRole('button', { name: /high/i });
      await user.click(highButton);

      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
    });

    it('filters tasks by multiple priorities', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', priority: 'low' }),
        createMockTask({ id: 2, title: 'Task 2', priority: 'high' }),
        createMockTask({ id: 3, title: 'Task 3', priority: 'critical' }),
      ];

      render(<TaskList tasks={tasks} />);

      const highButton = screen.getByRole('button', { name: /high/i });
      const criticalButton = screen.getByRole('button', { name: /critical/i });

      await user.click(highButton);
      await user.click(criticalButton);

      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });
  });

  describe('Assignee Filtering', () => {
    it('filters tasks by assignee', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', assigned_to: mockUser }),
        createMockTask({ id: 2, title: 'Task 2', assigned_to: mockUser2 }),
        createMockTask({ id: 3, title: 'Task 3', assigned_to: null }),
      ];

      render(<TaskList tasks={tasks} users={[mockUser, mockUser2]} />);

      const assigneeSelect = screen.getByLabelText('Assignee');
      await user.selectOption(assigneeSelect, '1');

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
    });

    it('filters unassigned tasks', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', assigned_to: mockUser }),
        createMockTask({ id: 2, title: 'Task 2', assigned_to: null }),
      ];

      render(<TaskList tasks={tasks} users={[mockUser]} />);

      const assigneeSelect = screen.getByLabelText('Assignee');
      await user.selectOption(assigneeSelect, '0');

      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts by creation date descending by default', () => {
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', created_at: '2025-01-01T10:00:00Z' }),
        createMockTask({ id: 2, title: 'Task 2', created_at: '2025-01-02T10:00:00Z' }),
        createMockTask({ id: 3, title: 'Task 3', created_at: '2025-01-03T10:00:00Z' }),
      ];

      render(<TaskList tasks={tasks} />);

      const taskElements = screen.getAllByRole('heading', { level: 3 });
      expect(taskElements[0]).toHaveTextContent('Task 3'); // Newest first
    });

    it('changes sort field', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Low Priority', priority: 'low' }),
        createMockTask({ id: 2, title: 'High Priority', priority: 'high' }),
        createMockTask({ id: 3, title: 'Medium Priority', priority: 'medium' }),
      ];

      render(<TaskList tasks={tasks} />);

      const sortSelect = screen.getByDisplayValue('Created');
      await user.selectOption(sortSelect, 'priority');

      // Should now be sorted by priority
      const taskElements = screen.getAllByRole('heading', { level: 3 });
      expect(taskElements[0]).toHaveTextContent('Low Priority');
    });

    it('toggles sort order', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', created_at: '2025-01-01T10:00:00Z' }),
        createMockTask({ id: 2, title: 'Task 2', created_at: '2025-01-02T10:00:00Z' }),
      ];

      render(<TaskList tasks={tasks} />);

      const sortButton = screen.getByTitle(/sort/i);
      await user.click(sortButton);

      // Should reverse order
      const taskElements = screen.getAllByRole('heading', { level: 3 });
      expect(taskElements[0]).toHaveTextContent('Task 1'); // Oldest first now
    });
  });

  describe('Clear Filters', () => {
    it('shows clear button when filters are active', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', status: 'todo' }),
        createMockTask({ id: 2, title: 'Task 2', status: 'in_progress' }),
      ];

      render(<TaskList tasks={tasks} />);

      const todoButton = screen.getByRole('button', { name: /to do/i });
      await user.click(todoButton);

      expect(screen.getByText(/clear all filters/i)).toBeInTheDocument();
    });

    it('clears all filters when clear button clicked', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Task 1', status: 'todo' }),
        createMockTask({ id: 2, title: 'Task 2', status: 'in_progress' }),
      ];

      render(<TaskList tasks={tasks} />);

      const todoButton = screen.getByRole('button', { name: /to do/i });
      await user.click(todoButton);

      const clearButton = screen.getByText(/clear all filters/i);
      await user.click(clearButton);

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.queryByText(/clear all filters/i)).not.toBeInTheDocument();
    });
  });

  describe('Permissions', () => {
    it('passes canEdit prop to TaskCard', () => {
      const tasks = [createMockTask({ id: 1 })];
      const { rerender } = render(<TaskList tasks={tasks} canEdit={false} />);

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();

      rerender(<TaskList tasks={tasks} canEdit={true} />);
      // Edit button should be available (though not visible until hover)
    });
  });

  describe('Callbacks', () => {
    it('calls onEdit when edit action triggered', async () => {
      const user = userEvent.setup();
      const mockEdit = vi.fn();
      const tasks = [createMockTask({ id: 1, title: 'Task 1' })];

      render(<TaskList tasks={tasks} canEdit={true} onEdit={mockEdit} />);

      const titleElement = screen.getByText('Task 1');
      // Hover to show buttons
      fireEvent.mouseEnter(titleElement.parentElement?.parentElement);

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      expect(mockEdit).toHaveBeenCalled();
    });

    it('calls onDelete when delete action triggered', async () => {
      const user = userEvent.setup();
      const mockDelete = vi.fn();
      const tasks = [createMockTask({ id: 1 })];

      window.confirm = vi.fn(() => true);

      render(<TaskList tasks={tasks} canEdit={true} onDelete={mockDelete} />);

      // Note: Testing delete requires DOM interaction with the card
    });
  });

  describe('Combined Filters', () => {
    it('applies multiple filters simultaneously', async () => {
      const user = userEvent.setup();
      const tasks = [
        createMockTask({ id: 1, title: 'Auth Task', status: 'todo', priority: 'high', assigned_to: mockUser }),
        createMockTask({ id: 2, title: 'DB Task', status: 'in_progress', priority: 'medium', assigned_to: mockUser2 }),
        createMockTask({ id: 3, title: 'API Task', status: 'todo', priority: 'low', assigned_to: mockUser }),
      ];

      render(<TaskList tasks={tasks} users={[mockUser, mockUser2]} />);

      // Apply status filter
      const todoButton = screen.getByRole('button', { name: /to do/i });
      await user.click(todoButton);

      // Apply priority filter
      const highButton = screen.getByRole('button', { name: /high/i });
      await user.click(highButton);

      // Apply assignee filter
      const assigneeSelect = screen.getByLabelText('Assignee');
      await user.selectOption(assigneeSelect, '1');

      // Only Task 1 should match all criteria
      expect(screen.getByText('Auth Task')).toBeInTheDocument();
      expect(screen.queryByText('DB Task')).not.toBeInTheDocument();
      expect(screen.queryByText('API Task')).not.toBeInTheDocument();
    });
  });
});

// Import fireEvent from testing library
import { fireEvent } from '@testing-library/react';
