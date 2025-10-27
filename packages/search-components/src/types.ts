/**
 * Search API Response Types
 */

export interface SearchResult {
  id: number;
  title: string;
  description: string;
  owner: {
    id: number;
    username: string;
  };
  status: 'active' | 'archived' | 'on_hold' | 'completed';
  health: 'healthy' | 'at_risk' | 'critical';
  progress: number;
  tags: Array<{ id: number; name: string; color: string }>;
  created_at: string;
  updated_at: string;
}

export interface SearchFacets {
  statuses: Record<string, number>;
  healths: Record<string, number>;
  owners: Record<string, number>;
}

export interface SearchResponse {
  results: SearchResult[];
  facets: SearchFacets;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AutocompleteResult {
  title: string;
  id: number;
  type: string;
}

export interface AutocompleteResponse {
  suggestions: AutocompleteResult[];
}
