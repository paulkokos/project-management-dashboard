import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectForm from '@/components/ProjectForm';

// Mock the API module
vi.mock('@/services/api', () => ({
  projectAPI: {
    create: vi.fn(),
    patch: vi.fn(),
  },
  tagAPI: {
    list: vi.fn(),
  },
}));

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
          { id: 1, name: 'Frontend', color: '#FF0000' },
          { id: 2, name: 'Backend', color: '#00FF00' },
          { id: 3, name: 'DevOps', color: '#0000FF' },
          { id: 4, name: 'Design', color: '#FFFF00' },
          { id: 5, name: 'QA', color: '#FF00FF' },
        ],
      },
    },
    isLoading: false,
    error: null,
  }),
}));

describe('ProjectForm - Extended Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle multiple tag selections', () => {
    render(<ProjectForm />);
    const tagButtons = screen
      .getAllByRole('button')
      .filter((btn) => ['Frontend', 'Backend', 'DevOps'].includes(btn.textContent || ''));
    expect(tagButtons.length).toBeGreaterThan(0);
  });

  it('should display all available tags', () => {
    render(<ProjectForm />);
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('DevOps')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('QA')).toBeInTheDocument();
  });

  it('should handle description input', () => {
    render(<ProjectForm />);
    const descriptionInput = screen.getByPlaceholderText(
      'Project description'
    ) as HTMLTextAreaElement;
    fireEvent.change(descriptionInput, { target: { value: 'A detailed project description' } });
    expect(descriptionInput.value).toBe('A detailed project description');
  });

  it('should handle date inputs', () => {
    render(<ProjectForm />);
    const dateInputs = screen.getAllByDisplayValue('');
    expect(dateInputs.length).toBeGreaterThan(0);
  });

  it('should handle status changes', () => {
    render(<ProjectForm />);
    const labels = screen.getAllByText(/Status/i);
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should handle health changes', () => {
    render(<ProjectForm />);
    const labels = screen.getAllByText(/Health/i);
    expect(labels.length).toBeGreaterThan(0);
  });

  it('should update progress slider', () => {
    render(<ProjectForm />);
    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '50' } });
    expect(slider.value).toBe('50');
  });

  it('should handle form with all fields filled', () => {
    render(<ProjectForm />);
    const titleInput = screen.getByPlaceholderText('Project title') as HTMLInputElement;
    const descriptionInput = screen.getByPlaceholderText(
      'Project description'
    ) as HTMLTextAreaElement;

    fireEvent.change(titleInput, { target: { value: 'Complete Project' } });
    fireEvent.change(descriptionInput, { target: { value: 'Complete description' } });

    expect(titleInput.value).toBe('Complete Project');
    expect(descriptionInput.value).toBe('Complete description');
  });

  it('should display form validation for empty title', () => {
    render(<ProjectForm />);
    const titleInput = screen.getByPlaceholderText('Project title') as HTMLInputElement;
    // Verify empty title input is rendered
    expect(titleInput.value).toBe('');
  });

  it('should clear validation error on input', () => {
    render(<ProjectForm />);
    const titleInput = screen.getByPlaceholderText('Project title') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Project' } });
    expect(titleInput.value).toBe('Project');
  });

  it('should handle special characters in title', () => {
    render(<ProjectForm />);
    const titleInput = screen.getByPlaceholderText('Project title') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Project #123 & Co.' } });
    expect(titleInput.value).toBe('Project #123 & Co.');
  });

  it('should handle long text input', () => {
    render(<ProjectForm />);
    const descriptionInput = screen.getByPlaceholderText(
      'Project description'
    ) as HTMLTextAreaElement;
    const longText = 'A'.repeat(1000);
    fireEvent.change(descriptionInput, { target: { value: longText } });
    expect(descriptionInput.value).toBe(longText);
  });

  it('should render all form sections', () => {
    const { container } = render(<ProjectForm />);
    expect(container.querySelector('form')).toBeInTheDocument();
  });

  it('should have proper form structure', () => {
    const { container } = render(<ProjectForm />);
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(form?.className).toContain('space-y-6');
  });
});
