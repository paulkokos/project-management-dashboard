import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '@/stores/projectStore'
import { Project } from '@/types'

const mockProject1: Project = {
  id: 1,
  title: 'Vaccine Development Platform',
  description: 'Build a comprehensive platform for vaccine research and development tracking',
  owner: {
    id: 1,
    username: 'dr.smith',
    email: 'dr.smith@pfizer.com',
    first_name: 'Dr. James',
    last_name: 'Smith',
  },
  status: 'active',
  health: 'healthy',
  progress: 50,
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  tags: [],
  etag: 'etag1',
  version: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockProject2: Project = {
  id: 2,
  title: 'Clinical Trial Data Portal',
  description: 'Comprehensive clinical trial data collection and reporting portal for research teams',
  owner: {
    id: 2,
    username: 'dr.johnson',
    email: 'dr.johnson@pfizer.com',
    first_name: 'Dr. Sarah',
    last_name: 'Johnson',
  },
  status: 'on_hold',
  health: 'at_risk',
  progress: 25,
  start_date: '2024-02-01',
  end_date: '2024-11-30',
  tags: [],
  etag: 'etag2',
  version: 1,
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-02-01T00:00:00Z',
}

const mockProject3: Project = {
  id: 3,
  title: 'Regulatory Compliance System',
  description: 'FDA-compliant cloud-based system for pharmaceutical regulatory tracking',
  owner: {
    id: 3,
    username: 'dr.williams',
    email: 'dr.williams@pfizer.com',
    first_name: 'Dr. Michael',
    last_name: 'Williams',
  },
  status: 'completed',
  health: 'critical',
  progress: 100,
  start_date: '2024-03-01',
  end_date: '2024-10-31',
  tags: [],
  etag: 'etag3',
  version: 1,
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
}

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      selectedProject: null,
      filters: {},
      loading: false,
      error: null,
    })
  })

  describe('Initial state', () => {
    it('should initialize with empty projects array', () => {
      const state = useProjectStore.getState()
      expect(state.projects).toEqual([])
    })

    it('should initialize with null selectedProject', () => {
      const state = useProjectStore.getState()
      expect(state.selectedProject).toBeNull()
    })

    it('should initialize with empty filters', () => {
      const state = useProjectStore.getState()
      expect(state.filters).toEqual({})
    })

    it('should initialize with loading false', () => {
      const state = useProjectStore.getState()
      expect(state.loading).toBe(false)
    })

    it('should initialize with null error', () => {
      const state = useProjectStore.getState()
      expect(state.error).toBeNull()
    })
  })

  describe('setProjects action', () => {
    it('should set projects array', () => {
      const projects = [mockProject1, mockProject2]

      useProjectStore.getState().setProjects(projects)

      const state = useProjectStore.getState()
      expect(state.projects).toEqual(projects)
      expect(state.projects.length).toBe(2)
    })

    it('should replace existing projects', () => {
      useProjectStore.getState().setProjects([mockProject1])
      useProjectStore.getState().setProjects([mockProject2, mockProject3])

      const state = useProjectStore.getState()
      expect(state.projects.length).toBe(2)
      expect(state.projects[0].id).toBe(2)
      expect(state.projects[1].id).toBe(3)
    })

    it('should handle empty array', () => {
      useProjectStore.getState().setProjects([mockProject1])
      useProjectStore.getState().setProjects([])

      const state = useProjectStore.getState()
      expect(state.projects).toEqual([])
    })

    it('should handle setting projects multiple times', () => {
      useProjectStore.getState().setProjects([mockProject1])
      useProjectStore.getState().setProjects([mockProject2])
      useProjectStore.getState().setProjects([mockProject3])

      const state = useProjectStore.getState()
      expect(state.projects.length).toBe(1)
      expect(state.projects[0].id).toBe(3)
    })
  })

  describe('setSelectedProject action', () => {
    it('should set selected project', () => {
      useProjectStore.getState().setSelectedProject(mockProject1)

      const state = useProjectStore.getState()
      expect(state.selectedProject).toEqual(mockProject1)
    })

    it('should replace existing selected project', () => {
      useProjectStore.getState().setSelectedProject(mockProject1)
      useProjectStore.getState().setSelectedProject(mockProject2)

      const state = useProjectStore.getState()
      expect(state.selectedProject).toEqual(mockProject2)
    })

    it('should set to null', () => {
      useProjectStore.getState().setSelectedProject(mockProject1)
      useProjectStore.getState().setSelectedProject(null)

      const state = useProjectStore.getState()
      expect(state.selectedProject).toBeNull()
    })

    it('should handle null without existing selection', () => {
      useProjectStore.getState().setSelectedProject(null)

      const state = useProjectStore.getState()
      expect(state.selectedProject).toBeNull()
    })
  })

  describe('setFilters action', () => {
    it('should set status filter', () => {
      useProjectStore.getState().setFilters({ status: 'active' })

      const state = useProjectStore.getState()
      expect(state.filters.status).toBe('active')
    })

    it('should set health filter', () => {
      useProjectStore.getState().setFilters({ health: 'healthy' })

      const state = useProjectStore.getState()
      expect(state.filters.health).toBe('healthy')
    })

    it('should set owner filter', () => {
      useProjectStore.getState().setFilters({ owner: 1 })

      const state = useProjectStore.getState()
      expect(state.filters.owner).toBe(1)
    })

    it('should set tags filter', () => {
      useProjectStore.getState().setFilters({ tags: [1, 2, 3] })

      const state = useProjectStore.getState()
      expect(state.filters.tags).toEqual([1, 2, 3])
    })

    it('should set search filter', () => {
      useProjectStore.getState().setFilters({ search: 'test query' })

      const state = useProjectStore.getState()
      expect(state.filters.search).toBe('test query')
    })

    it('should set pagination filters', () => {
      useProjectStore.getState().setFilters({ page: 2, page_size: 20 })

      const state = useProjectStore.getState()
      expect(state.filters.page).toBe(2)
      expect(state.filters.page_size).toBe(20)
    })

    it('should set ordering filter', () => {
      useProjectStore.getState().setFilters({ ordering: '-created_at' })

      const state = useProjectStore.getState()
      expect(state.filters.ordering).toBe('-created_at')
    })

    it('should set multiple filters at once', () => {
      useProjectStore.getState().setFilters({
        status: 'active',
        health: 'healthy',
        owner: 1,
        search: 'project',
        page: 1,
      })

      const state = useProjectStore.getState()
      expect(state.filters.status).toBe('active')
      expect(state.filters.health).toBe('healthy')
      expect(state.filters.owner).toBe(1)
      expect(state.filters.search).toBe('project')
      expect(state.filters.page).toBe(1)
    })

    it('should replace existing filters', () => {
      useProjectStore.getState().setFilters({ status: 'active', health: 'healthy' })
      useProjectStore.getState().setFilters({ status: 'completed' })

      const state = useProjectStore.getState()
      expect(state.filters.status).toBe('completed')
      // Note: Previous filters are replaced, not merged
    })
  })

  describe('setLoading action', () => {
    it('should set loading to true', () => {
      useProjectStore.getState().setLoading(true)

      const state = useProjectStore.getState()
      expect(state.loading).toBe(true)
    })

    it('should set loading to false', () => {
      useProjectStore.getState().setLoading(true)
      useProjectStore.getState().setLoading(false)

      const state = useProjectStore.getState()
      expect(state.loading).toBe(false)
    })

    it('should toggle loading multiple times', () => {
      useProjectStore.getState().setLoading(true)
      expect(useProjectStore.getState().loading).toBe(true)

      useProjectStore.getState().setLoading(false)
      expect(useProjectStore.getState().loading).toBe(false)

      useProjectStore.getState().setLoading(true)
      expect(useProjectStore.getState().loading).toBe(true)
    })
  })

  describe('setError action', () => {
    it('should set error message', () => {
      useProjectStore.getState().setError('Something went wrong')

      const state = useProjectStore.getState()
      expect(state.error).toBe('Something went wrong')
    })

    it('should clear error by setting to null', () => {
      useProjectStore.getState().setError('Error message')
      useProjectStore.getState().setError(null)

      const state = useProjectStore.getState()
      expect(state.error).toBeNull()
    })

    it('should replace existing error', () => {
      useProjectStore.getState().setError('First error')
      useProjectStore.getState().setError('Second error')

      const state = useProjectStore.getState()
      expect(state.error).toBe('Second error')
    })

    it('should handle empty string error', () => {
      useProjectStore.getState().setError('')

      const state = useProjectStore.getState()
      expect(state.error).toBe('')
    })
  })

  describe('updateProject action', () => {
    it('should update existing project in list', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2])

      const updatedProject = { ...mockProject1, title: 'Updated Title', progress: 75 }
      useProjectStore.getState().updateProject(updatedProject)

      const state = useProjectStore.getState()
      const project = state.projects.find(p => p.id === 1)
      expect(project?.title).toBe('Updated Title')
      expect(project?.progress).toBe(75)
    })

    it('should not modify other projects', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2, mockProject3])

      const updatedProject = { ...mockProject2, title: 'Modified Beta' }
      useProjectStore.getState().updateProject(updatedProject)

      const state = useProjectStore.getState()
      expect(state.projects[0]).toEqual(mockProject1)
      expect(state.projects[2]).toEqual(mockProject3)
    })

    it('should update selected project if it matches', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2])
      useProjectStore.getState().setSelectedProject(mockProject1)

      const updatedProject = { ...mockProject1, title: 'Updated Selected' }
      useProjectStore.getState().updateProject(updatedProject)

      const state = useProjectStore.getState()
      expect(state.selectedProject?.title).toBe('Updated Selected')
    })

    it('should not update selected project if it does not match', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2])
      useProjectStore.getState().setSelectedProject(mockProject1)

      const updatedProject = { ...mockProject2, title: 'Updated Beta' }
      useProjectStore.getState().updateProject(updatedProject)

      const state = useProjectStore.getState()
      expect(state.selectedProject).toEqual(mockProject1)
    })

    it('should handle updating non-existent project', () => {
      useProjectStore.getState().setProjects([mockProject1])

      const nonExistentProject = { ...mockProject2, id: 999 }
      useProjectStore.getState().updateProject(nonExistentProject)

      const state = useProjectStore.getState()
      expect(state.projects.length).toBe(1)
      expect(state.projects[0]).toEqual(mockProject1)
    })

    it('should update project with partial changes', () => {
      useProjectStore.getState().setProjects([mockProject1])

      const updatedProject = { ...mockProject1, progress: 90 }
      useProjectStore.getState().updateProject(updatedProject)

      const state = useProjectStore.getState()
      const project = state.projects[0]
      expect(project.progress).toBe(90)
      expect(project.title).toBe(mockProject1.title)
      expect(project.description).toBe(mockProject1.description)
    })
  })

  describe('deleteProject action', () => {
    it('should remove project from list', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2, mockProject3])

      useProjectStore.getState().deleteProject(2)

      const state = useProjectStore.getState()
      expect(state.projects.length).toBe(2)
      expect(state.projects.find(p => p.id === 2)).toBeUndefined()
    })

    it('should not affect other projects', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2, mockProject3])

      useProjectStore.getState().deleteProject(2)

      const state = useProjectStore.getState()
      expect(state.projects[0]).toEqual(mockProject1)
      expect(state.projects[1]).toEqual(mockProject3)
    })

    it('should clear selected project if it matches deleted project', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2])
      useProjectStore.getState().setSelectedProject(mockProject1)

      useProjectStore.getState().deleteProject(1)

      const state = useProjectStore.getState()
      expect(state.selectedProject).toBeNull()
    })

    it('should not clear selected project if it does not match', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2])
      useProjectStore.getState().setSelectedProject(mockProject1)

      useProjectStore.getState().deleteProject(2)

      const state = useProjectStore.getState()
      expect(state.selectedProject).toEqual(mockProject1)
    })

    it('should handle deleting non-existent project', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2])

      useProjectStore.getState().deleteProject(999)

      const state = useProjectStore.getState()
      expect(state.projects.length).toBe(2)
    })

    it('should handle empty projects list', () => {
      useProjectStore.getState().setProjects([])

      useProjectStore.getState().deleteProject(1)

      const state = useProjectStore.getState()
      expect(state.projects).toEqual([])
    })
  })

  describe('clearFilters action', () => {
    it('should clear all filters', () => {
      useProjectStore.getState().setFilters({
        status: 'active',
        health: 'healthy',
        owner: 1,
        tags: [1, 2],
        search: 'test',
        page: 2,
        page_size: 20,
        ordering: '-created_at',
      })

      useProjectStore.getState().clearFilters()

      const state = useProjectStore.getState()
      expect(state.filters).toEqual({})
    })

    it('should handle clearing already empty filters', () => {
      useProjectStore.getState().clearFilters()

      const state = useProjectStore.getState()
      expect(state.filters).toEqual({})
    })

    it('should not affect other state', () => {
      useProjectStore.getState().setProjects([mockProject1])
      useProjectStore.getState().setSelectedProject(mockProject1)
      useProjectStore.getState().setLoading(true)
      useProjectStore.getState().setError('error')
      useProjectStore.getState().setFilters({ status: 'active' })

      useProjectStore.getState().clearFilters()

      const state = useProjectStore.getState()
      expect(state.projects.length).toBe(1)
      expect(state.selectedProject).toEqual(mockProject1)
      expect(state.loading).toBe(true)
      expect(state.error).toBe('error')
      expect(state.filters).toEqual({})
    })
  })

  describe('Complex scenarios', () => {
    it('should handle full CRUD workflow', () => {
      // Create
      useProjectStore.getState().setProjects([mockProject1])
      expect(useProjectStore.getState().projects.length).toBe(1)

      // Read
      useProjectStore.getState().setSelectedProject(mockProject1)
      expect(useProjectStore.getState().selectedProject).toEqual(mockProject1)

      // Update
      const updated = { ...mockProject1, title: 'Updated' }
      useProjectStore.getState().updateProject(updated)
      expect(useProjectStore.getState().projects[0].title).toBe('Updated')

      // Delete
      useProjectStore.getState().deleteProject(1)
      expect(useProjectStore.getState().projects.length).toBe(0)
      expect(useProjectStore.getState().selectedProject).toBeNull()
    })

    it('should handle loading and error states together', () => {
      useProjectStore.getState().setLoading(true)
      useProjectStore.getState().setError('Loading error')

      const state = useProjectStore.getState()
      expect(state.loading).toBe(true)
      expect(state.error).toBe('Loading error')

      useProjectStore.getState().setLoading(false)
      useProjectStore.getState().setError(null)

      const clearedState = useProjectStore.getState()
      expect(clearedState.loading).toBe(false)
      expect(clearedState.error).toBeNull()
    })

    it('should handle filtering and project updates together', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2])
      useProjectStore.getState().setFilters({ status: 'active' })

      const updated = { ...mockProject1, status: 'completed' as const }
      useProjectStore.getState().updateProject(updated)

      const state = useProjectStore.getState()
      expect(state.filters.status).toBe('active')
      expect(state.projects[0].status).toBe('completed')
    })

    it('should maintain state consistency across multiple operations', () => {
      // Initial setup
      useProjectStore.getState().setProjects([mockProject1, mockProject2, mockProject3])
      useProjectStore.getState().setFilters({ status: 'active' })
      useProjectStore.getState().setSelectedProject(mockProject2)

      // Update
      const updated = { ...mockProject2, progress: 80 }
      useProjectStore.getState().updateProject(updated)

      // Delete another project
      useProjectStore.getState().deleteProject(3)

      // Check state consistency
      const state = useProjectStore.getState()
      expect(state.projects.length).toBe(2)
      expect(state.selectedProject?.progress).toBe(80)
      expect(state.filters.status).toBe('active')
    })

    it('should handle rapid state changes', () => {
      useProjectStore.getState().setLoading(true)
      useProjectStore.getState().setProjects([mockProject1])
      useProjectStore.getState().setLoading(false)
      useProjectStore.getState().setSelectedProject(mockProject1)
      useProjectStore.getState().setFilters({ status: 'active' })
      useProjectStore.getState().clearFilters()

      const state = useProjectStore.getState()
      expect(state.loading).toBe(false)
      expect(state.projects.length).toBe(1)
      expect(state.selectedProject).toEqual(mockProject1)
      expect(state.filters).toEqual({})
    })
  })

  describe('Edge cases', () => {
    it('should handle updating project with same data', () => {
      useProjectStore.getState().setProjects([mockProject1])
      useProjectStore.getState().updateProject(mockProject1)

      const state = useProjectStore.getState()
      expect(state.projects[0]).toEqual(mockProject1)
    })

    it('should handle deleting same project multiple times', () => {
      useProjectStore.getState().setProjects([mockProject1, mockProject2])

      useProjectStore.getState().deleteProject(1)
      useProjectStore.getState().deleteProject(1)
      useProjectStore.getState().deleteProject(1)

      const state = useProjectStore.getState()
      expect(state.projects.length).toBe(1)
      expect(state.projects[0]).toEqual(mockProject2)
    })

    it('should handle setting null selected project multiple times', () => {
      useProjectStore.getState().setSelectedProject(mockProject1)
      useProjectStore.getState().setSelectedProject(null)
      useProjectStore.getState().setSelectedProject(null)

      const state = useProjectStore.getState()
      expect(state.selectedProject).toBeNull()
    })

    it('should handle large project arrays', () => {
      const manyProjects = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProject1,
        id: i + 1,
        title: `Project ${i + 1}`,
      }))

      useProjectStore.getState().setProjects(manyProjects)

      const state = useProjectStore.getState()
      expect(state.projects.length).toBe(1000)
    })

    it('should handle complex filter combinations', () => {
      const complexFilters = {
        status: 'active',
        health: 'healthy',
        owner: 1,
        tags: [1, 2, 3, 4, 5],
        search: 'complex search query with special chars !@#$%',
        page: 10,
        page_size: 100,
        ordering: '-created_at',
      }

      useProjectStore.getState().setFilters(complexFilters)

      const state = useProjectStore.getState()
      expect(state.filters).toEqual(complexFilters)
    })
  })
})
