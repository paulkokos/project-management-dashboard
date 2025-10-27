import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { projectAPI } from '@/services'
import { useAuthStore } from '@/stores/authStore'
import { Project } from '@/types'
import { canRestoreProject } from '@/utils/permissions'

export default function DeletedProjects() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [restoreConfirm, setRestoreConfirm] = useState<{ id: number; title: string } | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)
  const [emptyTrashConfirm, setEmptyTrashConfirm] = useState(false)
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false)

  // Fetch deleted projects
  const { data, isLoading } = useQuery({
    queryKey: ['deleted-projects'],
    queryFn: () => projectAPI.deleted(),
  })

  // Handle both array format and paginated format
  const deletedProjects = Array.isArray(data?.data)
    ? data.data
    : (Array.isArray(data) ? data : (data?.data?.results || []))

  const handleRestoreProject = async () => {
    if (!restoreConfirm) return

    setIsRestoring(true)
    try {
      await projectAPI.restore(restoreConfirm.id)
      setRestoreConfirm(null)
      queryClient.invalidateQueries({ queryKey: ['deleted-projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch {
      // Restore failed silently
    } finally {
      setIsRestoring(false)
    }
  }

  const handleEmptyTrash = async () => {
    setIsEmptyingTrash(true)
    try {
      await projectAPI.emptyTrash()
      setEmptyTrashConfirm(false)
      queryClient.invalidateQueries({ queryKey: ['deleted-projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch {
      // Empty trash failed silently
    } finally {
      setIsEmptyingTrash(false)
    }
  }

  return (
    <div className="space-y-6">
      {restoreConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h2 className="text-xl font-bold mb-4">Restore Project?</h2>
            <p className="text-gray-600 mb-6">
              Restore &quot;<strong>{restoreConfirm.title}</strong>&quot; to your projects?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setRestoreConfirm(null)}
                disabled={isRestoring}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreProject}
                disabled={isRestoring}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isRestoring ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {emptyTrashConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-red-600">Empty Trash?</h2>
            <p className="text-gray-600 mb-2">
              This will permanently delete all {deletedProjects.length} deleted project{deletedProjects.length !== 1 ? 's' : ''}.
            </p>
            <p className="text-gray-600 mb-6 text-sm font-semibold">
              This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setEmptyTrashConfirm(false)}
                disabled={isEmptyingTrash}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                disabled={isEmptyingTrash}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isEmptyingTrash ? 'Emptying...' : 'Empty Trash'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Deleted Projects</h1>
        <div className="flex gap-2">
          {user?.is_admin && deletedProjects.length > 0 && (
            <button
              onClick={() => setEmptyTrashConfirm(true)}
              disabled={isEmptyingTrash}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {isEmptyingTrash ? 'Emptying...' : 'Empty Trash'}
            </button>
          )}
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : deletedProjects.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p className="text-lg">No deleted projects</p>
          <p className="text-sm">Projects you delete will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deletedProjects.map((project: Project) => (
            <div
              key={project.id}
              className="card flex justify-between items-start p-4"
            >
              <div className="flex-1">
                <h3 className="text-lg font-bold">{project.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                <div className="mt-3 flex gap-4 text-sm text-gray-600">
                  <span>Status: <strong className="capitalize">{project.status}</strong></span>
                  <span>Health: <strong className="capitalize">{project.health}</strong></span>
                  <span>Progress: <strong>{project.progress}%</strong></span>
                </div>
              </div>
              {canRestoreProject(user, project) ? (
                <button
                  onClick={() => setRestoreConfirm({ id: project.id, title: project.title })}
                  className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                >
                  Restore
                </button>
              ) : (
                <button
                  disabled
                  title="Only the project owner or an admin can restore projects"
                  className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg opacity-50 cursor-not-allowed whitespace-nowrap"
                >
                  Restore
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
