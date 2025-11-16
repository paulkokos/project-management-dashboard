import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { searchAPI } from '@/services/search.api';

// Note: searchAPI is globally mocked in setup.ts

const mockSuggestions = {
  data: {
    suggestions: [
      { title: 'Mobile App Development', id: 1, type: 'project' },
      { title: 'Mobile Backend Service', id: 2, type: 'project' },
    ],
  },
};

const renderAutocomplete = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSearch: vi.fn(),
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <SearchAutocomplete {...defaultProps} />
    </QueryClientProvider>
  );
};

describe('SearchAutocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input field', () => {
    renderAutocomplete();

    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const onChange = vi.fn();
    renderAutocomplete({ onChange });

    const input = screen.getByPlaceholderText('Search projects...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });

    expect(onChange).toHaveBeenCalledWith('test');
  });

  it('does not fetch suggestions if input is less than 2 characters', async () => {
    (searchAPI.autocomplete as any).mockResolvedValue(mockSuggestions);

    renderAutocomplete();

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.change(input, { target: { value: 'a' } });

    await waitFor(() => {
      expect(searchAPI.autocomplete).not.toHaveBeenCalled();
    });
  });

  it('displays suggestions when available', async () => {
    (searchAPI.autocomplete as any).mockResolvedValue(mockSuggestions as any);

    renderAutocomplete({ value: 'mobile' });

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
      expect(screen.getByText('Mobile Backend Service')).toBeInTheDocument();
    });

    vi.restoreAllMocks();
  });

  it('calls onSearch when Enter key is pressed', () => {
    const onSearch = vi.fn();
    renderAutocomplete({ value: 'mobile', onSearch });

    const input = screen.getByPlaceholderText('Search projects...') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSearch).toHaveBeenCalled();
  });

  it('calls onChange with suggestion title when suggestion is clicked', async () => {
    const onChange = vi.fn();
    const onSearch = vi.fn();

    (searchAPI.autocomplete as any).mockResolvedValue(mockSuggestions as any);

    renderAutocomplete({ value: 'mobile', onChange, onSearch });

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    });

    const suggestion = screen.getByText('Mobile App Development');
    fireEvent.click(suggestion);

    expect(onChange).toHaveBeenCalledWith('Mobile App Development');
    expect(onSearch).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('hides suggestions when clicking outside', async () => {
    (searchAPI.autocomplete as any).mockResolvedValue(mockSuggestions as any);

    const { container } = render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false } },
          })
        }
      >
        <SearchAutocomplete value="mobile" onChange={vi.fn()} onSearch={vi.fn()} />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Mobile App Development')).toBeInTheDocument();
    });

    fireEvent.mouseDown(container);

    await waitFor(() => {
      expect(screen.queryByText('Mobile App Development')).not.toBeInTheDocument();
    });

    vi.restoreAllMocks();
  });

  it('displays loading spinner during autocomplete fetch', async () => {
    (searchAPI.autocomplete as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockSuggestions as any), 100))
    );

    renderAutocomplete({ value: 'mobile' });

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.focus(input);

    await waitFor(
      () => {
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      },
      { timeout: 100 }
    );

    vi.restoreAllMocks();
  });

  it('displays no suggestions message when search returns empty', async () => {
    const emptySuggestions = {
      data: {
        suggestions: [],
      },
    };

    (searchAPI.autocomplete as any).mockResolvedValue(emptySuggestions as any);

    renderAutocomplete({ value: 'nonexistent' });

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('No suggestions found')).toBeInTheDocument();
    });

    vi.restoreAllMocks();
  });

  it('accepts custom placeholder', () => {
    renderAutocomplete({ placeholder: 'Custom search...' });

    expect(screen.getByPlaceholderText('Custom search...')).toBeInTheDocument();
  });

  it('displays suggestion type', async () => {
    (searchAPI.autocomplete as any).mockResolvedValue(mockSuggestions as any);

    renderAutocomplete({ value: 'mobile' });

    const input = screen.getByPlaceholderText('Search projects...');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getAllByText('project').length).toBeGreaterThan(0);
    });

    vi.restoreAllMocks();
  });
});
