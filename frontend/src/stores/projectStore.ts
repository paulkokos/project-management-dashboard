import { create } from 'zustand'
import { Project } from '@/types'

interface ProjectFilters {
  status?: string
  health?: string
  owner?: number
  tags?: number[]
  search?: string
  page?: number
  page_size?: number
  ordering?: string
}

interface ProjectState {
  projects: Project[]
  selectedProject: Project | null
  filters: ProjectFilters
  loading: boolean
  error: string | null

  setProjects: (projects: Project[]) => void
  setSelectedProject: (project: Project | null) => void
  setFilters: (filters: ProjectFilters) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  updateProject: (project: Project) => void
  deleteProject: (projectId: number) => void
  clearFilters: () => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  filters: {},
  loading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setSelectedProject: (project) => set({ selectedProject: project }),
  setFilters: (filters) => set({ filters }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id ? project : p
      ),
      selectedProject:
        state.selectedProject?.id === project.id
          ? project
          : state.selectedProject,
    })),

  deleteProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      selectedProject:
        state.selectedProject?.id === projectId
          ? null
          : state.selectedProject,
    })),

  clearFilters: () => set({ filters: {} }),
}))
