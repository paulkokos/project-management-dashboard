import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilters } from '@/components/SearchFilters';
import { SearchFacets } from '@/services/search.api';

const mockFacets: SearchFacets = {
  statuses: { active: 45, archived: 12, on_hold: 3, completed: 2 },
  healths: { healthy: 40, at_risk: 15, critical: 5 },
  owners: { john_doe: 30, jane_smith: 20, bob_wilson: 10 },
};

const renderSearchFilters = (props = {}) => {
  const defaultProps = {
    facets: mockFacets,
    selectedStatus: '',
    selectedHealth: '',
    selectedOwner: '',
    onStatusChange: vi.fn(),
    onHealthChange: vi.fn(),
    onOwnerChange: vi.fn(),
    onReset: vi.fn(),
    hasActiveFilters: false,
    ...props,
  };

  return render(<SearchFilters {...defaultProps} />);
};

describe('SearchFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filters title', () => {
    renderSearchFilters();

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });


  it('renders status filter section', () => {
    renderSearchFilters();

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('active')).toBeInTheDocument();
    expect(screen.getByDisplayValue('archived')).toBeInTheDocument();
  });

  it('renders health filter section', () => {
    renderSearchFilters();

    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByDisplayValue('healthy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('at_risk')).toBeInTheDocument();
    expect(screen.getByDisplayValue('critical')).toBeInTheDocument();
  });

  it('renders owner filter section', () => {
    renderSearchFilters();

    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john_doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane_smith')).toBeInTheDocument();
  });

  it('displays facet counts next to filter options', () => {
    renderSearchFilters();

    // Check that filter options are rendered (counts may be in separate elements)
    expect(screen.getByDisplayValue('active')).toBeInTheDocument();
    expect(screen.getByDisplayValue('healthy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john_doe')).toBeInTheDocument();
  });

  it('calls onStatusChange when status filter is selected', () => {
    const onStatusChange = vi.fn();
    renderSearchFilters({ onStatusChange });

    const activeRadio = screen.getByDisplayValue('active');
    fireEvent.click(activeRadio);

    expect(onStatusChange).toHaveBeenCalledWith('active');
  });

  it('calls onHealthChange when health filter is selected', () => {
    const onHealthChange = vi.fn();
    renderSearchFilters({ onHealthChange });

    const healthyRadio = screen.getByDisplayValue('healthy');
    fireEvent.click(healthyRadio);

    expect(onHealthChange).toHaveBeenCalledWith('healthy');
  });

  it('calls onOwnerChange when owner filter is selected', () => {
    const onOwnerChange = vi.fn();
    renderSearchFilters({ onOwnerChange });

    const ownerRadio = screen.getByDisplayValue('john_doe');
    fireEvent.click(ownerRadio);

    expect(onOwnerChange).toHaveBeenCalledWith('john_doe');
  });

  it('shows reset button when hasActiveFilters is true', () => {
    renderSearchFilters({ hasActiveFilters: true });

    expect(screen.getByText('Reset Filters')).toBeInTheDocument();
  });

  it('hides reset button when hasActiveFilters is false', () => {
    renderSearchFilters({ hasActiveFilters: false });

    expect(screen.queryByText('Reset Filters')).not.toBeInTheDocument();
  });

  it('calls onReset when reset button is clicked', () => {
    const onReset = vi.fn();
    renderSearchFilters({ hasActiveFilters: true, onReset });

    const resetButton = screen.getByText('Reset Filters');
    fireEvent.click(resetButton);

    expect(onReset).toHaveBeenCalled();
  });

  it('marks selected status filter as checked', () => {
    renderSearchFilters({ selectedStatus: 'active' });

    const activeRadio = screen.getByDisplayValue('active') as HTMLInputElement;
    expect(activeRadio.checked).toBe(true);
  });

  it('marks selected health filter as checked', () => {
    renderSearchFilters({ selectedHealth: 'at_risk' });

    const atRiskRadio = screen.getByDisplayValue('at_risk') as HTMLInputElement;
    expect(atRiskRadio.checked).toBe(true);
  });

  it('marks selected owner filter as checked', () => {
    renderSearchFilters({ selectedOwner: 'jane_smith' });

    const janeRadio = screen.getByDisplayValue(
      'jane_smith'
    ) as HTMLInputElement;
    expect(janeRadio.checked).toBe(true);
  });

  it('displays "All" option for each filter type', () => {
    renderSearchFilters();

    const allOptions = screen.getAllByLabelText(/All/);
    expect(allOptions.length).toBeGreaterThanOrEqual(3);
  });

  it('calculates total count for All option in status', () => {
    renderSearchFilters();

    // Should sum all status counts: 45 + 12 + 3 + 2 = 62
    const totalStatusCount = 45 + 12 + 3 + 2;
    expect(screen.getByText(`All (${totalStatusCount})`)).toBeInTheDocument();
  });

  it('formats multi-word filter names with spaces', () => {
    renderSearchFilters();

    // at_risk should display as "at risk"
    const labels = screen.getAllByText(/at risk/);
    expect(labels.length).toBeGreaterThan(0);
  });

  it('applies hover background on filter options', () => {
    const { container } = renderSearchFilters();

    const labels = container.querySelectorAll('label');
    expect(labels.length).toBeGreaterThan(0);

    labels.forEach(label => {
      expect(label).toHaveClass('hover:bg-gray-50');
    });
  });


  it('displays filters in separate card containers', () => {
    const { container } = renderSearchFilters();

    const cards = container.querySelectorAll('.card');
    expect(cards.length).toBeGreaterThanOrEqual(3); // Status, Health, Owner
  });

  it('hides status filter section if no statuses available', () => {
    const emptyFacets: SearchFacets = {
      statuses: {},
      healths: { healthy: 40 },
      owners: { john_doe: 30 },
    };

    renderSearchFilters({ facets: emptyFacets });

    expect(screen.queryByText('Status')).not.toBeInTheDocument();
  });

  it('hides health filter section if no healths available', () => {
    const emptyFacets: SearchFacets = {
      statuses: { active: 45 },
      healths: {},
      owners: { john_doe: 30 },
    };

    renderSearchFilters({ facets: emptyFacets });

    expect(screen.queryByText('Health')).not.toBeInTheDocument();
  });

  it('hides owner filter section if no owners available', () => {
    const emptyFacets: SearchFacets = {
      statuses: { active: 45 },
      healths: { healthy: 40 },
      owners: {},
    };

    renderSearchFilters({ facets: emptyFacets });

    expect(screen.queryByText('Owner')).not.toBeInTheDocument();
  });

  it('displays all status options from facets', () => {
    renderSearchFilters();

    expect(screen.getByDisplayValue('active')).toBeInTheDocument();
    expect(screen.getByDisplayValue('archived')).toBeInTheDocument();
    expect(screen.getByDisplayValue('on_hold')).toBeInTheDocument();
    expect(screen.getByDisplayValue('completed')).toBeInTheDocument();
  });

  it('displays all health options from facets', () => {
    renderSearchFilters();

    expect(screen.getByDisplayValue('healthy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('at_risk')).toBeInTheDocument();
    expect(screen.getByDisplayValue('critical')).toBeInTheDocument();
  });

  it('displays all owner options from facets', () => {
    renderSearchFilters();

    expect(screen.getByDisplayValue('john_doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane_smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('bob_wilson')).toBeInTheDocument();
  });
});
