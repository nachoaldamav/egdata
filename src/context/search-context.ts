import { createContext, type RefObject } from 'react';
import type { SearchState } from './global-search';

export const defaultState: SearchState = {
  focus: false,
  query: '',
  results: [],
  inputRef: { current: null } as RefObject<HTMLInputElement>,
  setQuery: () => {},
  setFocus: () => {},
};

export const SearchContext = createContext<SearchState | undefined>(undefined);
