import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TaskForm from '@/components/TaskForm';
import type { Task, User, Milestone } from '@/types';

describe('TaskForm', () => {
  const mockUsers: User[] = [
    {
      id: 1,
      username: 'user1',
      email: 'user1@example.com',
      first_name: 'John',
      last_name: 'Doe',
    },
    {
      id: 2,
      username: 'user2',
      email: 'user2@example.com',
      first_name: 'Jane',
      last_name: 'Smith',
    },
  ];

  const mockMilestones: Milestone[] = [
    {
      id: 1,
      title: 'Milestone 1',
      description: 'First milestone',
      due_date: '2025-12-31',
      progress: 50,
    },
    {
      id: 2,
      title: 'Milestone 2',
      description: 'Second milestone',
      due_date: '2026-12-31',
      progress: 0,
    },
  ];

  const mockTask: Partial<Task> = {
    id: 1,
    title: 'Test Task',
    description: 'This is a test task',
    status: 'todo',
    priority: 'high',
    assigned_to: mockUsers[0],
    progress: 50,
    estimated_hours: 8,
    due_date: '2025-06-30',
    start_date: '2025-06-01',
    milestone: 1,
  };

  describe('Rendering', () => {
    it('renders form with all fields', () => {
      const mockSubmit = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
          mode="create"
        />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/assign to/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/milestone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/progress/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/estimated hours/i)).toBeInTheDocument();
    });

    it('renders create mode button', () => {
      const mockSubmit = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
          mode="create"
        />
      );

      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });

    it('renders edit mode button', () => {
      const mockSubmit = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
          mode="edit"
          initialData={mockTask}
        />
      );

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('renders cancel button when onCancel provided', () => {
      const mockSubmit = vi.fn();
      const mockCancel = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          onCancel={mockCancel}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('populates form with initial data in edit mode', () => {
      const mockSubmit = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
          mode="edit"
          initialData={mockTask}
        />
      );

      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('This is a test task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('high')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-06-30')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error when title is empty', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('shows error when title exceeds max length', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'a'.repeat(256));
      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.getByText(/title cannot exceed 255 characters/i)).toBeInTheDocument();
    });

    it('shows error when progress is out of range', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const progressInput = screen.getByLabelText(/progress/i);
      await user.clear(progressInput);
      await user.type(progressInput, '150');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.getByText(/progress must be between 0 and 100/i)).toBeInTheDocument();
    });

    it('shows error when estimated hours is negative', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const hoursInput = screen.getByLabelText(/estimated hours/i);
      await user.type(hoursInput, '-5');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.getByText(/estimated hours cannot be negative/i)).toBeInTheDocument();
    });

    it('clears error when user corrects invalid field', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /create task/i });

      // Try to submit with empty title
      await user.click(submitButton);
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();

      // Fix the error
      await user.type(titleInput, 'Valid Title');
      expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      await user.type(screen.getByLabelText(/title/i), 'New Task');
      await user.type(screen.getByLabelText(/description/i), 'Task description');
      await user.selectOption(screen.getByLabelText(/status/i), 'todo');
      await user.selectOption(screen.getByLabelText(/priority/i), 'high');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          description: 'Task description',
          status: 'todo',
          priority: 'high',
        })
      );
    });

    it('disables submit button while loading', () => {
      const mockSubmit = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
          isLoading={true}
        />
      );

      const submitButton = screen.getByRole('button', { name: /creating/i });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button when title is empty', () => {
      const mockSubmit = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create task/i });
      expect(submitButton).toBeDisabled();
    });

    it('calls onCancel when cancel button clicked', async () => {
      const mockSubmit = vi.fn();
      const mockCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          onCancel={mockCancel}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockCancel).toHaveBeenCalled();
    });
  });

  describe('Field Interactions', () => {
    it('updates progress slider and displays value', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const progressInput = screen.getByLabelText(/progress/i);
      await user.clear(progressInput);
      await user.type(progressInput, '75');

      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });

    it('displays character counter for title', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Hello World');

      expect(screen.getByText(/11\/255/i)).toBeInTheDocument();
    });

    it('allows user assignment', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const assignSelect = screen.getByLabelText(/assign to/i);
      await user.selectOption(assignSelect, '1');

      expect(assignSelect).toHaveValue('1');
    });

    it('allows milestone selection', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const milestoneSelect = screen.getByLabelText(/milestone/i);
      await user.selectOption(milestoneSelect, '1');

      expect(milestoneSelect).toHaveValue('1');
    });

    it('handles date inputs', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const startDateInput = screen.getByLabelText(/start date/i);
      const dueDateInput = screen.getByLabelText(/due date/i);

      await user.type(startDateInput, '2025-06-01');
      await user.type(dueDateInput, '2025-06-30');

      expect(startDateInput).toHaveValue('2025-06-01');
      expect(dueDateInput).toHaveValue('2025-06-30');
    });

    it('handles status changes', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOption(statusSelect, 'in_progress');

      expect(statusSelect).toHaveValue('in_progress');
    });

    it('handles priority changes', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOption(prioritySelect, 'critical');

      expect(prioritySelect).toHaveValue('critical');
    });
  });

  describe('Edit Mode Specific', () => {
    it('shows saving state in edit mode', () => {
      const mockSubmit = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
          mode="edit"
          initialData={mockTask}
          isLoading={true}
        />
      );

      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
    });

    it('updates form when initialData changes', () => {
      const mockSubmit = vi.fn();
      const { rerender } = render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
          mode="edit"
          initialData={mockTask}
        />
      );

      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();

      const updatedTask = { ...mockTask, title: 'Updated Task' };
      rerender(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
          mode="edit"
          initialData={updatedTask}
        />
      );

      expect(screen.getByDisplayValue('Updated Task')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('form fields have associated labels', () => {
      const mockSubmit = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('marks required fields', () => {
      const mockSubmit = vi.fn();
      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const titleLabel = screen.getByText(/title/i);
      expect(titleLabel.parentElement).toHaveTextContent('*');
    });

    it('displays error messages for validation', async () => {
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      render(
        <TaskForm
          onSubmit={mockSubmit}
          projectId={1}
          users={mockUsers}
          milestones={mockMilestones}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });
});
