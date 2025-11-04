# Frontend Search Implementation Guide

## Overview

This document describes the frontend implementation of the search feature, which provides a user interface for the Elasticsearch-backed search API.

The frontend search feature includes:
- **Autocomplete Search**: Real-time suggestions with 300ms debounce
- **Full-Text Search**: Search across project titles, descriptions, and tags
- **Faceted Filtering**: Filter results by status, health, and owner
- **Pagination**: Navigate through search results with pagination controls
- **Loading States**: Visual feedback during API calls
- **Responsive Design**: Works on mobile, tablet, and desktop

---

## Architecture

### Component Hierarchy

```
Search Page (pages/Search.tsx)
├── SearchAutocomplete (components/SearchAutocomplete.tsx)
│   └── Debounced autocomplete input with suggestions
├── SearchFilters (components/SearchFilters.tsx)
│   ├── Status filter (radio buttons)
│   ├── Health filter (radio buttons)
│   └── Owner filter (radio buttons)
└── SearchResults (components/SearchResults.tsx)
    ├── Result cards with project metadata
    └── Pagination controls
```

### Data Flow

```
User Input
    ↓
SearchAutocomplete (debounce 300ms)
    ↓
searchAPI.autocomplete()
    ↓
Display suggestions
    ↓
User selects suggestion / presses Enter
    ↓
SearchPage.handleSearch()
    ↓
searchAPI.search(query, filters, page)
    ↓
SearchResults (display) + SearchFilters (update facets)
    ↓
User applies filters
    ↓
searchAPI.search() with filter params
    ↓
SearchResults updated
```

---

## Components

### SearchAutocomplete

**File**: `frontend/src/components/SearchAutocomplete.tsx`

**Purpose**: Provides real-time search suggestions as the user types.

**Props**:
```typescript
interface SearchAutocompleteProps {
  value: string;                    // Current input value
  onChange: (value: string) => void; // Called when input changes
  onSearch: () => void;             // Called when user presses Enter or clicks suggestion
  placeholder?: string;             // Input placeholder (default: "Search projects...")
}
```

**Features**:
- Debounced API calls (300ms delay)
- Minimum 2 characters required for suggestions
- Displays up to 10 suggestions
- Click-outside handling to hide dropdown
- Loading spinner during fetch
- "No suggestions found" message
- Keyboard Enter support for search

**Example Usage**:
```tsx
<SearchAutocomplete
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={handleSearch}
/>
```

### SearchFilters

**File**: `frontend/src/components/SearchFilters.tsx`

**Purpose**: Displays faceted filtering options based on search results.

**Props**:
```typescript
interface SearchFiltersProps {
  facets: SearchFacets | undefined;          // Filter options with counts
  selectedStatus: string;                    // Currently selected status
  selectedHealth: string;                    // Currently selected health
  selectedOwner: string;                     // Currently selected owner
  onStatusChange: (status: string) => void;  // Status filter change callback
  onHealthChange: (health: string) => void;  // Health filter change callback
  onOwnerChange: (owner: string) => void;    // Owner filter change callback
  onReset: () => void;                       // Reset all filters callback
  hasActiveFilters: boolean;                 // Show reset button if true
}
```

**Features**:
- Radio button filters (single selection per category)
- Dynamic facet counts from search results
- "All" option to clear filter
- Reset button when filters are active
- Hover effects on filter options
- Hides empty filter sections
- Responsive card layout

**Example Usage**:
```tsx
<SearchFilters
  facets={searchData?.data?.facets}
  selectedStatus={statusFilter}
  selectedHealth={healthFilter}
  selectedOwner={ownerFilter}
  onStatusChange={setStatusFilter}
  onHealthChange={setHealthFilter}
  onOwnerChange={setOwnerFilter}
  onReset={resetFilters}
  hasActiveFilters={hasActiveFilters}
/>
```

### SearchResults

**File**: `frontend/src/components/SearchResults.tsx`

**Purpose**: Displays search results with pagination.

**Props**:
```typescript
interface SearchResultsProps {
  data: SearchResponse | undefined;  // Search results from API
  isLoading: boolean;                // Loading state
  onPageChange: (page: number) => void; // Pagination callback
  currentPage: number;               // Current page number
}
```

**Features**:
- Loading skeleton state (3 animated placeholders)
- Project cards with:
  - Title (linked to detail page)
  - Description (2-line truncated)
  - Owner username
  - Health badge (color-coded)
  - Status and progress
  - Tags (first 3 shown + "more" indicator)
- Pagination controls:
  - Previous/Next buttons
  - Page number buttons
  - Ellipsis for large page ranges
  - Result count text
  - Disabled state on boundaries
- Empty state message with call-to-action
- Links to project detail pages

**Example Usage**:
```tsx
<SearchResults
  data={searchData?.data}
  isLoading={isLoading}
  onPageChange={setPage}
  currentPage={page}
/>
```

### Search (Page)

**File**: `frontend/src/pages/Search.tsx`

**Purpose**: Main search page that orchestrates all components.

**Features**:
- Initial state: Prompt to start typing
- Post-search state: Results with filters
- Integration with React Query for data fetching
- State management for query, filters, and pagination
- Conditional rendering based on search status
- Two-column layout (filters + results)

**Page Flow**:
1. User navigates to `/search`
2. Initial state shows empty search prompt
3. User types in autocomplete input (suggestions appear)
4. User selects suggestion or presses Enter
5. Search results load with facets
6. User can apply filters
7. Pagination available for large result sets

---

## API Service

**File**: `frontend/src/services/search.api.ts`

**Interfaces**:
```typescript
// Search result item
interface SearchResult {
  id: number;
  title: string;
  description: string;
  owner: { id: number; username: string };
  status: 'active' | 'archived' | 'on_hold' | 'completed';
  health: 'healthy' | 'at_risk' | 'critical';
  progress: number;
  tags: Array<{ id: number; name: string; color: string }>;
  created_at: string;
  updated_at: string;
}

// Facet counts
interface SearchFacets {
  statuses: Record<string, number>;
  healths: Record<string, number>;
  owners: Record<string, number>;
}

// Full search response
interface SearchResponse {
  results: SearchResult[];
  facets: SearchFacets;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Autocomplete suggestion
interface AutocompleteResult {
  title: string;
  id: number;
  type: string;
}

interface AutocompleteResponse {
  suggestions: AutocompleteResult[];
}
```

**Methods**:
```typescript
// Full-text search with optional filters
searchAPI.search(params?: {
  q: string;              // Search query (required)
  status?: string;        // Filter by status
  health?: string;        // Filter by health
  owner?: string;         // Filter by owner
  page?: number;          // Page number (1-indexed)
  page_size?: number;     // Results per page
}) => Promise<AxiosResponse<SearchResponse>>

// Autocomplete suggestions
searchAPI.autocomplete(params?: {
  q: string;      // Search prefix (min 2 chars)
  limit?: number; // Max suggestions (default 10)
}) => Promise<AxiosResponse<AutocompleteResponse>>
```

---

## Usage Example

### Complete Search Implementation

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAPI } from '@/services';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { SearchFilters } from '@/components/SearchFilters';
import { SearchResults } from '@/components/SearchResults';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch search results
  const { data, isLoading } = useQuery({
    queryKey: ['search', { q: searchQuery, page, status: statusFilter, health: healthFilter, owner: ownerFilter }],
    queryFn: () =>
      searchAPI.search({
        q: searchQuery,
        page,
        status: statusFilter || undefined,
        health: healthFilter || undefined,
        owner: ownerFilter || undefined,
        page_size: 20,
      }),
    enabled: hasSearched && searchQuery.length > 0,
  });

  const handleSearch = () => {
    if (searchQuery.trim().length > 0) {
      setPage(1);
      setHasSearched(true);
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setHealthFilter('');
    setOwnerFilter('');
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== '' || healthFilter !== '' || ownerFilter !== '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Search Projects</h1>
        <p className="text-gray-600">Find projects by title, description, tags, and more</p>
      </div>

      <SearchAutocomplete
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
      />

      {hasSearched && searchQuery && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <SearchFilters
              facets={data?.data?.facets}
              selectedStatus={statusFilter}
              selectedHealth={healthFilter}
              selectedOwner={ownerFilter}
              onStatusChange={setStatusFilter}
              onHealthChange={setHealthFilter}
              onOwnerChange={setOwnerFilter}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <div className="lg:col-span-3">
            <SearchResults
              data={data?.data}
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
```

---

## Testing

### Test Coverage

The search feature includes comprehensive test coverage:

**Search Page Tests** (`frontend/src/__tests__/pages/Search.test.tsx`):
- 14 test cases covering:
  - Initial render and empty state
  - Autocomplete suggestions
  - Search execution
  - Result display
  - Filtering (status, health, owner)
  - Filter reset
  - No results handling
  - Loading states
  - Result metadata display

**SearchAutocomplete Tests** (`frontend/src/__tests__/components/SearchAutocomplete.test.tsx`):
- 12 test cases covering:
  - Input rendering
  - onChange callback
  - Debouncing (2+ chars required)
  - Suggestion fetching
  - Suggestion display
  - Enter key handling
  - Suggestion click handling
  - Outside click dismissal
  - Loading spinner
  - Empty suggestions
  - Custom placeholder
  - Type display

**SearchResults Tests** (`frontend/src/__tests__/components/SearchResults.test.tsx`):
- 28 test cases covering:
  - Loading skeleton state
  - Empty results message
  - Result display
  - Description display
  - Owner display
  - Status display
  - Progress display
  - Tags display (up to 3 + more indicator)
  - Pagination (previous, next, page numbers)
  - Current page highlighting
  - Button disable states
  - Result count text
  - Links to detail pages

**SearchFilters Tests** (`frontend/src/__tests__/components/SearchFilters.test.tsx`):
- 31 test cases covering:
  - Filters title
  - Undefined facets handling
  - Status filter section
  - Health filter section
  - Owner filter section
  - Facet counts
  - Filter selection (status, health, owner)
  - Reset button visibility
  - Reset button functionality
  - Selected filter highlighting
  - All option for each filter
  - Total count calculation
  - Multi-word filter formatting
  - Hover effects
  - Filter section hiding when empty

**Total**: 85 frontend tests for search functionality

### Running Tests

```bash
# Run all frontend tests
npm run test

# Run only search tests
npm run test -- Search

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage
```

---

## Styling & Responsiveness

### Layout

- **Mobile**: Single-column layout (filters below results)
- **Tablet/Desktop**: Two-column layout (filters left, results right)
- Uses Tailwind CSS grid: `grid-cols-1 lg:grid-cols-4`

### Color Scheme

- **Primary**: Blue (#3B82F6) - buttons, links, active states
- **Status**: Green (active), Yellow (on-hold), Red (archived), Gray (completed)
- **Health**: Green (healthy), Orange (at-risk), Red (critical)
- **Tags**: Use colors from tag configuration

### Interactive Elements

- Hover effects on result cards
- Disabled state styling on buttons
- Loading spinner animation
- Radio button accessibility
- Focus states for keyboard navigation

---

## Performance Considerations

### Debouncing

- Autocomplete API calls debounced by 300ms
- Reduces server load during rapid typing
- Minimum 2 characters required

### Query Caching

- React Query caches search results
- Cache invalidation on query/filter change
- Stale-while-revalidate pattern for UX

### Pagination

- Default 20 results per page
- Reduces initial load time
- Page numbers show range with ellipsis for large datasets

### Lazy Loading

- Components loaded only when accessed via route
- No search page overhead for other pages

---

## Accessibility

### Keyboard Navigation

- Tab through all interactive elements
- Enter key triggers search
- Radio button selection with arrow keys
- Escape key could close suggestions (future enhancement)

### Screen Readers

- Semantic HTML (buttons, labels, radio inputs)
- ARIA labels for facet counts
- Descriptive link text ("Mobile App Development" not "Click here")
- Loading state announcements

### Color Contrast

- Meets WCAG AA standards
- Status badges include text in addition to color
- Health badges provide clear visual distinction

---

## Future Enhancements

### Phase 2 Features

1. **Advanced Search**
   - Boolean operators (AND, OR, NOT)
   - Phrase queries ("exact match")
   - Wildcard searches

2. **Search Analytics**
   - Track popular searches
   - Personalized suggestions based on history
   - Trending tags

3. **Saved Searches**
   - Save favorite search queries with filters
   - Quick access to saved searches
   - Notifications for new results

4. **Search Results Personalization**
   - Sort by relevance, date, status, progress
   - Custom result columns
   - Bulk actions on results

5. **Mobile Optimizations**
   - Swipe gestures for pagination
   - Collapsible filters
   - Bottom sheet for filter panel

---

## Troubleshooting

### Autocomplete Not Working

**Issue**: Suggestions don't appear or show "No suggestions found"

**Solutions**:
1. Check minimum 2-character requirement
2. Verify Elasticsearch service is running
3. Check browser console for API errors
4. Rebuild search indexes: `docker-compose exec backend python manage.py rebuild_index`

### Slow Search Results

**Issue**: Search takes >1 second to return results

**Solutions**:
1. Check Elasticsearch cluster health: `curl http://localhost:9200/_cluster/health`
2. Check network tab in browser DevTools
3. Reduce `page_size` in API call if needed
4. Check Elasticsearch resource usage (CPU, memory)

### Filter Not Working

**Issue**: Applying filters doesn't change results

**Solutions**:
1. Verify filter value is being sent to API (check network tab)
2. Check backend filter logic
3. Try resetting filters and reapplying
4. Rebuild search indexes

### Tags Not Displaying

**Issue**: Tags missing from result cards

**Solutions**:
1. Verify tags exist on projects
2. Check `tags` field in SearchResult interface
3. Verify tag colors are valid
4. Check browser console for rendering errors

---

## Related Documentation

- [SEARCH_GUIDE.md](SEARCH_GUIDE.md) - Backend Elasticsearch integration
- [API_GUIDE.md](API_GUIDE.md) - Complete API endpoint documentation
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Frontend development workflow
