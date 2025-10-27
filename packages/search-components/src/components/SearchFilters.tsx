/**
 * SearchFilters Component
 *
 * Displays faceted filtering options with live counts.
 * - Radio button filters (single selection per category)
 * - Dynamic facet counts from search results
 * - Reset button for active filters
 * - Hover effects
 *
 * For the full implementation, see:
 * https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/SearchFilters.tsx
 */

import type { SearchFacets } from '../types';

export interface SearchFiltersProps {
  facets: SearchFacets | undefined;
  selectedStatus: string;
  selectedHealth: string;
  selectedOwner: string;
  onStatusChange: (status: string) => void;
  onHealthChange: (health: string) => void;
  onOwnerChange: (owner: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

/**
 * SearchFilters component
 *
 * @param props Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <SearchFilters
 *   facets={searchData?.facets}
 *   selectedStatus={statusFilter}
 *   selectedHealth={healthFilter}
 *   selectedOwner={ownerFilter}
 *   onStatusChange={setStatusFilter}
 *   onHealthChange={setHealthFilter}
 *   onOwnerChange={setOwnerFilter}
 *   onReset={resetFilters}
 *   hasActiveFilters={hasActiveFilters}
 * />
 * ```
 */
export function SearchFilters({
  facets,
  selectedStatus,
  selectedHealth,
  selectedOwner,
  onStatusChange,
  onHealthChange,
  onOwnerChange,
  onReset,
  hasActiveFilters,
}: SearchFiltersProps) {
  if (!facets) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Status Filter */}
      {facets.statuses && Object.keys(facets.statuses).length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name="status"
                value=""
                checked={selectedStatus === ''}
                onChange={() => onStatusChange('')}
                className="w-4 h-4"
              />
              <span className="ml-3 text-gray-700">All</span>
            </label>
            {Object.entries(facets.statuses).map(([status, count]) => (
              <label
                key={status}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="radio"
                  name="status"
                  value={status}
                  checked={selectedStatus === status}
                  onChange={() => onStatusChange(status)}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-gray-700 capitalize">
                  {status.replace('_', ' ')} <span className="text-gray-500">({count})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Health Filter */}
      {facets.healths && Object.keys(facets.healths).length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Health</h3>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name="health"
                value=""
                checked={selectedHealth === ''}
                onChange={() => onHealthChange('')}
                className="w-4 h-4"
              />
              <span className="ml-3 text-gray-700">All</span>
            </label>
            {Object.entries(facets.healths).map(([health, count]) => (
              <label
                key={health}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="radio"
                  name="health"
                  value={health}
                  checked={selectedHealth === health}
                  onChange={() => onHealthChange(health)}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-gray-700 capitalize">
                  {health.replace('_', ' ')} <span className="text-gray-500">({count})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Owner Filter */}
      {facets.owners && Object.keys(facets.owners).length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Owner</h3>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="radio"
                name="owner"
                value=""
                checked={selectedOwner === ''}
                onChange={() => onOwnerChange('')}
                className="w-4 h-4"
              />
              <span className="ml-3 text-gray-700">All</span>
            </label>
            {Object.entries(facets.owners).map(([owner, count]) => (
              <label
                key={owner}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="radio"
                  name="owner"
                  value={owner}
                  checked={selectedOwner === owner}
                  onChange={() => onOwnerChange(owner)}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-gray-700">
                  {owner} <span className="text-gray-500">({count})</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
