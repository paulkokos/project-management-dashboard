import { describe, it, expect } from 'vitest'
import {
  getUserProjectRole,
  canEditProject,
  isProjectOwner,
  canManageTeam,
  isReadOnlyRole,
  canViewTeamRoster,
  canDeleteProject,
  canRestoreProject,
  getEditRestrictionMessage,
  canEditMilestones,
  getReadOnlyRoles,
  getEditCapableRoles,
} from '@/utils/permissions'
import { Project, User, Role } from '@/types'

describe('Permissions Utilities - Extended Coverage', () => {
  // Mock data
  const mockOwner: User = {
    id: 1,
    username: 'dr.smith',
    email: 'dr.smith@pfizer.com',
    first_name: 'Dr. James',
    last_name: 'Smith',
    is_admin: false,
  }

  const mockAdmin: User = {
    id: 2,
    username: 'admin.pfizer',
    email: 'admin@pfizer.com',
    first_name: 'Admin',
    last_name: 'Pfizer',
    is_admin: true,
  }

  const mockTeamMember: User = {
    id: 3,
    username: 'dr.jones',
    email: 'dr.jones@pfizer.com',
    first_name: 'Dr. Robert',
    last_name: 'Jones',
    is_admin: false,
  }

  const mockRole: Role = {
    id: 1,
    key: 'developer',
    display_name: 'Developer',
    description: 'Development role',
    color: '#3b82f6',
    bg_color: 'bg-blue-100',
    text_color: 'text-blue-700',
    border_color: 'border-blue-300',
    sort_order: 1,
  }

  const mockLeadRole: Role = {
    id: 2,
    key: 'lead',
    display_name: 'Lead',
    description: 'Lead role',
    color: '#8b5cf6',
    bg_color: 'bg-purple-100',
    text_color: 'text-purple-700',
    border_color: 'border-purple-300',
    sort_order: 2,
  }

  const mockManagerRole: Role = {
    id: 3,
    key: 'manager',
    display_name: 'Manager',
    description: 'Manager role',
    color: '#10b981',
    bg_color: 'bg-green-100',
    text_color: 'text-green-700',
    border_color: 'border-green-300',
    sort_order: 3,
  }

  const mockStakeholderRole: Role = {
    id: 4,
    key: 'stakeholder',
    display_name: 'Stakeholder',
    description: 'Stakeholder role',
    color: '#6b7280',
    bg_color: 'bg-gray-100',
    text_color: 'text-gray-700',
    border_color: 'border-gray-300',
    sort_order: 4,
  }

  const baseProject: Project = {
    id: 1,
    title: 'Vaccine Development Platform',
    description: 'Build a comprehensive platform for vaccine research and development tracking',
    owner: mockOwner,
    status: 'active',
    health: 'healthy',
    progress: 50,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    tags: [],
    team_members_details: [],
    milestones: [],
    etag: '"abc123"',
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  describe('getUserProjectRole', () => {
    it('should return null for null user', () => {
      const result = getUserProjectRole(null, baseProject)
      expect(result).toBeNull()
    })

    it('should return owner for admin users', () => {
      const result = getUserProjectRole(mockAdmin, baseProject)
      expect(result).toBe('owner')
    })

    it('should return owner for project owner', () => {
      const result = getUserProjectRole(mockOwner, baseProject)
      expect(result).toBe('owner')
    })

    it('should return role from team_members_details with Role object', () => {
      const projectWithTeam: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockRole,
            capacity: 100,
          },
        ],
      }
      const result = getUserProjectRole(mockTeamMember, projectWithTeam)
      expect(result).toBe('developer')
    })

    it('should return role from team_members_details with string role', () => {
      const projectWithTeam: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: 'designer',
            capacity: 100,
          },
        ],
      }
      const result = getUserProjectRole(mockTeamMember, projectWithTeam)
      expect(result).toBe('designer')
    })

    it('should return null for user not in project', () => {
      const result = getUserProjectRole(mockTeamMember, baseProject)
      expect(result).toBeNull()
    })

    it('should handle project without team_members_details', () => {
      const projectWithoutTeam: Project = {
        ...baseProject,
        team_members_details: undefined,
      }
      const result = getUserProjectRole(mockTeamMember, projectWithoutTeam)
      expect(result).toBeNull()
    })
  })

  describe('canEditProject', () => {
    it('should allow owner to edit', () => {
      const result = canEditProject(mockOwner, baseProject)
      expect(result).toBe(true)
    })

    it('should allow admin to edit', () => {
      const result = canEditProject(mockAdmin, baseProject)
      expect(result).toBe(true)
    })

    it('should allow lead to edit', () => {
      const projectWithLead: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockLeadRole,
            capacity: 100,
          },
        ],
      }
      const result = canEditProject(mockTeamMember, projectWithLead)
      expect(result).toBe(true)
    })

    it('should allow manager to edit', () => {
      const projectWithManager: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockManagerRole,
            capacity: 100,
          },
        ],
      }
      const result = canEditProject(mockTeamMember, projectWithManager)
      expect(result).toBe(true)
    })

    it('should not allow developer to edit', () => {
      const projectWithDeveloper: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockRole,
            capacity: 100,
          },
        ],
      }
      const result = canEditProject(mockTeamMember, projectWithDeveloper)
      expect(result).toBe(false)
    })

    it('should not allow stakeholder to edit', () => {
      const projectWithStakeholder: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockStakeholderRole,
            capacity: 100,
          },
        ],
      }
      const result = canEditProject(mockTeamMember, projectWithStakeholder)
      expect(result).toBe(false)
    })

    it('should not allow non-member to edit', () => {
      const result = canEditProject(mockTeamMember, baseProject)
      expect(result).toBe(false)
    })

    it('should not allow null user to edit', () => {
      const result = canEditProject(null, baseProject)
      expect(result).toBe(false)
    })
  })

  describe('isProjectOwner', () => {
    it('should return true for project owner', () => {
      const result = isProjectOwner(mockOwner, baseProject)
      expect(result).toBe(true)
    })

    it('should return false for non-owner', () => {
      const result = isProjectOwner(mockTeamMember, baseProject)
      expect(result).toBe(false)
    })

    it('should return false for null user', () => {
      const result = isProjectOwner(null, baseProject)
      expect(result).toBe(false)
    })

    it('should return false when project has no owner', () => {
      const projectNoOwner: Project = {
        ...baseProject,
        owner: undefined as any,
      }
      const result = isProjectOwner(mockOwner, projectNoOwner)
      expect(result).toBe(false)
    })
  })

  describe('canManageTeam', () => {
    it('should allow owner to manage team', () => {
      const result = canManageTeam(mockOwner, baseProject)
      expect(result).toBe(true)
    })

    it('should allow admin to manage team', () => {
      const result = canManageTeam(mockAdmin, baseProject)
      expect(result).toBe(true)
    })

    it('should not allow non-owner to manage team', () => {
      const result = canManageTeam(mockTeamMember, baseProject)
      expect(result).toBe(false)
    })

    it('should not allow null user to manage team', () => {
      const result = canManageTeam(null, baseProject)
      expect(result).toBe(false)
    })
  })

  describe('isReadOnlyRole', () => {
    it('should return true for stakeholder', () => {
      const projectWithStakeholder: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockStakeholderRole,
            capacity: 100,
          },
        ],
      }
      const result = isReadOnlyRole(mockTeamMember, projectWithStakeholder)
      expect(result).toBe(true)
    })

    it('should return false for developer', () => {
      const projectWithDeveloper: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockRole,
            capacity: 100,
          },
        ],
      }
      const result = isReadOnlyRole(mockTeamMember, projectWithDeveloper)
      expect(result).toBe(false)
    })

    it('should return false for owner', () => {
      const result = isReadOnlyRole(mockOwner, baseProject)
      expect(result).toBe(false)
    })

    it('should return false for null user', () => {
      const result = isReadOnlyRole(null, baseProject)
      expect(result).toBe(false)
    })
  })

  describe('canViewTeamRoster', () => {
    it('should allow owner to view team', () => {
      const result = canViewTeamRoster(mockOwner, baseProject)
      expect(result).toBe(true)
    })

    it('should allow team member to view team', () => {
      const projectWithMember: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockRole,
            capacity: 100,
          },
        ],
      }
      const result = canViewTeamRoster(mockTeamMember, projectWithMember)
      expect(result).toBe(true)
    })

    it('should not allow stakeholder to view team', () => {
      const projectWithStakeholder: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockStakeholderRole,
            capacity: 100,
          },
        ],
      }
      const result = canViewTeamRoster(mockTeamMember, projectWithStakeholder)
      expect(result).toBe(false)
    })

    it('should not allow non-member to view team', () => {
      const result = canViewTeamRoster(mockTeamMember, baseProject)
      expect(result).toBe(false)
    })

    it('should not allow null user to view team', () => {
      const result = canViewTeamRoster(null, baseProject)
      expect(result).toBe(false)
    })
  })

  describe('canDeleteProject', () => {
    it('should allow owner to delete', () => {
      const result = canDeleteProject(mockOwner, baseProject)
      expect(result).toBe(true)
    })

    it('should allow admin to delete', () => {
      const result = canDeleteProject(mockAdmin, baseProject)
      expect(result).toBe(true)
    })

    it('should not allow non-owner to delete', () => {
      const result = canDeleteProject(mockTeamMember, baseProject)
      expect(result).toBe(false)
    })

    it('should not allow null user to delete', () => {
      const result = canDeleteProject(null, baseProject)
      expect(result).toBe(false)
    })
  })

  describe('canRestoreProject', () => {
    it('should allow owner to restore', () => {
      const result = canRestoreProject(mockOwner, baseProject)
      expect(result).toBe(true)
    })

    it('should allow admin to restore', () => {
      const result = canRestoreProject(mockAdmin, baseProject)
      expect(result).toBe(true)
    })

    it('should not allow non-owner to restore', () => {
      const result = canRestoreProject(mockTeamMember, baseProject)
      expect(result).toBe(false)
    })

    it('should not allow null user to restore', () => {
      const result = canRestoreProject(null, baseProject)
      expect(result).toBe(false)
    })
  })

  describe('getEditRestrictionMessage', () => {
    it('should return no access message for non-member', () => {
      const result = getEditRestrictionMessage(mockTeamMember, baseProject)
      expect(result).toBe('You do not have access to this project')
    })

    it('should return stakeholder message for stakeholder', () => {
      const projectWithStakeholder: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockStakeholderRole,
            capacity: 100,
          },
        ],
      }
      const result = getEditRestrictionMessage(mockTeamMember, projectWithStakeholder)
      expect(result).toBe('Stakeholders have read-only access to this project')
    })

    it('should return developer message for developer', () => {
      const projectWithDeveloper: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: 'developer',
            capacity: 100,
          },
        ],
      }
      const result = getEditRestrictionMessage(mockTeamMember, projectWithDeveloper)
      expect(result).toBe('Developers have read-only access to this project')
    })

    it('should return designer message for designer', () => {
      const projectWithDesigner: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: 'designer',
            capacity: 100,
          },
        ],
      }
      const result = getEditRestrictionMessage(mockTeamMember, projectWithDesigner)
      expect(result).toBe('Designers have read-only access to this project')
    })

    it('should return qa message for qa', () => {
      const projectWithQA: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: 'qa',
            capacity: 100,
          },
        ],
      }
      const result = getEditRestrictionMessage(mockTeamMember, projectWithQA)
      expect(result).toBe('Qas have read-only access to this project')
    })

    it('should return generic message for other cases', () => {
      const result = getEditRestrictionMessage(null, baseProject)
      expect(result).toBe('You do not have access to this project')
    })
  })

  describe('canEditMilestones', () => {
    it('should allow owner to edit milestones', () => {
      const result = canEditMilestones(mockOwner, baseProject)
      expect(result).toBe(true)
    })

    it('should allow lead to edit milestones', () => {
      const projectWithLead: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockLeadRole,
            capacity: 100,
          },
        ],
      }
      const result = canEditMilestones(mockTeamMember, projectWithLead)
      expect(result).toBe(true)
    })

    it('should not allow developer to edit milestones', () => {
      const projectWithDeveloper: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockRole,
            capacity: 100,
          },
        ],
      }
      const result = canEditMilestones(mockTeamMember, projectWithDeveloper)
      expect(result).toBe(false)
    })
  })

  describe('getReadOnlyRoles', () => {
    it('should return all read-only roles', () => {
      const roles = getReadOnlyRoles()
      expect(roles).toEqual(['developer', 'designer', 'qa', 'stakeholder'])
    })

    it('should return array with 4 roles', () => {
      const roles = getReadOnlyRoles()
      expect(roles).toHaveLength(4)
    })
  })

  describe('getEditCapableRoles', () => {
    it('should return all edit-capable roles', () => {
      const roles = getEditCapableRoles()
      expect(roles).toEqual(['owner', 'lead', 'manager'])
    })

    it('should return array with 3 roles', () => {
      const roles = getEditCapableRoles()
      expect(roles).toHaveLength(3)
    })
  })

  describe('Edge Cases and Combinations', () => {
    it('should handle admin overriding all permissions', () => {
      // Admin should have all permissions regardless of team membership
      expect(canEditProject(mockAdmin, baseProject)).toBe(true)
      expect(canManageTeam(mockAdmin, baseProject)).toBe(true)
      expect(canDeleteProject(mockAdmin, baseProject)).toBe(true)
      expect(canRestoreProject(mockAdmin, baseProject)).toBe(true)
    })

    it('should handle multiple roles correctly', () => {
      const projectWithMultipleMembers: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockTeamMember,
            role: mockRole,
            capacity: 100,
          },
          {
            id: 2,
            user: { ...mockTeamMember, id: 4 },
            role: mockLeadRole,
            capacity: 50,
          },
        ],
      }
      const result = getUserProjectRole(mockTeamMember, projectWithMultipleMembers)
      expect(result).toBe('developer')
    })

    it('should prioritize owner role over team member role', () => {
      const projectOwnerInTeam: Project = {
        ...baseProject,
        team_members_details: [
          {
            id: 1,
            user: mockOwner,
            role: mockRole,
            capacity: 100,
          },
        ],
      }
      const result = getUserProjectRole(mockOwner, projectOwnerInTeam)
      expect(result).toBe('owner')
    })

    it('should handle empty team_members_details array', () => {
      const projectEmptyTeam: Project = {
        ...baseProject,
        team_members_details: [],
      }
      const result = getUserProjectRole(mockTeamMember, projectEmptyTeam)
      expect(result).toBeNull()
    })
  })
})
