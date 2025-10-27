# @paulkokos/search-components

Reusable React search components with Elasticsearch integration. Includes autocomplete input, faceted filtering, and paginated results display.

## Features

- **SearchAutocomplete**: Debounced search input with real-time suggestions (300ms debounce)
- **SearchFilters**: Faceted filtering by status, health, owner with live counts
- **SearchResults**: Paginated results with project cards and metadata display

## Installation

```bash
npm install @paulkokos/search-components
```

## Usage

### SearchAutocomplete

Provides real-time search suggestions as user types.

```tsx
import { SearchAutocomplete } from '@paulkokos/search-components';

function MySearchComponent() {
  const [query, setQuery] = useState('');

  return (
    <SearchAutocomplete
      value={query}
      onChange={setQuery}
      onSearch={() => console.log('Search:', query)}
      placeholder="Search projects..."
    />
  );
}
```

**Props:**
- `value: string` - Current input value
- `onChange: (value: string) => void` - Called when input changes
- `onSearch: () => void` - Called when user presses Enter or clicks suggestion
- `placeholder?: string` - Input placeholder (default: "Search projects...")

### SearchFilters

Displays faceted filtering options based on search results.

```tsx
import { SearchFilters } from '@paulkokos/search-components';
import type { SearchFacets } from '@paulkokos/search-components';

function MyFilterComponent() {
  const [status, setStatus] = useState('');
  const [health, setHealth] = useState('');
  const [owner, setOwner] = useState('');

  const facets: SearchFacets = {
    statuses: { active: 45, archived: 12 },
    healths: { healthy: 40, at_risk: 15 },
    owners: { john_doe: 30, jane_smith: 20 }
  };

  return (
    <SearchFilters
      facets={facets}
      selectedStatus={status}
      selectedHealth={health}
      selectedOwner={owner}
      onStatusChange={setStatus}
      onHealthChange={setHealth}
      onOwnerChange={setOwner}
      onReset={() => {
        setStatus('');
        setHealth('');
        setOwner('');
      }}
      hasActiveFilters={status !== '' || health !== '' || owner !== ''}
    />
  );
}
```

**Props:**
- `facets: SearchFacets | undefined` - Filter options with counts
- `selectedStatus: string` - Currently selected status
- `selectedHealth: string` - Currently selected health
- `selectedOwner: string` - Currently selected owner
- `onStatusChange: (status: string) => void` - Status filter change callback
- `onHealthChange: (health: string) => void` - Health filter change callback
- `onOwnerChange: (owner: string) => void` - Owner filter change callback
- `onReset: () => void` - Reset all filters callback
- `hasActiveFilters: boolean` - Show reset button if true

### SearchResults

Displays paginated search results with project cards.

```tsx
import { SearchResults } from '@paulkokos/search-components';
import type { SearchResponse } from '@paulkokos/search-components';

function MyResultsComponent() {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const searchData: SearchResponse = {
    results: [...],
    facets: {...},
    total: 100,
    page: 1,
    page_size: 20,
    total_pages: 5
  };

  return (
    <SearchResults
      data={searchData}
      isLoading={isLoading}
      onPageChange={setPage}
      currentPage={page}
    />
  );
}
```

**Props:**
- `data: SearchResponse | undefined` - Search results from API
- `isLoading: boolean` - Loading state
- `onPageChange: (page: number) => void` - Pagination callback
- `currentPage: number` - Current page number

## Types

All TypeScript types are exported for type-safe usage:

```tsx
import type {
  SearchResult,
  SearchFacets,
  SearchResponse,
  AutocompleteResult,
  AutocompleteResponse,
} from '@paulkokos/search-components';
```

## Dependencies

This package requires:
- React >= 18.0.0
- React DOM >= 18.0.0
- @tanstack/react-query >= 5.0.0

## Styling

Components use Tailwind CSS classes. Ensure Tailwind CSS is installed in your project:

```bash
npm install -D tailwindcss
```

## Complete Example

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  SearchAutocomplete,
  SearchFilters,
  SearchResults,
  type SearchResponse,
} from '@paulkokos/search-components';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [health, setHealth] = useState('');
  const [owner, setOwner] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch from your API
  const { data, isLoading } = useQuery({
    queryKey: ['search', { q: query, page, status, health, owner }],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query,
        page: String(page),
        ...(status && { status }),
        ...(health && { health }),
        ...(owner && { owner }),
      });

      const response = await fetch(`/api/search/search/?${params}`);
      return response.json() as Promise<SearchResponse>;
    },
    enabled: hasSearched && query.length > 0,
  });

  const handleSearch = () => {
    if (query.trim()) {
      setPage(1);
      setHasSearched(true);
    }
  };

  const hasActiveFilters = status !== '' || health !== '' || owner !== '';

  return (
    <div className="space-y-6">
      <SearchAutocomplete
        value={query}
        onChange={setQuery}
        onSearch={handleSearch}
      />

      {hasSearched && query && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <SearchFilters
              facets={data?.facets}
              selectedStatus={status}
              selectedHealth={health}
              selectedOwner={owner}
              onStatusChange={setStatus}
              onHealthChange={setHealth}
              onOwnerChange={setOwner}
              onReset={() => {
                setStatus('');
                setHealth('');
                setOwner('');
                setPage(1);
              }}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <div className="lg:col-span-3">
            <SearchResults
              data={data}
              isLoading={isLoading}
              onPageChange={setPage}
              currentPage={page}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;
```

## License

MIT

## Contributing

Contributions welcome! Please submit PRs to the [main repository](https://github.com/paulkokos/project-management-dashboard).
