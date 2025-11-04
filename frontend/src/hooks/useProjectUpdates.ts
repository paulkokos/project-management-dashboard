import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useWebSocket } from './useWebSocket'
import { useProjectStore } from '@/stores/projectStore'
import { useNotification } from '@/contexts/NotificationContext'
import { Project, User } from '@/types'

interface ProjectUpdate extends Partial<Project> {
  id: number
}

interface ProjectActivityUpdate {
  project_id: number
  activity_type: string
  description: string
  user: User
  created_at: string
}

interface NotificationMessage {
  type: string
  title: string
  message: string
  event_type: string
  timestamp: string
  actor: {
    id: number
    username: string
    first_name: string
    last_name: string
  }
  project_id: number
  project_title: string
}

export function useProjectUpdates(projectId?: number) {
  const queryClient = useQueryClient()
  const { updateProject } = useProjectStore()
  const { subscribe, unsubscribe, on, off } = useWebSocket()
  const { addNotification } = useNotification()

  useEffect(() => {
    if (!projectId) return

    // Subscribe to this specific project
    subscribe(projectId)

    // Handler for project updates
    const handleProjectUpdate = (data: ProjectUpdate) => {
      if (data.id === projectId) {
        // Update the store
        updateProject(data as unknown as Project)

        // Invalidate React Query cache for this project
        queryClient.invalidateQueries({
          queryKey: ['project', projectId],
        })

        // Invalidate the projects list to refresh
        queryClient.invalidateQueries({
          queryKey: ['projects'],
        })
      }
    }

    // Handler for project activities
    const handleProjectActivity = (data: ProjectActivityUpdate) => {
      if (data.project_id === projectId) {
        // Invalidate activities cache
        queryClient.invalidateQueries({
          queryKey: ['project', projectId, 'activities'],
        })
      }
    }

    // Handler for bulk updates
    const handleBulkUpdate = (data: { project_ids: number[] }) => {
      if (data.project_ids.includes(projectId)) {
        queryClient.invalidateQueries({
          queryKey: ['project', projectId],
        })

        queryClient.invalidateQueries({
          queryKey: ['projects'],
        })
      }
    }

    // Handler for notifications from team members
    const handleNotification = (data: unknown) => {
      const notif = data as NotificationMessage
      if (notif.project_id === projectId) {
        // Map event types to notification types
        let notificationType: 'success' | 'error' | 'warning' | 'info' = 'info'
        if (notif.event_type === 'project_deleted') {
          notificationType = 'warning'
        }

        addNotification({
          type: notificationType,
          message: notif.title,
          description: notif.message,
          duration: 5000,
        })
      }
    }

    // Subscribe to events
    on('project_updated', handleProjectUpdate as (data: unknown) => void)
    on('project_activity', handleProjectActivity as (data: unknown) => void)
    on('bulk_update', handleBulkUpdate as (data: unknown) => void)
    on('notification_received', handleNotification)

    return () => {
      // Unsubscribe from specific project
      unsubscribe(projectId)

      // Remove event listeners
      off('project_updated', handleProjectUpdate as (data: unknown) => void)
      off('project_activity', handleProjectActivity as (data: unknown) => void)
      off('bulk_update', handleBulkUpdate as (data: unknown) => void)
      off('notification_received', handleNotification)
    }
  }, [projectId, subscribe, unsubscribe, on, off, queryClient, updateProject, addNotification])
}

export function useAllProjectUpdates() {
  const queryClient = useQueryClient()
  const { on, off } = useWebSocket()

  useEffect(() => {
    // Handler for any project update in general
    const handleProjectUpdate = () => {
      // Invalidate all projects cache
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      })
    }

    const handleBulkUpdate = () => {
      // Invalidate all projects cache for bulk updates
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      })
    }

    on('project_updated', handleProjectUpdate)
    on('project_created', handleProjectUpdate)
    on('project_deleted', handleProjectUpdate)
    on('bulk_update', handleBulkUpdate)

    return () => {
      off('project_updated', handleProjectUpdate)
      off('project_created', handleProjectUpdate)
      off('project_deleted', handleProjectUpdate)
      off('bulk_update', handleBulkUpdate)
    }
  }, [on, off, queryClient])
}

export function useChangelogUpdates(projectId?: number) {
  const queryClient = useQueryClient()
  const { subscribe, unsubscribe, on, off } = useWebSocket()

  useEffect(() => {
    if (!projectId) return

    // Subscribe to this specific project
    subscribe(projectId)

    // Handler for activity/changelog updates
    const handleActivityUpdate = (data: { project_id: number }) => {
      if (data.project_id === projectId) {
        // Invalidate changelog cache to refresh with new entry
        queryClient.invalidateQueries({
          queryKey: ['changelog', projectId.toString()],
        })
      }
    }

    // Subscribe to project activity events
    on('project_activity', handleActivityUpdate)

    return () => {
      // Unsubscribe from specific project
      unsubscribe(projectId)

      // Remove event listeners
      off('project_activity', handleActivityUpdate)
    }
  }, [projectId, subscribe, unsubscribe, on, off, queryClient])
}
