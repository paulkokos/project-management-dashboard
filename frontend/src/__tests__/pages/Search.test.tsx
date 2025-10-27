import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Search from '@/pages/Search';
import { searchAPI } from '@/services/search.api';

const mockSearchResponse = {
  data: {
    results: [
      {
        id: 1,
        title: 'Mobile App Development',
        description: 'Build iOS and Android applications',
        owner: { id: 1, username: 'john_doe' },
        status: 'active',
        health: 'healthy',
        progress: 75,
        tags: [
          { id: 1, name: 'mobile', color: '#FF6B6B' },
          { id: 2, name: 'frontend', color: '#4ECDC4' },
        ],
        created_at: '2025-10-01T10:00:00Z',
        updated_at: '2025-10-27T15:30:00Z',
      },
    ],
    facets: {
      statuses: { active: 45, archived: 12, on_hold: 3 },
      healths: { healthy: 40, at_risk: 15, critical: 5 },
      owners: { john_doe: 30, jane_smith: 20 },
    },
    total: 1,
    page: 1,
    page_size: 20,
    total_pages: 1,
  },
};

const mockAutocompleteResponse = {
  data: {
    suggestions: [
      { title: 'Mobile App Development', id: 1, type: 'project' },
      { title: 'Mobile Backend Service', id: 2, type: 'project' },
    ],
  },
};

const renderSearch = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Search Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock implementations
    (searchAPI.search as any).mockResolvedValue({
      data: {
        results: [],
        facets: { statuses: {}, healths: {}, owners: {} },
        total: 0,
        page: 1,
        page_size: 20,
        total_pages: 0,
      },
    });
    (searchAPI.autocomplete as any).mockResolvedValue({
      data: {
        suggestions: [],
      },
    });
  });

  it('renders search page with autocomplete input', () => {
    renderSearch();

    expect(screen.getByText('Search Projects')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search projects...')
    ).toBeInTheDocument();
  });

  it('displays initial state with no search performed', () => {
    renderSearch();

    // The component should show "Find projects by title..." description when no search yet
    expect(
      screen.getByText('Find projects by title, description, tags, and more using full-text search')
    ).toBeInTheDocument();
  });

  it('shows autocomplete suggestions when typing', async () => {
    (searchAPI.autocomplete as any).mockResolvedValue(mockAutocompleteResponse);

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'mobile' } });

    await waitFor(
      () => {
        expect(searchAPI.autocomplete).toHaveBeenCalledWith(
          expect.objectContaining({
            q: 'mobile',
          })
        );
      },
      { timeout: 2000 }
    );
  });

  it('performs search when query is submitted', async () => {
    (searchAPI.search as any).mockResolvedValue(mockSearchResponse);

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'mobile' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(
      () => {
        expect(searchAPI.search).toHaveBeenCalledWith(
          expect.objectContaining({
            q: 'mobile',
          })
        );
      },
      { timeout: 2000 }
    );
  });

  it('displays search results after successful search', async () => {
    (searchAPI.search as any).mockResolvedValue(mockSearchResponse);

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'mobile' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(
        screen.getByText('Mobile App Development')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Build iOS and Android applications')
      ).toBeInTheDocument();
    });
  });

  it('displays facets in filter sidebar', async () => {
    (searchAPI.search as any).mockResolvedValue(mockSearchResponse);

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'mobile' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Health')).toBeInTheDocument();
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });
  });

  it('filters results by status', async () => {
    (searchAPI.search as any).mockResolvedValue(mockSearchResponse);

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'mobile' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    const statusRadio = screen.getByDisplayValue('active');
    fireEvent.click(statusRadio);

    await waitFor(() => {
      expect(searchAPI.search).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
        })
      );
    });
  });

  it('filters results by health', async () => {
    (searchAPI.search as any).mockResolvedValue(mockSearchResponse);

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'mobile' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Health')).toBeInTheDocument();
    });

    const healthRadio = screen.getByDisplayValue('healthy');
    fireEvent.click(healthRadio);

    await waitFor(() => {
      expect(searchAPI.search).toHaveBeenCalledWith(
        expect.objectContaining({
          health: 'healthy',
        })
      );
    });
  });

  it('filters results by owner', async () => {
    (searchAPI.search as any).mockResolvedValue(mockSearchResponse);

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'mobile' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    const ownerRadio = screen.getByDisplayValue('john_doe');
    fireEvent.click(ownerRadio);

    await waitFor(() => {
      expect(searchAPI.search).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'john_doe',
        })
      );
    });
  });


  it('displays no results message when search returns empty', async () => {
    const emptyResponse = {
      data: {
        ...mockSearchResponse.data,
        results: [],
        total: 0,
        total_pages: 0,
      },
    };

    (searchAPI.search as any).mockResolvedValue(emptyResponse);

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('No results')).toBeInTheDocument();
    });
  });

  it('displays loading state during search', async () => {
    (searchAPI.search as any).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(() => resolve(mockSearchResponse), 100)
        )
    );

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'mobile' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Loading skeleton should appear briefly
    await waitFor(
      () => {
        const skeletons = document.querySelectorAll('.animate-pulse');
        expect(skeletons.length).toBeGreaterThan(0);
      },
      { timeout: 100 }
    );
  });

  it('displays tags in result card', async () => {
    (searchAPI.search as any).mockResolvedValue(mockSearchResponse);

    renderSearch();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'mobile' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('mobile')).toBeInTheDocument();
      expect(screen.getByText('frontend')).toBeInTheDocument();
    });
  });

});
