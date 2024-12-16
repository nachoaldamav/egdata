import { SearchDispatchContext, SearchStateContext } from '@/contexts/search';
import { type PropsWithChildren, useMemo, useState } from 'react';

// biome-ignore lint/complexity/noBannedTypes: empty
export function SearchProvider({ children }: PropsWithChildren<{}>) {
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [tagCounts, setTagCounts] = useState<Record<string, number>>({});
  const [offerTypeCounts, setOfferTypeCounts] = useState<
    Record<string, number>
  >({});
  const [developerCounts, setDeveloperCounts] = useState<
    Record<string, number>
  >({});
  const [publisherCounts, setPublisherCounts] = useState<
    Record<string, number>
  >({});
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);

  const stateValue = useMemo(
    () => ({
      isFetching,
      totalCount,
      tagCounts,
      offerTypeCounts,
      currentPageNumber,
      developerCounts,
      publisherCounts,
    }),
    [
      isFetching,
      totalCount,
      tagCounts,
      offerTypeCounts,
      currentPageNumber,
      developerCounts,
      publisherCounts,
    ],
  );

  const dispatchValue = useMemo(
    () => ({
      setIsFetching,
      setTotalCount,
      setTagCounts,
      setOfferTypeCounts,
      setCurrentPageNumber,
      setDeveloperCounts,
      setPublisherCounts,
    }),
    [],
  );

  return (
    <SearchStateContext.Provider value={stateValue}>
      <SearchDispatchContext.Provider value={dispatchValue}>
        {children}
      </SearchDispatchContext.Provider>
    </SearchStateContext.Provider>
  );
}
