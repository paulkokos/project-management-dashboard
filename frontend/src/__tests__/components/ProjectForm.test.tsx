import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ProjectForm from '@/components/ProjectForm'

// Mock the API module
vi.mock('@/services/api', () => ({
  projectAPI: {
    create: vi.fn(),
    patch: vi.fn(),
  },
  tagAPI: {
    list: vi.fn(),
  },
}))

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    data: null,
  }),
  useQuery: () => ({
    data: {
      data: {
        results: [
          { id: 1, name: 'Tag1', color: '#FF0000' },
          { id: 2, name: 'Tag2', color: '#00FF00' },
        ],
      },
    },
    isLoading: false,
    error: null,
  }),
}))

describe('ProjectForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form fields', () => {
    render(<ProjectForm />)
    expect(screen.getByPlaceholderText('Project title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Project description')).toBeInTheDocument()
  })

  it('should display title placeholder', () => {
    render(<ProjectForm />)
    const titleInput = screen.getByPlaceholderText('Project title') as HTMLInputElement
    expect(titleInput.value).toBe('')
  })

  it('should update form data on input change', () => {
    render(<ProjectForm />)
    const titleInput = screen.getByPlaceholderText('Project title') as HTMLInputElement
    fireEvent.change(titleInput, { target: { value: 'New Project' } })
    expect(titleInput.value).toBe('New Project')
  })

  it('should display status select', () => {
    render(<ProjectForm />)
    const labels = screen.getAllByText(/Status/i)
    expect(labels.length).toBeGreaterThan(0)
  })

  it('should display health select', () => {
    render(<ProjectForm />)
    const labels = screen.getAllByText(/Health/i)
    expect(labels.length).toBeGreaterThan(0)
  })

  it('should display progress slider', () => {
    render(<ProjectForm />)
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })

  it('should display tags', () => {
    render(<ProjectForm />)
    expect(screen.getByText('Tag1')).toBeInTheDocument()
    expect(screen.getByText('Tag2')).toBeInTheDocument()
  })

  it('should have submit button', () => {
    render(<ProjectForm />)
    const submitButtons = screen.getAllByRole('button')
    expect(submitButtons.length).toBeGreaterThan(0)
  })

  it('should render form with all sections', () => {
    const { container } = render(<ProjectForm />)
    const form = container.querySelector('form')
    expect(form).toBeInTheDocument()
    expect(form?.className).toContain('space-y-6')
  })

  it('should have all form buttons', () => {
    render(<ProjectForm />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
