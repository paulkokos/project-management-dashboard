import { FC, useState, useMemo } from 'react';
import type { Task, TaskFilters, User } from '@/types';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
  canEdit?: boolean;
  users?: User[];
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onStatusChange?: (taskId: number, status: Task['status']) => void;
  onMarkComplete?: (taskId: number) => void;
  onFilterChange?: (filters: TaskFilters) => void;
}

type SortBy = 'created' | 'due_date' | 'priority' | 'progress' | 'status';

export const TaskList: FC<TaskListProps> = ({
  tasks,
  isLoading = false,
  canEdit = false,
  users = [],
  onEdit,
  onDelete,
  onStatusChange,
  onMarkComplete,
  onFilterChange,
}) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<Task['status'][]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'][]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    if (searchText) {
      const lowerText = searchText.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(lowerText) ||
          task.description?.toLowerCase().includes(lowerText)
      );
    }

    if (statusFilter.length > 0) {
      filtered = filtered.filter((task) => statusFilter.includes(task.status));
    }

    if (priorityFilter.length > 0) {
      filtered = filtered.filter((task) => priorityFilter.includes(task.priority));
    }

    if (assigneeFilter !== null) {
      filtered = filtered.filter((task) => task.assigned_to?.id === assigneeFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'created':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'due_date':
          if (a.due_date && b.due_date) {
            comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          } else if (a.due_date) {
            comparison = -1;
          } else if (b.due_date) {
            comparison = 1;
          }
          break;
        case 'priority': {
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }, [tasks, searchText, statusFilter, priorityFilter, assigneeFilter, sortBy, sortOrder]);

  const handleStatusFilterChange = (status: Task['status']) => {
    const newFilter = statusFilter.includes(status)
      ? statusFilter.filter((s) => s !== status)
      : [...statusFilter, status];
    setStatusFilter(newFilter);
  };

  const handlePriorityFilterChange = (priority: Task['priority']) => {
    const newFilter = priorityFilter.includes(priority)
      ? priorityFilter.filter((p) => p !== priority)
      : [...priorityFilter, priority];
    setPriorityFilter(newFilter);
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No tasks found</p>
        <p className="text-gray-400 text-sm mt-2">Create a task to get started</p>
      </div>
    );
  }

  const STATUS_OPTIONS: Task['status'][] = [
    'backlog',
    'todo',
    'in_progress',
    'in_review',
    'done',
    'cancelled',
  ];
  const PRIORITY_OPTIONS: Task['priority'][] = ['low', 'medium', 'high', 'critical'];

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        {/* Search */}
        <div>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search tasks..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  statusFilter.includes(status)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Priority</label>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((priority) => (
              <button
                key={priority}
                onClick={() => handlePriorityFilterChange(priority)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  priorityFilter.includes(priority)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        {/* Assignee and Sort */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Assignee */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Assignee</label>
            <select
              value={assigneeFilter || ''}
              onChange={(e) => setAssigneeFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All users</option>
              <option value="0">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Sort</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created">Created</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="progress">Progress</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchText || statusFilter.length > 0 || priorityFilter.length > 0 || assigneeFilter) && (
          <button
            onClick={() => {
              setSearchText('');
              setStatusFilter([]);
              setPriorityFilter([]);
              setAssigneeFilter(null);
            }}
            className="text-xs text-blue-600 hover:text-blue-700 underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Task Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            canEdit={canEdit}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            onMarkComplete={onMarkComplete}
          />
        ))}
      </div>
    </div>
  );
};

export default TaskList;
