/**
 * Search Components Library
 *
 * Reusable React components for Elasticsearch-powered search
 * with autocomplete, filtering, and pagination.
 */

export { SearchAutocomplete } from './components/SearchAutocomplete';
export { SearchFilters } from './components/SearchFilters';
export { SearchResults } from './components/SearchResults';

export type {
  SearchResult,
  SearchFacets,
  SearchResponse,
  AutocompleteResult,
  AutocompleteResponse,
} from './types';
