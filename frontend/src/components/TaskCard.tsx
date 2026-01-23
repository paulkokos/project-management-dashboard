import { FC, useState } from 'react';
import type { Task } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  canEdit?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onStatusChange?: (taskId: number, status: Task['status']) => void;
  onMarkComplete?: (taskId: number) => void;
}

const STATUS_COLORS: Record<Task['status'], string> = {
  backlog: 'bg-gray-100 text-gray-700',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  in_review: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const PRIORITY_ICONS: Record<Task['priority'], string> = {
  low: '↓',
  medium: '=',
  high: '↑',
  critical: '⚠',
};

const PRIORITY_COLORS: Record<Task['priority'], string> = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

export const TaskCard: FC<TaskCardProps> = ({
  task,
  canEdit = false,
  onEdit,
  onDelete,
  onStatusChange,
  onMarkComplete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleStatusChange = (newStatus: Task['status']) => {
    onStatusChange?.(task.id, newStatus);
  };

  const getRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return date;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 flex-1 hover:text-blue-600">
              {task.title}
            </h3>
            {task.is_overdue && task.status !== 'done' && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                Overdue
              </span>
            )}
          </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_COLORS[task.status]}`}>
              {task.status.replace('_', ' ')}
            </span>
            <span className={`font-bold text-lg ${PRIORITY_COLORS[task.priority]}`} title={task.priority}>
              {PRIORITY_ICONS[task.priority]}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1" onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
          {showActions && canEdit && (
            <>
              {task.status !== 'done' && (
                <button
                  onClick={() => onMarkComplete?.(task.id)}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
                  title="Mark complete"
                >
                  ✓
                </button>
              )}
              <button
                onClick={() => onEdit?.(task)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
                title="Edit task"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this task?')) {
                    onDelete?.(task.id);
                  }
                }}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors"
                title="Delete task"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {task.progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">Progress</span>
            <span className="text-xs font-medium text-gray-700">{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Meta Info */}
      <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap mb-3">
        {task.assigned_to && (
          <div className="flex items-center gap-1">
            <span className="w-6 h-6 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
              {task.assigned_to.first_name.charAt(0)}
            </span>
            <span>{task.assigned_to.first_name}</span>
          </div>
        )}

        {task.due_date && (
          <div className={task.is_overdue && task.status !== 'done' ? 'text-red-600 font-medium' : ''}>
            Due {getRelativeTime(task.due_date)}
          </div>
        )}

        {task.estimated_hours && <div>{task.estimated_hours}h est</div>}

        {task.subtask_count > 0 && (
          <div className="bg-gray-100 px-2 py-0.5 rounded">
            {task.completed_subtask_count}/{task.subtask_count} subtasks
          </div>
        )}
      </div>

      {/* Expanded Description */}
      {expanded && task.description && (
        <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {task.description}
          </p>
        </div>
      )}

      {/* Status Quick Change */}
      {canEdit && expanded && (
        <div className="mt-3 pt-3 border-t">
          <label className="text-xs font-medium text-gray-700 block mb-2">
            Change Status
          </label>
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="backlog">Backlog</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
        Created {getRelativeTime(task.created_at)}
        {task.updated_at !== task.created_at && ` • Updated ${getRelativeTime(task.updated_at)}`}
      </div>
    </div>
  );
};

export default TaskCard;
