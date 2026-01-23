import { FC, useState } from 'react';
import type { Task, TaskFilters, User, Milestone } from '@/types';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useMarkTaskComplete,
} from '@/hooks/useTasks';
import useTaskWebSocket from '@/hooks/useTaskWebSocket';
import TaskForm, { TaskFormData } from './TaskForm';
import TaskList from './TaskList';

interface TaskSectionProps {
  projectId: number;
  canEdit?: boolean;
  teamMembers?: User[];
  milestones?: Milestone[];
}

export const TaskSection: FC<TaskSectionProps> = ({
  projectId,
  canEdit = false,
  teamMembers = [],
  milestones = [],
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    project_id: projectId,
  });

  // Fetch tasks
  const { data: tasks = [], isLoading } = useTasks(filters);

  // Mutations
  const createMutation = useCreateTask(projectId);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const markCompleteMutation = useMarkTaskComplete();

  // WebSocket for real-time updates
  const { isConnected } = useTaskWebSocket({
    projectId,
    enabled: !!projectId,
  });

  const handleCreateTask = (data: TaskFormData) => {
    createMutation.mutate(
      {
        project: projectId,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assigned_to_id: data.assigned_to_id,
        progress: data.progress,
        estimated_hours: data.estimated_hours,
        due_date: data.due_date,
        start_date: data.start_date,
        milestone: data.milestone,
      },
      {
        onSuccess: () => {
          setShowForm(false);
        },
      }
    );
  };

  const handleUpdateTask = (data: TaskFormData) => {
    if (!editingTask) return;

    updateMutation.mutate(
      {
        id: editingTask.id,
        data: {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          assigned_to_id: data.assigned_to_id,
          progress: data.progress,
          estimated_hours: data.estimated_hours,
          due_date: data.due_date,
          start_date: data.start_date,
          milestone: data.milestone,
        },
      },
      {
        onSuccess: () => {
          setEditingTask(null);
        },
      }
    );
  };

  const handleDeleteTask = (taskId: number) => {
    deleteMutation.mutate(taskId);
  };

  const handleStatusChange = (taskId: number, status: Task['status']) => {
    updateMutation.mutate({
      id: taskId,
      data: { status },
    });
  };

  const handleMarkComplete = (taskId: number) => {
    markCompleteMutation.mutate(taskId);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">
            {tasks.length > 0 ? `${tasks.length} Tasks` : 'No Tasks'}
          </h3>
          {isConnected && (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Real-time updates enabled" />
          )}
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setEditingTask(null);
              setShowForm(!showForm);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ New Task'}
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {canEdit && showForm && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-4 text-gray-900">
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </h4>
          <TaskForm
            mode={editingTask ? 'edit' : 'create'}
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            initialData={editingTask || undefined}
            projectId={projectId}
            users={teamMembers}
            milestones={milestones}
          />
        </div>
      )}

      {/* Tasks List */}
      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        canEdit={canEdit}
        users={teamMembers}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        onStatusChange={handleStatusChange}
        onMarkComplete={handleMarkComplete}
        onFilterChange={setFilters}
      />

      {/* Status Indicator */}
      {!isConnected && (
        <div className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded border border-amber-200">
          Real-time updates disconnected. Changes will sync when connection is restored.
        </div>
      )}
    </div>
  );
};

export default TaskSection;
