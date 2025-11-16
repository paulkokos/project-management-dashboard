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
    queryKey: [
      'search',
      {
        q: searchQuery,
        page,
        status: statusFilter,
        health: healthFilter,
        owner: ownerFilter,
      },
    ],
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
        <h1 className="text-3xl font-bold mb-2">Search Projects</h1>
        <p className="text-gray-600">
          Find projects by title, description, tags, and more using full-text search
        </p>
      </div>

      <div className="card">
        <SearchAutocomplete value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />
      </div>

      {hasSearched && searchQuery && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
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

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {data?.data?.total === 0
                  ? 'No results'
                  : `${data?.data?.total || 0} result${data?.data?.total !== 1 ? 's' : ''} found`}
              </h2>
            </div>

            <SearchResults
              data={data?.data}
              isLoading={isLoading}
              onPageChange={setPage}
              currentPage={page}
            />
          </div>
        </div>
      )}

      {!hasSearched && !searchQuery && (
        <div className="card text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="mt-4 text-gray-500 text-lg">Start typing to search for projects</p>
          <p className="text-gray-400 text-sm mt-2">
            Search by project title, description, tags, and more
          </p>
        </div>
      )}
    </div>
  );
}
