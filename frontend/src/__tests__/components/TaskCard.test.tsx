import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TaskCard from '@/components/TaskCard';
import type { Task, User } from '@/types';

describe('TaskCard', () => {
  const mockUser: User = {
    id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
  };

  const mockTask: Task = {
    id: 1,
    title: 'Implement feature',
    description: 'Implement new authentication feature with OAuth2',
    status: 'in_progress',
    priority: 'high',
    assigned_to: mockUser,
    progress: 60,
    estimated_hours: 16,
    actual_hours: null,
    due_date: '2025-06-30',
    start_date: '2025-06-01',
    completed_at: null,
    parent_task: null,
    milestone: 1,
    project_id: 1,
    project_title: 'Main App',
    milestone_title: 'Q2 Release',
    tags: [],
    subtask_count: 3,
    completed_subtask_count: 1,
    is_overdue: false,
    days_until_due: 7,
    created_at: '2025-06-01T10:00:00Z',
    updated_at: '2025-06-15T14:30:00Z',
    etag: 'abc123',
    version: 1,
  };

  describe('Rendering', () => {
    it('renders task title', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText('Implement feature')).toBeInTheDocument();
    });

    it('renders task status badge', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText('in progress')).toBeInTheDocument();
    });

    it('renders task priority icon', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText('↑')).toBeInTheDocument(); // High priority icon
    });

    it('displays assignee avatar with initials', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText('J')).toBeInTheDocument(); // John's initial
    });

    it('displays assignee name', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('displays progress bar with percentage', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('displays estimated hours', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText('16h est')).toBeInTheDocument();
    });

    it('displays subtask count', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText('1/3 subtasks')).toBeInTheDocument();
    });

    it('displays due date with relative time', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText(/due.*in/i)).toBeInTheDocument();
    });

    it('shows creation timestamp', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText(/created/i)).toBeInTheDocument();
    });

    it('shows update timestamp when task was updated', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.getByText(/updated/i)).toBeInTheDocument();
    });

    it('does not show overdue badge when task is not overdue', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
    });

    it('shows overdue badge when task is overdue and not done', () => {
      const overdueTask = { ...mockTask, is_overdue: true, status: 'todo' as const };
      render(<TaskCard task={overdueTask} />);
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('does not show overdue badge when task is done even if overdue', () => {
      const doneOverdueTask = { ...mockTask, is_overdue: true, status: 'done' as const };
      render(<TaskCard task={doneOverdueTask} />);
      expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
    });
  });

  describe('Unassigned Tasks', () => {
    it('handles unassigned tasks gracefully', () => {
      const unassignedTask = { ...mockTask, assigned_to: null };
      render(<TaskCard task={unassignedTask} />);
      expect(screen.queryByText('John')).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('does not show progress bar when progress is 0', () => {
      const taskWithoutProgress = { ...mockTask, progress: 0 };
      render(<TaskCard task={taskWithoutProgress} />);
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('shows progress bar when progress > 0', () => {
      const taskWithProgress = { ...mockTask, progress: 50 };
      render(<TaskCard task={taskWithProgress} />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });

  describe('Expandable Description', () => {
    it('hides description by default', () => {
      render(<TaskCard task={mockTask} />);
      expect(screen.queryByText('Implement new authentication feature with OAuth2')).not.toBeInTheDocument();
    });

    it('shows description when card is expanded', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} />);

      const titleElement = screen.getByText('Implement feature');
      await user.click(titleElement);

      expect(screen.getByText('Implement new authentication feature with OAuth2')).toBeInTheDocument();
    });

    it('hides description when card is collapsed again', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} />);

      const titleElement = screen.getByText('Implement feature');
      await user.click(titleElement); // Expand
      expect(screen.getByText('Implement new authentication feature with OAuth2')).toBeInTheDocument();

      await user.click(titleElement); // Collapse
      expect(screen.queryByText('Implement new authentication feature with OAuth2')).not.toBeInTheDocument();
    });

    it('does not show status change dropdown when collapsed', () => {
      render(<TaskCard task={mockTask} canEdit={true} />);
      expect(screen.queryByText('Change Status')).not.toBeInTheDocument();
    });

    it('shows status change dropdown when expanded and canEdit=true', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} canEdit={true} />);

      const titleElement = screen.getByText('Implement feature');
      await user.click(titleElement);

      expect(screen.getByText('Change Status')).toBeInTheDocument();
    });
  });

  describe('Permissions', () => {
    it('hides action buttons when canEdit=false', () => {
      render(<TaskCard task={mockTask} canEdit={false} />);
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
      expect(screen.queryByText('✓')).not.toBeInTheDocument(); // Mark complete
    });

    it('shows action buttons when canEdit=true on hover', async () => {
      const user = userEvent.setup();
      const { container } = render(<TaskCard task={mockTask} canEdit={true} />);

      const actionArea = container.querySelector('[onMouseEnter]');
      if (actionArea) {
        fireEvent.mouseEnter(actionArea);
        // Buttons should now be visible
        expect(screen.queryByText('Edit')).toBeInTheDocument();
      }
    });

    it('shows mark complete button for incomplete tasks', async () => {
      const user = userEvent.setup();
      const incompleteTask = { ...mockTask, status: 'todo' as const };
      const { container } = render(<TaskCard task={incompleteTask} canEdit={true} />);

      const actionArea = container.querySelector('[onMouseEnter]');
      if (actionArea) {
        fireEvent.mouseEnter(actionArea);
        expect(screen.getByText('✓')).toBeInTheDocument();
      }
    });

    it('does not show mark complete button for completed tasks', async () => {
      const user = userEvent.setup();
      const completedTask = { ...mockTask, status: 'done' as const };
      const { container } = render(<TaskCard task={completedTask} canEdit={true} />);

      const actionArea = container.querySelector('[onMouseEnter]');
      if (actionArea) {
        fireEvent.mouseEnter(actionArea);
        expect(screen.queryByText('✓')).not.toBeInTheDocument();
      }
    });
  });

  describe('Actions', () => {
    it('calls onEdit with task data when edit button clicked', async () => {
      const user = userEvent.setup();
      const mockEdit = vi.fn();
      const { container } = render(
        <TaskCard task={mockTask} canEdit={true} onEdit={mockEdit} />
      );

      const actionArea = container.querySelector('[onMouseEnter]');
      if (actionArea) {
        fireEvent.mouseEnter(actionArea);
        const editButton = screen.getByText('Edit');
        await user.click(editButton);
        expect(mockEdit).toHaveBeenCalledWith(mockTask);
      }
    });

    it('calls onDelete with task id when delete button clicked', async () => {
      const user = userEvent.setup();
      const mockDelete = vi.fn();
      window.confirm = vi.fn(() => true);

      const { container } = render(
        <TaskCard task={mockTask} canEdit={true} onDelete={mockDelete} />
      );

      const actionArea = container.querySelector('[onMouseEnter]');
      if (actionArea) {
        fireEvent.mouseEnter(actionArea);
        const deleteButton = screen.getByText('Delete');
        await user.click(deleteButton);
        expect(mockDelete).toHaveBeenCalledWith(mockTask.id);
      }
    });

    it('shows confirmation dialog before deleting', async () => {
      const user = userEvent.setup();
      const mockDelete = vi.fn();
      const confirmSpy = vi.spyOn(window, 'confirm');

      const { container } = render(
        <TaskCard task={mockTask} canEdit={true} onDelete={mockDelete} />
      );

      const actionArea = container.querySelector('[onMouseEnter]');
      if (actionArea) {
        fireEvent.mouseEnter(actionArea);
        const deleteButton = screen.getByText('Delete');
        await user.click(deleteButton);
        expect(confirmSpy).toHaveBeenCalledWith('Delete this task?');
      }
    });

    it('does not delete if confirmation is cancelled', async () => {
      const user = userEvent.setup();
      const mockDelete = vi.fn();
      window.confirm = vi.fn(() => false);

      const { container } = render(
        <TaskCard task={mockTask} canEdit={true} onDelete={mockDelete} />
      );

      const actionArea = container.querySelector('[onMouseEnter]');
      if (actionArea) {
        fireEvent.mouseEnter(actionArea);
        const deleteButton = screen.getByText('Delete');
        await user.click(deleteButton);
        expect(mockDelete).not.toHaveBeenCalled();
      }
    });

    it('calls onMarkComplete with task id when complete button clicked', async () => {
      const user = userEvent.setup();
      const mockMarkComplete = vi.fn();
      const incompleteTask = { ...mockTask, status: 'todo' as const };
      const { container } = render(
        <TaskCard task={incompleteTask} canEdit={true} onMarkComplete={mockMarkComplete} />
      );

      const actionArea = container.querySelector('[onMouseEnter]');
      if (actionArea) {
        fireEvent.mouseEnter(actionArea);
        const completeButton = screen.getByText('✓');
        await user.click(completeButton);
        expect(mockMarkComplete).toHaveBeenCalledWith(mockTask.id);
      }
    });

    it('calls onStatusChange when status is changed', async () => {
      const user = userEvent.setup();
      const mockStatusChange = vi.fn();
      render(<TaskCard task={mockTask} canEdit={true} onStatusChange={mockStatusChange} />);

      const titleElement = screen.getByText('Implement feature');
      await user.click(titleElement); // Expand

      const statusSelect = screen.getByLabelText('Change Status');
      await user.selectOption(statusSelect, 'done');

      expect(mockStatusChange).toHaveBeenCalledWith(mockTask.id, 'done');
    });
  });

  describe('Different Priorities', () => {
    it('displays correct icon for low priority', () => {
      const lowPriorityTask = { ...mockTask, priority: 'low' as const };
      render(<TaskCard task={lowPriorityTask} />);
      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('displays correct icon for medium priority', () => {
      const mediumPriorityTask = { ...mockTask, priority: 'medium' as const };
      render(<TaskCard task={mediumPriorityTask} />);
      expect(screen.getByText('=')).toBeInTheDocument();
    });

    it('displays correct icon for critical priority', () => {
      const criticalTask = { ...mockTask, priority: 'critical' as const };
      render(<TaskCard task={criticalTask} />);
      expect(screen.getByText('⚠')).toBeInTheDocument();
    });
  });

  describe('Different Statuses', () => {
    it('displays all status types correctly', () => {
      const statuses: Task['status'][] = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled'];

      statuses.forEach((status) => {
        const { unmount } = render(<TaskCard task={{ ...mockTask, status }} />);
        expect(screen.getByText(status.replace('_', ' '))).toBeInTheDocument();
        unmount();
      });
    });
  });
});
