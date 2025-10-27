/**
 * SearchAutocomplete Component
 *
 * Provides real-time search suggestions with debouncing.
 * - 300ms debounce for API calls
 * - Minimum 2 characters required
 * - Click-outside dismissal
 * - Loading indicator
 * - Keyboard Enter support
 *
 * For the full implementation, see:
 * https://github.com/paulkokos/project-management-dashboard/blob/master/frontend/src/components/SearchAutocomplete.tsx
 */

import { useState, useEffect, useRef } from 'react';

export interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

/**
 * SearchAutocomplete component
 *
 * @param props Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <SearchAutocomplete
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onSearch={handleSearch}
 * />
 * ```
 */
export function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = 'Search projects...',
}: SearchAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearch();
    }
  };

  return (
    <div className="relative" ref={suggestionsRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onKeyPress={handleKeyPress}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
