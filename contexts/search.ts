import type React from 'react';
import { createContext } from 'react';

interface SearchState {
  isFetching: boolean;
  totalCount: number;
  tagCounts: Record<string, number>;
  offerTypeCounts: Record<string, number>;
  developerCounts: Record<string, number>;
  publisherCounts: Record<string, number>;
  currentPageNumber: number;
}

interface SearchActions {
  setIsFetching: React.Dispatch<React.SetStateAction<boolean>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  setTagCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setOfferTypeCounts: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  setDeveloperCounts: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  setPublisherCounts: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  setCurrentPageNumber: React.Dispatch<React.SetStateAction<number>>;
}

export const SearchStateContext = createContext<SearchState | undefined>(
  undefined,
);
export const SearchDispatchContext = createContext<SearchActions | undefined>(
  undefined,
);
