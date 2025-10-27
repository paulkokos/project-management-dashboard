import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { milestoneAPI } from '@/services'
import { wsService } from '@/services/websocket'
import { useNotification } from '@/contexts/NotificationContext'
import { Milestone } from '@/types'

interface MilestoneManagerProps {
  projectId: number
  canEdit: boolean
  initialMilestones?: Milestone[]
}

export const MilestoneManager = ({
  projectId,
  canEdit,
  initialMilestones = [],
}: MilestoneManagerProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    due_date: '',
    progress: 0 as number | string,
  })
  const [editMilestone, setEditMilestone] = useState({
    title: '',
    description: '',
    due_date: '',
    progress: 0 as number | string,
  })
  const queryClient = useQueryClient()
  const { addNotification } = useNotification()

  // Subscribe to real-time milestone updates via WebSocket
  useEffect(() => {
    const handleMilestoneChange = (payload: any) => {
      // Only process events for this project
      if (payload.project_id === projectId) {
        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
        queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] })
      }
    }

    // Subscribe to milestone change events
    wsService.on('milestone_changed', handleMilestoneChange)

    // Cleanup: unsubscribe when component unmounts
    return () => {
      wsService.off('milestone_changed', handleMilestoneChange)
    }
  }, [projectId, queryClient])

  // Fetch milestones
  const { data: milestonesResponse, isLoading: milestonesLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestoneAPI.list(projectId),
  })

  const fetchedMilestones = useMemo(() => {
    const data = milestonesResponse?.data
    if (Array.isArray(data)) {
      return data
    }
    if (data?.results && Array.isArray(data.results)) {
      return data.results
    }
    return []
  }, [milestonesResponse])

  // Create milestone
  const createMilestoneM = useMutation({
    mutationFn: (data: typeof newMilestone) => milestoneAPI.create(projectId, data),
    onSuccess: () => {
      // Reset form
      setNewMilestone({
        title: '',
        description: '',
        due_date: '',
        progress: 0,
      })
      setShowForm(false)

      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to create milestone',
        description: error.response?.data?.detail || 'Please try again',
        duration: 7000,
      })
    },
  })

  // Update milestone progress
  const updateMilestoneM = useMutation({
    mutationFn: (data: { id: number; progress: number }) =>
      milestoneAPI.update(data.id, { progress: data.progress }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to update milestone progress',
        description: error.response?.data?.detail || 'Please try again',
        duration: 7000,
      })
    },
  })

  // Complete milestone
  const completeMilestoneM = useMutation({
    mutationFn: (id: number) => milestoneAPI.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to mark milestone complete',
        description: error.response?.data?.detail || 'Please try again',
        duration: 7000,
      })
    },
  })

  // Delete milestone
  const deleteMilestoneM = useMutation({
    mutationFn: (id: number) => milestoneAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to delete milestone',
        description: error.response?.data?.detail || 'Please try again',
        duration: 7000,
      })
    },
  })

  // Edit milestone details
  const editMilestoneDetailsM = useMutation({
    mutationFn: (data: { id: number; title: string; description: string; due_date: string; progress: number }) =>
      milestoneAPI.update(data.id, {
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        progress: data.progress,
      }),
    onSuccess: () => {
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: 'Failed to edit milestone',
        description: error.response?.data?.detail || 'Please try again',
        duration: 7000,
      })
    },
  })

  const handleCreateMilestone = () => {
    if (!newMilestone.title || !newMilestone.due_date) {
      alert('Title and due date are required')
      return
    }

    const progressValue = typeof newMilestone.progress === 'string'
      ? (newMilestone.progress === '' ? 0 : parseInt(newMilestone.progress))
      : newMilestone.progress

    createMilestoneM.mutate({
      ...newMilestone,
      progress: progressValue,
    })
  }

  const handleDeleteMilestone = (id: number) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      deleteMilestoneM.mutate(id)
    }
  }

  const handleStartEdit = (milestone: Milestone) => {
    setEditingId(milestone.id)
    setEditMilestone({
      title: milestone.title,
      description: milestone.description || '',
      due_date: milestone.due_date,
      progress: milestone.progress,
    })
  }

  const handleSaveEdit = (id: number) => {
    if (!editMilestone.title || !editMilestone.due_date) {
      alert('Title and due date are required')
      return
    }
    const progressValue = typeof editMilestone.progress === 'string'
      ? (editMilestone.progress === '' ? 0 : parseInt(editMilestone.progress))
      : editMilestone.progress
    editMilestoneDetailsM.mutate({
      id,
      title: editMilestone.title,
      description: editMilestone.description,
      due_date: editMilestone.due_date,
      progress: progressValue,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditMilestone({ title: '', description: '', due_date: '', progress: 0 })
  }

  const displayMilestones = fetchedMilestones.length > 0 ? fetchedMilestones : milestones

  // Calculate overall progress
  const overallProgress =
    displayMilestones.length > 0
      ? Math.round(displayMilestones.reduce((sum: number, m: Milestone) => sum + m.progress, 0) / displayMilestones.length)
      : 0

  return (
    <div className="space-y-6">
      {/* Create Milestone Section */}
      {canEdit && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add Milestone</h3>

          {showForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newMilestone.title}
                  onChange={(e) =>
                    setNewMilestone(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Milestone title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  disabled={createMilestoneM.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Milestone description (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  disabled={createMilestoneM.isPending}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newMilestone.due_date}
                    onChange={(e) =>
                      setNewMilestone(prev => ({ ...prev, due_date: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={createMilestoneM.isPending}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newMilestone.progress}
                    onChange={(e) => {
                      const value = e.target.value
                      setNewMilestone(prev => ({
                        ...prev,
                        progress: value === '' ? '' : Math.min(100, Math.max(0, parseInt(value) || 0)),
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    disabled={createMilestoneM.isPending}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        setNewMilestone(prev => ({
                          ...prev,
                          progress: 0,
                        }))
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateMilestone}
                  disabled={createMilestoneM.isPending || !newMilestone.title || !newMilestone.due_date}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {createMilestoneM.isPending ? 'Creating...' : 'Create Milestone'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Add Milestone
            </button>
          )}

          {(createMilestoneM.error || deleteMilestoneM.error) && (
            <div className="text-red-600 text-sm mt-4">
              {createMilestoneM.error instanceof Error
                ? createMilestoneM.error.message
                : deleteMilestoneM.error instanceof Error
                  ? deleteMilestoneM.error.message
                  : 'An error occurred'}
            </div>
          )}
        </div>
      )}

      {/* Milestones List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Milestones ({displayMilestones.length})</h3>
          {displayMilestones.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Overall Progress:</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 min-w-12">{overallProgress}%</span>
            </div>
          )}
        </div>

        {milestonesLoading ? (
          <div className="text-center py-8 text-gray-500">Loading milestones...</div>
        ) : displayMilestones.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-gray-500">No milestones yet</p>
            {canEdit && (
              <p className="text-sm text-gray-400 mt-2">Create one to get started tracking progress</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayMilestones.map((milestone: Milestone) => (
              <div key={milestone.id}>
                {editingId === milestone.id ? (
                  <div className="bg-white border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-4">Edit Milestone</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={editMilestone.title}
                          onChange={(e) =>
                            setEditMilestone(prev => ({ ...prev, title: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editMilestone.description}
                          onChange={(e) =>
                            setEditMilestone(prev => ({ ...prev, description: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={editMilestone.due_date}
                          onChange={(e) =>
                            setEditMilestone(prev => ({ ...prev, due_date: e.target.value }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Progress (%)
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editMilestone.progress}
                            onChange={(e) =>
                              setEditMilestone(prev => ({ ...prev, progress: parseInt(e.target.value) }))
                            }
                            className="flex-1"
                          />
                          <span className="text-sm font-semibold text-gray-700 min-w-12">{editMilestone.progress}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(milestone.id)}
                          disabled={editMilestoneDetailsM.isPending}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                        {milestone.description && (
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStartEdit(milestone)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            disabled={deleteMilestoneM.isPending}
                            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:text-gray-400"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-semibold text-gray-700">{milestone.progress}%</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${milestone.progress}%` }}
                        />
                      </div>
                      {canEdit && milestone.progress < 100 && (
                        <button
                          onClick={() => completeMilestoneM.mutate(milestone.id)}
                          disabled={completeMilestoneM.isPending}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 disabled:bg-gray-400 transition-colors whitespace-nowrap"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Slider (if can edit) */}
                  {canEdit && (
                    <div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={milestone.progress}
                        onChange={(e) => {
                          const newProgress = parseInt(e.target.value)
                          const updated = milestones.map((m) =>
                            m.id === milestone.id ? { ...m, progress: newProgress } : m
                          )
                          setMilestones(updated)
                          updateMilestoneM.mutate({ id: milestone.id, progress: newProgress })
                        }}
                        disabled={updateMilestoneM.isPending}
                        className="w-full"
                      />
                    </div>
                  )}

                    {/* Due Date */}
                    <div className="text-sm text-gray-600">
                      Due: {new Date(milestone.due_date).toLocaleDateString()}
                    </div>
                  </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
