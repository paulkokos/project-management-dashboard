import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectAPI, userAPI, roleAPI } from '@/services'
import { TeamMember, User } from '@/types'

interface TeamMemberManagerProps {
  projectId: number
  initialMembers?: TeamMember[]
  onMembersChange?: (members: TeamMember[]) => void
}

interface EditingMember {
  memberId: number
  userId: number
  currentRoleId: number
  currentCapacity: number
}

interface AddingMember {
  isOpen: boolean
}

const ROLES = ['lead', 'developer', 'designer', 'qa', 'manager', 'stakeholder'] as const

export const TeamMemberManager = ({
  projectId,
  initialMembers = [],
  onMembersChange,
}: TeamMemberManagerProps) => {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [addingMember, setAddingMember] = useState<AddingMember>({ isOpen: false })
  const [newMember, setNewMember] = useState<{
    userId: string
    role: typeof ROLES[number]
    capacity: number | string
  }>({
    userId: '',
    role: 'developer',
    capacity: 100,
  })
  const [editingMember, setEditingMember] = useState<EditingMember | null>(null)
  const [editForm, setEditForm] = useState<{
    roleId: number
    capacity: number | string
  }>({
    roleId: 0,
    capacity: 0,
  })
  const queryClient = useQueryClient()

  // Fetch available users
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.list(),
  })

  // Fetch available roles
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleAPI.list(),
  })

  const availableUsers = useMemo(() => {
    const data = usersResponse?.data
    if (Array.isArray(data)) {
      return data
    }
    if (data?.results && Array.isArray(data.results)) {
      return data.results
    }
    return []
  }, [usersResponse])

  const availableRoles = useMemo(() => {
    const data = rolesResponse?.data
    if (Array.isArray(data)) {
      return data
    }
    if (data?.results && Array.isArray(data.results)) {
      return data.results
    }
    return []
  }, [rolesResponse])

  // Get users not already in team
  const unassignedUsers = useMemo(() => {
    const memberUserIds = new Set(members.map(m => m.user.id))
    return availableUsers.filter((user: User) => !memberUserIds.has(user.id))
  }, [availableUsers, members])

  // Add team member
  const addMemberM = useMutation({
    mutationFn: (data: { userId: number; role: string; capacity: number }) =>
      projectAPI.addTeamMember(projectId, {
        user_id: data.userId,
        role: data.role,
        capacity: data.capacity,
      }),
    onSuccess: (response) => {
      const newMemberData = response.data
      const updated = [...members, newMemberData]
      setMembers(updated)
      onMembersChange?.(updated)

      // Reset form and close modal
      setNewMember({
        userId: '',
        role: 'developer',
        capacity: 100,
      })
      setAddingMember({ isOpen: false })

      // Invalidate project query
      queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] })
    },
  })

  // Remove team member
  const removeMemberM = useMutation({
    mutationFn: (userId: number) => projectAPI.removeTeamMember(projectId, userId),
    onSuccess: (_, userId) => {
      const updated = members.filter((m) => m.user.id !== userId)
      setMembers(updated)
      onMembersChange?.(updated)
      queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] })
    },
  })

  // Update team member
  const updateMemberM = useMutation({
    mutationFn: (data: { userId: number; roleId?: number; capacity?: number }) =>
      projectAPI.updateTeamMember(projectId, {
        user_id: data.userId,
        ...(data.roleId !== undefined && { role_id: data.roleId }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
      }),
    onSuccess: (response) => {
      const updatedMemberData = response.data
      const updated = members.map((m) =>
        m.user.id === updatedMemberData.user.id ? updatedMemberData : m
      )
      setMembers(updated)
      onMembersChange?.(updated)
      setEditingMember(null)
      queryClient.invalidateQueries({ queryKey: ['project', projectId.toString()] })
    },
  })

  const handleAddMember = () => {
    if (!newMember.userId) {
      alert('Please select a user')
      return
    }

    const capacityValue = typeof newMember.capacity === 'string'
      ? (newMember.capacity === '' ? 50 : parseInt(newMember.capacity))
      : newMember.capacity

    addMemberM.mutate({
      userId: parseInt(newMember.userId),
      role: newMember.role,
      capacity: capacityValue,
    })
  }

  const handleCloseAddModal = () => {
    setAddingMember({ isOpen: false })
  }

  const handleRemoveMember = (userId: number) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      removeMemberM.mutate(userId)
    }
  }

  const handleEditMember = (member: TeamMember) => {
    const roleId = typeof member.role === 'object' ? member.role.id : (typeof member.role === 'number' ? member.role : 0)
    setEditingMember({
      memberId: member.id,
      userId: member.user.id,
      currentRoleId: roleId,
      currentCapacity: member.capacity,
    })
    setEditForm({
      roleId,
      capacity: member.capacity,
    })
  }

  const handleSaveEdit = () => {
    if (!editingMember) return

    const capacityValue = typeof editForm.capacity === 'string'
      ? parseInt(editForm.capacity)
      : editForm.capacity

    updateMemberM.mutate({
      userId: editingMember.userId,
      roleId: editForm.roleId || undefined,
      capacity: capacityValue,
    })
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
    setEditForm({ roleId: 0, capacity: 0 })
  }

  return (
    <div className="space-y-4">
      {/* Error messages */}
      {(addMemberM.error || removeMemberM.error || updateMemberM.error) && (
        <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded p-2">
          {addMemberM.error instanceof Error
            ? addMemberM.error.message
            : removeMemberM.error instanceof Error
              ? removeMemberM.error.message
              : updateMemberM.error instanceof Error
                ? updateMemberM.error.message
                : 'An error occurred'}
        </div>
      )}

      {/* Team Members List */}
      <div>
        <div className="text-xs font-semibold text-gray-700 mb-3">Team Members ({members.length})</div>

        {members.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded p-4 text-center text-sm">
            <p className="text-gray-500">No team members yet</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Add Member Card */}
          <button
            onClick={() => setAddingMember({ isOpen: true })}
            disabled={addMemberM.isPending}
            className="bg-white border border-gray-200 rounded p-2.5 hover:shadow-sm transition-shadow hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center min-h-32 cursor-pointer"
            title="Add team member"
          >
            <div className="text-center">
              <div className="text-3xl font-light text-gray-400 hover:text-blue-600 transition-colors">+</div>
              <p className="text-xs text-gray-500 mt-1">Add member</p>
            </div>
          </button>

          {members.map((member: TeamMember) => {
              const roleDisplay = typeof member.role === 'object' ? member.role.display_name : member.role
              const roleBgColor = typeof member.role === 'object' ? member.role.bg_color : 'bg-gray-100'
              const roleTextColor = typeof member.role === 'object' ? member.role.text_color : 'text-gray-700'

              return (
                <div key={member.id} className="bg-white border border-gray-200 rounded p-2.5 hover:shadow-sm transition-shadow">
                  <div className="space-y-2">
                    {/* User Info */}
                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {member.user.first_name} {member.user.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {member.user.email}
                      </p>
                    </div>

                    {/* Role Badge + Capacity */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${roleBgColor} ${roleTextColor}`}>
                        {roleDisplay}
                      </span>
                      <p className="text-xs font-semibold text-gray-700">{member.capacity}%</p>
                    </div>

                    {/* Capacity Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${member.capacity}%` }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => handleEditMember(member)}
                        disabled={updateMemberM.isPending || removeMemberM.isPending}
                        className="flex-1 text-blue-600 hover:text-blue-800 text-xs font-medium disabled:text-gray-400 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
                        disabled={removeMemberM.isPending || updateMemberM.isPending}
                        className="flex-1 text-red-600 hover:text-red-800 text-xs font-medium disabled:text-gray-400 hover:bg-red-50 rounded px-2 py-1 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {/* Add Team Member Modal */}
      {addingMember.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Add Team Member
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Select a user and assign a role
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
                  User
                </label>
                <select
                  id="user-select"
                  value={newMember.userId}
                  onChange={(e) => setNewMember({ ...newMember, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  disabled={addMemberM.isPending || usersLoading}
                >
                  <option value="">Select a user...</option>
                  {unassignedUsers.map((user: User) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="role-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="role-select"
                  value={newMember.role}
                  onChange={(e) => {
                    const role = e.target.value
                    if (ROLES.includes(role as typeof ROLES[number])) {
                      setNewMember({ ...newMember, role: role as typeof ROLES[number] })
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  disabled={addMemberM.isPending}
                >
                  <option value="">Select a role...</option>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="capacity-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (%)
                </label>
                <input
                  id="capacity-input"
                  type="number"
                  min="0"
                  max="100"
                  value={newMember.capacity}
                  onChange={(e) => {
                    const value = e.target.value
                    setNewMember({
                      ...newMember,
                      capacity: value === '' ? '' : Math.min(100, Math.max(0, parseInt(value) || 0)),
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  disabled={addMemberM.isPending}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setNewMember({
                        ...newMember,
                        capacity: 50,
                      })
                    }
                  }}
                  placeholder="50"
                />
              </div>
            </div>

            {addMemberM.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-600 text-sm">
                  {addMemberM.error instanceof Error
                    ? addMemberM.error.message
                    : 'An error occurred'}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={handleCloseAddModal}
                disabled={addMemberM.isPending}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={addMemberM.isPending || !newMember.userId || !newMember.role}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400"
              >
                {addMemberM.isPending ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Team Member
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Update the role and capacity for this team member
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="edit-role-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  id="edit-role-select"
                  value={editForm.roleId}
                  onChange={(e) => {
                    const roleId = parseInt(e.target.value)
                    setEditForm({ ...editForm, roleId })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  disabled={updateMemberM.isPending}
                >
                  <option value="0">Select a role...</option>
                  {availableRoles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-capacity-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (%)
                </label>
                <input
                  id="edit-capacity-input"
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.capacity}
                  onChange={(e) => {
                    const value = e.target.value
                    setEditForm({
                      ...editForm,
                      capacity: value === '' ? '' : Math.min(100, Math.max(0, parseInt(value) || 0)),
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  disabled={updateMemberM.isPending}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setEditForm({
                        ...editForm,
                        capacity: 50,
                      })
                    }
                  }}
                />
              </div>
            </div>

            {updateMemberM.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-600 text-sm">
                  {updateMemberM.error instanceof Error
                    ? updateMemberM.error.message
                    : 'An error occurred'}
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={handleCancelEdit}
                disabled={updateMemberM.isPending}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:text-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={updateMemberM.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-400"
              >
                {updateMemberM.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
