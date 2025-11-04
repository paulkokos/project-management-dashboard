import { Project, User, TeamMember } from '@/types'

/**
 * Permission utilities for role-based access control
 * Based on security-posture.md specifications
 */

export type ProjectRole = 'owner' | 'lead' | 'manager' | 'developer' | 'designer' | 'qa' | 'stakeholder'

/**
 * Get the current user's role in a specific project
 */
export function getUserProjectRole(user: User | null, project: Project): ProjectRole | null {
  if (!user) return null

  // Admin has owner role for all projects
  if (user.is_admin) {
    return 'owner'
  }

  // User is the owner
  if (project.owner?.id === user.id) {
    return 'owner'
  }

  // Check team members for role
  if (project.team_members_details) {
    const teamMember = project.team_members_details.find(
      (m: TeamMember) => m.user.id === user.id
    )
    if (teamMember && teamMember.role) {
      // Role can be an object with key/display_name or a string
      if (typeof teamMember.role === 'object' && teamMember.role.key) {
        return teamMember.role.key as ProjectRole
      }
      if (typeof teamMember.role === 'string') {
        return teamMember.role as ProjectRole
      }
    }
  }

  return null
}

/**
 * Check if user can edit the project
 * Allowed roles: owner, lead, manager
 */
export function canEditProject(user: User | null, project: Project): boolean {
  const role = getUserProjectRole(user, project)
  return role === 'owner' || role === 'lead' || role === 'manager'
}

/**
 * Check if user is the project owner
 */
export function isProjectOwner(user: User | null, project: Project): boolean {
  return user?.id === project.owner?.id
}

/**
 * Check if user can manage team (add/remove/edit members)
 * Owner or admin can manage team
 */
export function canManageTeam(user: User | null, project: Project): boolean {
  if (!user) return false
  if (user.is_admin) return true
  return isProjectOwner(user, project)
}

/**
 * Check if user is in read-only stakeholder role
 */
export function isReadOnlyRole(user: User | null, project: Project): boolean {
  const role = getUserProjectRole(user, project)
  return role === 'stakeholder'
}

/**
 * Check if user can view team roster
 * Owner and team members can view, stakeholders cannot
 */
export function canViewTeamRoster(user: User | null, project: Project): boolean {
  const role = getUserProjectRole(user, project)
  if (!role) return false
  // Stakeholders cannot see team roster
  return role !== 'stakeholder'
}

/**
 * Check if user can delete project
 * Owner or admin can delete
 */
export function canDeleteProject(user: User | null, project: Project): boolean {
  if (!user) return false
  if (user.is_admin) return true
  return isProjectOwner(user, project)
}

/**
 * Check if user can restore project from trash
 * Owner or admin can restore
 */
export function canRestoreProject(user: User | null, project: Project): boolean {
  if (!user) return false
  if (user.is_admin) return true
  return isProjectOwner(user, project)
}

/**
 * Get edit restriction message for a user
 */
export function getEditRestrictionMessage(user: User | null, project: Project): string {
  const role = getUserProjectRole(user, project)

  if (!role) {
    return 'You do not have access to this project'
  }

  if (role === 'stakeholder') {
    return 'Stakeholders have read-only access to this project'
  }

  if (['developer', 'designer', 'qa'].includes(role)) {
    return `${role.charAt(0).toUpperCase() + role.slice(1)}s have read-only access to this project`
  }

  return 'You do not have permission to edit this project'
}

/**
 * Check if user can edit milestones
 * Allowed roles: owner, lead, manager
 */
export function canEditMilestones(user: User | null, project: Project): boolean {
  return canEditProject(user, project)
}

/**
 * Get all read-only roles
 */
export function getReadOnlyRoles(): ProjectRole[] {
  return ['developer', 'designer', 'qa', 'stakeholder']
}

/**
 * Get all edit-capable roles
 */
export function getEditCapableRoles(): ProjectRole[] {
  return ['owner', 'lead', 'manager']
}
