/**
 * SearchResults Component
 *
 * Displays paginated search results with project cards.
 * - Loading skeleton state
 * - Pagination controls
 * - Empty state message
 * - Tag display with more indicator
 *
 * For the full implementation, see:
 * https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/SearchResults.tsx
 */

import type { SearchResponse, SearchResult } from '../types';

export interface SearchResultsProps {
  data: SearchResponse | undefined;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  currentPage: number;
}

/**
 * SearchResults component
 *
 * @param props Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <SearchResults
 *   data={searchData}
 *   isLoading={isLoading}
 *   onPageChange={setPage}
 *   currentPage={page}
 * />
 * ```
 */
export function SearchResults({
  data,
  isLoading,
  onPageChange,
  currentPage,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg">No projects found</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {data.results.map((result: SearchResult) => (
          <div
            key={result.id}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold hover:text-blue-600 transition-colors">
                  {result.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Owner: <span className="font-medium text-gray-700">{result.owner.username}</span>
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{result.description}</p>

            <div className="flex justify-between items-center">
              <div className="flex flex-wrap gap-1">
                {result.tags && result.tags.length > 0 && (
                  result.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))
                )}
                {result.tags && result.tags.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{result.tags.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex gap-4 text-xs text-gray-500">
                <span>Status: <strong className="text-gray-700 capitalize">{result.status}</strong></span>
                <span>Progress: <strong className="text-gray-700">{result.progress}%</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.total_pages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing <strong>{(currentPage - 1) * data.page_size + 1}</strong> to{' '}
            <strong>
              {Math.min(currentPage * data.page_size, data.total)}
            </strong>{' '}
            of <strong>{data.total}</strong> results
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: data.total_pages }, (_, i) => i + 1)
                .filter(page => {
                  const diff = Math.abs(page - currentPage);
                  return diff <= 1 || page === 1 || page === data.total_pages;
                })
                .map((page, index, array) => (
                  <div key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === data.total_pages}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
