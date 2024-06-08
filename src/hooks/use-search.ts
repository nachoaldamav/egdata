import { useContext } from 'react';
import type { SearchState } from '~/context/global-search';
import { SearchContext } from '~/context/search-context';

export function useSearch(): SearchState {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
