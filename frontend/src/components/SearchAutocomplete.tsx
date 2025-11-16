import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAPI, AutocompleteResult } from '@/services/search.api';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

export function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = 'Search projects...',
}: SearchAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce the search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Fetch autocomplete suggestions
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['autocomplete', debouncedValue],
    queryFn: () =>
      searchAPI.autocomplete({
        q: debouncedValue,
        limit: 10,
      }),
    enabled: debouncedValue.length >= 2,
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: AutocompleteResult) => {
    onChange(suggestion.title);
    setShowSuggestions(false);
    onSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearch();
    }
  };

  const suggestionsList = suggestions?.data?.suggestions || [];
  const shouldShowSuggestions =
    showSuggestions && debouncedValue.length >= 2 && suggestionsList.length > 0;

  return (
    <div className="relative" ref={suggestionsRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {isLoading && debouncedValue.length >= 2 && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {shouldShowSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <ul className="max-h-96 overflow-auto">
            {suggestionsList.map((suggestion: AutocompleteResult) => (
              <li key={`${suggestion.type}-${suggestion.id}`}>
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="font-medium text-gray-900">{suggestion.title}</div>
                  <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {value.length >= 2 && !isLoading && suggestionsList.length === 0 && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
          No suggestions found
        </div>
      )}
    </div>
  );
}
