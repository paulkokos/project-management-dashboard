import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SearchResults } from '@/components/SearchResults';
import { SearchResponse } from '@/services/search.api';

const mockSearchResponse: SearchResponse = {
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
    {
      id: 2,
      title: 'Backend API Development',
      description: 'Create RESTful API for mobile apps',
      owner: { id: 1, username: 'john_doe' },
      status: 'active',
      health: 'at_risk',
      progress: 50,
      tags: [{ id: 3, name: 'backend', color: '#95E1D3' }],
      created_at: '2025-10-02T10:00:00Z',
      updated_at: '2025-10-26T12:00:00Z',
    },
  ],
  facets: {
    statuses: { active: 2, archived: 0 },
    healths: { healthy: 1, at_risk: 1 },
    owners: { john_doe: 2 },
  },
  total: 2,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

const renderSearchResults = (
  data: SearchResponse | undefined = mockSearchResponse,
  isLoading = false,
  onPageChange = vi.fn(),
  currentPage = 1
) => {
  return render(
    <BrowserRouter>
      <SearchResults
        data={data}
        isLoading={isLoading}
        onPageChange={onPageChange}
        currentPage={currentPage}
      />
    </BrowserRouter>
  );
};

describe('SearchResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = renderSearchResults(undefined, true);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays no results message when data is empty', () => {
    const emptyData: SearchResponse = {
      results: [],
      facets: { statuses: {}, healths: {}, owners: {} },
      total: 0,
      page: 1,
      page_size: 20,
      total_pages: 0,
    };

    renderSearchResults(emptyData);

    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your search or filters')
    ).toBeInTheDocument();
  });

  it('displays project results', () => {
    renderSearchResults();

    expect(
      screen.getByText('Mobile App Development')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Backend API Development')
    ).toBeInTheDocument();
  });

  it('displays project descriptions', () => {
    renderSearchResults();

    expect(
      screen.getByText('Build iOS and Android applications')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Create RESTful API for mobile apps')
    ).toBeInTheDocument();
  });

  it('displays owner usernames', () => {
    renderSearchResults();

    const owners = screen.getAllByText('john_doe');
    expect(owners.length).toBeGreaterThan(0);
  });

  it('displays project status', () => {
    renderSearchResults();

    const statusElements = screen.getAllByText('active');
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('displays project progress', () => {
    renderSearchResults();

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays tags', () => {
    renderSearchResults();

    expect(screen.getByText('mobile')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
  });


  it('displays tags up to 3, with more indicator if there are more', () => {
    const manyTagsData: SearchResponse = {
      results: [
        {
          ...mockSearchResponse.results[0],
          tags: [
            { id: 1, name: 'tag1', color: '#FF6B6B' },
            { id: 2, name: 'tag2', color: '#4ECDC4' },
            { id: 3, name: 'tag3', color: '#95E1D3' },
            { id: 4, name: 'tag4', color: '#FFE66D' },
            { id: 5, name: 'tag5', color: '#A8E6CF' },
          ],
        },
      ],
      facets: mockSearchResponse.facets,
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
    };

    renderSearchResults(manyTagsData);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
    expect(screen.queryByText('tag4')).not.toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('is a link to project detail page', () => {
    const { container } = renderSearchResults();

    const projectLinks = container.querySelectorAll(
      'a[href="/projects/1"]'
    );
    expect(projectLinks.length).toBeGreaterThan(0);
  });

});
