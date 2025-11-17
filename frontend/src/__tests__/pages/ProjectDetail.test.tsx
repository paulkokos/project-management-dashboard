import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectDetail from '@/pages/ProjectDetail';
import { projectAPI } from '@/services';
import { useAuthStore } from '@/stores/authStore';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Mock services and hooks
vi.mock('@/services', () => ({
  projectAPI: {
    get: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock('@/hooks', () => ({
  useProjectUpdates: vi.fn(() => undefined),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const mockProject = {
  id: 1,
  title: 'Vaccine Development Platform',
  description:
    'Build a comprehensive platform for vaccine research and development tracking across clinical trials',
  owner: { id: 1, username: 'dr.smith' },
  team_members_details: [],
  milestones: [],
  recent_activities: [],
};

describe('ProjectDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (projectAPI.get as vi.Mock).mockResolvedValue({ data: mockProject });
  });

  const renderComponent = (user: any) => {
    // Mock the auth store
    useAuthStore.setState({ user, isAuthenticated: true });

    return render(
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <MemoryRouter initialEntries={['/projects/1']}>
            <Routes>
              <Route path="/projects/:id" element={<ProjectDetail />} />
            </Routes>
          </MemoryRouter>
        </NotificationProvider>
      </QueryClientProvider>
    );
  };

  it('renders project details correctly', async () => {
    renderComponent({ id: 1, username: 'dr.smith' });
    expect(await screen.findByText('Vaccine Development Platform')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Build a comprehensive platform for vaccine research and development tracking across clinical trials'
      )
    ).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    (projectAPI.get as vi.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    renderComponent({ id: 1, username: 'owner' });
    const loadingElements = screen.getAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  describe('Permissions for Project Owner', () => {
    it('enables Edit and Delete buttons for the project owner', async () => {
      renderComponent({ id: 1, username: 'owner' });
      expect(await screen.findByRole('button', { name: /edit/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /delete/i })).not.toBeDisabled();
    });
  });

  describe('Permissions for Non-Owner', () => {
    it('disables Edit and Delete buttons for a non-owner team member', async () => {
      const nonOwner = { id: 2, username: 'member' };
      renderComponent(nonOwner);
      expect(await screen.findByRole('button', { name: /edit/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    });
  });

  it('calls navigate when Edit button is clicked', async () => {
    renderComponent({ id: 1, username: 'owner' });
    const editButton = await screen.findByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    expect(mockNavigate).toHaveBeenCalledWith('/projects/1/edit');
  });

  it('calls softDelete mutation when Delete button is clicked and confirmed', async () => {
    (projectAPI.softDelete as vi.Mock).mockResolvedValue({});
    window.confirm = vi.fn(() => true);

    renderComponent({ id: 1, username: 'owner' });
    const deleteButton = await screen.findByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(projectAPI.softDelete).toHaveBeenCalledWith(1);
    });
  });
});
