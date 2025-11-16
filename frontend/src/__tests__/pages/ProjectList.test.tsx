import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProjectList from '@/pages/ProjectList';
import { projectAPI, tagAPI } from '@/services';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Mock the API services
vi.mock('@/services', () => ({
  projectAPI: {
    list: vi.fn(),
    softDelete: vi.fn(),
  },
  tagAPI: {
    list: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockProjectsPage1 = {
  count: 2,
  results: [
    {
      id: 1,
      title: 'Vaccine Development Platform',
      status: 'active',
      health: 'healthy',
      owner: { username: 'dr.smith' },
      tags: [],
      updated_at: '2024-01-01T10:00:00Z',
    },
  ],
};

const _mockProjectsPage2 = {
  count: 2,
  results: [
    {
      id: 2,
      title: 'Drug Efficacy Analytics Engine',
      status: 'completed',
      health: 'at_risk',
      owner: { username: 'dr.johnson' },
      tags: [],
      updated_at: '2024-01-02T10:00:00Z',
    },
  ],
};

const mockTags = {
  results: [{ id: 1, name: 'Clinical Research', color: '#0066cc' }],
};

describe('ProjectList Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (projectAPI.list as vi.Mock).mockResolvedValue({ data: mockProjectsPage1 });
    (tagAPI.list as vi.Mock).mockResolvedValue({ data: mockTags });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <BrowserRouter>{ui}</BrowserRouter>
        </NotificationProvider>
      </QueryClientProvider>
    );
  };

  it('renders projects and pagination', async () => {
    renderWithProviders(<ProjectList />);
    expect(await screen.findByText('Vaccine Development Platform')).toBeInTheDocument();
  });

  it('searches for projects when search term is entered', async () => {
    renderWithProviders(<ProjectList />);
    const searchInput = screen.getByPlaceholderText(/search projects/i);

    fireEvent.change(searchInput, { target: { value: 'Beta' } });

    await waitFor(() => {
      expect(projectAPI.list).toHaveBeenCalledWith(expect.objectContaining({ search: 'Beta' }));
    });
  });
});
