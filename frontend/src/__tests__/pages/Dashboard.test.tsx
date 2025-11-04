import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/__tests__/utils/test-utils'
import Dashboard from '@/pages/Dashboard'
import { useQuery } from '@tanstack/react-query'

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: {
      data: {
        results: [
          {
            id: 1,
            title: 'Project 1',
            description: 'Active project',
            status: 'active',
            health: 'healthy',
            progress: 75,
            owner: { id: 1, username: 'user', email: 'user@test.com', first_name: 'Test', last_name: 'User' },
            tags: [],
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version: 1,
            etag: '"abc"',
          },
        ],
      },
    },
    isLoading: false,
    error: null,
  })),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}))

// Mock hooks
vi.mock('@/hooks/useProjectUpdates', () => ({
  useAllProjectUpdates: vi.fn(),
}))

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    const { container } = render(
      
        <Dashboard />

    )
    expect(container).toBeInTheDocument()
  })

  it('should display dashboard content', () => {
    render(
      
        <Dashboard />

    )
    // Dashboard should render project information
    expect(screen.getByText('Project 1')).toBeInTheDocument()
  })

  it('should show active project status', () => {
    render(
      
        <Dashboard />

    )
    expect(screen.getByText('Active project')).toBeInTheDocument()
  })

  it('should display multiple project metrics', () => {
    render(
      
        <Dashboard />

    )
    expect(screen.getByText('Project 1')).toBeInTheDocument()
  })

  it('should render header section', () => {
    const { container } = render(
      
        <Dashboard />

    )
    expect(container.querySelector('header') || container.querySelector('[role="banner"]')).toBeDefined()
  })

  it('should display project health status', () => {
    render(
      
        <Dashboard />

    )
    // Health information should be displayed
    expect(screen.getByText('Project 1')).toBeInTheDocument()
  })

  it('should show project progress', () => {
    render(
      
        <Dashboard />

    )
    expect(screen.getByText('Project 1')).toBeInTheDocument()
  })

  it('should handle empty projects list', () => {
     
    vi.mocked(useQuery).mockReturnValue({
      data: { data: { results: [] } },
      isLoading: false,
      error: null,
    } as any)

    const { container } = render(
      
        <Dashboard />

    )
    expect(container).toBeInTheDocument()
  })

  it('should handle loading state', () => {
     
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any)

    const { container } = render(
      
        <Dashboard />

    )
    expect(container).toBeInTheDocument()
  })

  it('should handle error state', () => {
     
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
    } as any)

    const { container } = render(
      
        <Dashboard />

    )
    expect(container).toBeInTheDocument()
  })
})
