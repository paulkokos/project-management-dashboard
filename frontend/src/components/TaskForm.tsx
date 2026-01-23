import { FC, useState, useEffect } from 'react';
import type { Task, User, Milestone } from '@/types';

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  initialData?: Partial<Task>;
  projectId: number;
  users?: User[];
  milestones?: Milestone[];
  mode?: 'create' | 'edit';
}

export interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  assigned_to_id: number | null;
  progress: number;
  estimated_hours: number | null;
  due_date: string | null;
  start_date: string | null;
  milestone: number | null;
}

const STATUS_OPTIONS: { value: Task['status']; label: string; color: string }[] = [
  { value: 'backlog', label: 'Backlog', color: 'bg-gray-100 text-gray-700' },
  { value: 'todo', label: 'To Do', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_review', label: 'In Review', color: 'bg-purple-100 text-purple-700' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
];

const PRIORITY_OPTIONS: { value: Task['priority']; label: string; icon: string }[] = [
  { value: 'low', label: 'Low', icon: '↓' },
  { value: 'medium', label: 'Medium', icon: '=' },
  { value: 'high', label: 'High', icon: '↑' },
  { value: 'critical', label: 'Critical', icon: '⚠' },
];

export const TaskForm: FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
  projectId,
  users = [],
  milestones = [],
  mode = 'create',
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'todo',
    priority: initialData?.priority || 'medium',
    assigned_to_id: initialData?.assigned_to?.id || null,
    progress: initialData?.progress || 0,
    estimated_hours: initialData?.estimated_hours || null,
    due_date: initialData?.due_date || null,
    start_date: initialData?.start_date || null,
    milestone: initialData?.milestone || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'todo',
        priority: initialData.priority || 'medium',
        assigned_to_id: initialData.assigned_to?.id || null,
        progress: initialData.progress || 0,
        estimated_hours: initialData.estimated_hours || null,
        due_date: initialData.due_date || null,
        start_date: initialData.start_date || null,
        milestone: initialData.milestone || null,
      });
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title cannot exceed 255 characters';
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Progress must be between 0 and 100';
    }

    if (formData.estimated_hours !== null && formData.estimated_hours < 0) {
      newErrors.estimated_hours = 'Estimated hours cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof TaskFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="Task title"
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          maxLength={255}
        />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        <div className="text-xs text-gray-500 mt-1">{formData.title.length}/255</div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe the task..."
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      {/* Status and Priority Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value as Task['status'])}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => handleChange('priority', e.target.value as Task['priority'])}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignee and Milestone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assignee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign To
          </label>
          <select
            value={formData.assigned_to_id || ''}
            onChange={(e) =>
              handleChange('assigned_to_id', e.target.value ? parseInt(e.target.value) : null)
            }
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name} ({user.username})
              </option>
            ))}
          </select>
        </div>

        {/* Milestone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Milestone
          </label>
          <select
            value={formData.milestone || ''}
            onChange={(e) =>
              handleChange('milestone', e.target.value ? parseInt(e.target.value) : null)
            }
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No milestone</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={formData.start_date || ''}
            onChange={(e) => handleChange('start_date', e.target.value || null)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Due Date
          </label>
          <input
            type="date"
            value={formData.due_date || ''}
            onChange={(e) => handleChange('due_date', e.target.value || null)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Progress and Estimated Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Progress */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Progress ({formData.progress}%)
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => handleChange('progress', parseInt(e.target.value))}
            disabled={isLoading}
            className="w-full"
          />
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${formData.progress}%` }}
            />
          </div>
        </div>

        {/* Estimated Hours */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Hours
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={formData.estimated_hours || ''}
            onChange={(e) =>
              handleChange('estimated_hours', e.target.value ? parseFloat(e.target.value) : null)
            }
            placeholder="Hours"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.estimated_hours ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.estimated_hours && (
            <p className="text-xs text-red-600 mt-1">{errors.estimated_hours}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !formData.title.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{mode === 'create' ? 'Creating...' : 'Saving...'}</span>
            </>
          ) : mode === 'create' ? (
            'Create Task'
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
