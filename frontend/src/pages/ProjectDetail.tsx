import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectAPI } from '@/services'
import { useProjectUpdates } from '@/hooks'
import { useAuthStore } from '@/stores/authStore'
import { useNotification } from '@/contexts/NotificationContext'
import { TeamMemberManager } from '@/components/TeamMemberManager'
import { MilestoneManager } from '@/components/MilestoneManager'
import {
  canEditProject,
  canManageTeam,
  canViewTeamRoster,
  canDeleteProject,
  getEditRestrictionMessage
} from '@/utils/permissions'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { addNotification } = useNotification()
  const projectId = id ? parseInt(id) : undefined

  // Subscribe to this specific project's updates via WebSocket
  useProjectUpdates(projectId)

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectAPI.get(parseInt(id!)),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => projectAPI.softDelete(parseInt(id!)),
    onSuccess: () => {
      const projectTitle = project?.data?.title || 'Project'
      addNotification({
        type: 'success',
        message: `Project "${projectTitle}" has been deleted`,
        description: `Deleted by ${user?.username}`,
        duration: 5000,
      })
      navigate('/projects')
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: () => {
      addNotification({
        type: 'error',
        message: 'Failed to delete project',
        description: 'Please try again',
        duration: 5000,
      })
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (!project?.data) return <div>Project not found</div>

  const p = project.data
  const canEdit = canEditProject(user, p)
  const canManageTeamMembers = canManageTeam(user, p)
  const canRemoveProject = canDeleteProject(user, p)
  const canViewTeam = canViewTeamRoster(user, p)


  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
        >
          ← Back
        </button>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{p.title}</h1>
          <p className="text-gray-600 mt-2">{p.description}</p>
          {p.owner && (
            <p className="text-sm text-gray-500 mt-3">
              Owner: <span className="font-semibold">{p.owner.username}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {canEdit ? (
            <button
              onClick={() => navigate(`/projects/${id}/edit`)}
              className="btn btn-primary"
            >
              Edit
            </button>
          ) : (
            <button
              disabled
              title={getEditRestrictionMessage(user, p)}
              className="btn btn-primary opacity-50 cursor-not-allowed"
            >
              Edit
            </button>
          )}
          {canRemoveProject ? (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this project?')) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
              className="btn btn-danger"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          ) : (
            <button
              disabled
              title="Only the project owner or an admin can delete projects"
              className="btn btn-danger opacity-50 cursor-not-allowed"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-700">Status</h3>
          <p className={`status-badge status-${p.status} mt-2`}>
            {p.status}
          </p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-700">Health</h3>
          <p className={`health-${p.health} mt-2 font-bold`}>
            {p.health}
          </p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-700">Progress</h3>
          <p className="text-2xl font-bold mt-2">{p.progress}%</p>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-700">Team Size</h3>
          <p className="text-2xl font-bold mt-2">{p.team_count || 0}</p>
        </div>
      </div>


      {canViewTeam && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Team Management</h2>
            {!canManageTeamMembers && !user?.is_admin && (
              <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded">
                View Only
              </span>
            )}
          </div>
          {canManageTeamMembers ? (
            <TeamMemberManager
              projectId={parseInt(id!)}
              initialMembers={p.team_members_details || []}
            />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Only the project owner can manage team members.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Capacity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {p.team_members_details?.map((member: any) => {
                      const roleDisplay = typeof member.role === 'object' ? member.role.display_name : member.role
                      const roleBgColor = typeof member.role === 'object' ? member.role.bg_color : 'bg-gray-100'
                      const roleTextColor = typeof member.role === 'object' ? member.role.text_color : 'text-gray-700'
                      return (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {member.user.first_name} {member.user.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{member.user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-sm font-medium rounded-full ${roleBgColor} ${roleTextColor}`}>
                              {roleDisplay}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${member.capacity}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700 min-w-12">{member.capacity}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Milestones</h2>
          {!canEdit && (
            <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded">
              Read Only
            </span>
          )}
        </div>
        <MilestoneManager
          projectId={parseInt(id!)}
          canEdit={canEdit}
          initialMilestones={p.milestones || []}
        />
      </div>

      {p.recent_activities && p.recent_activities.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {p.recent_activities.map((activity: Record<string, any>) => (
              <div key={activity.id} className="border-l-2 border-gray-300 pl-4 pb-3">
                <p className="font-semibold text-sm">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
