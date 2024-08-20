import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import lodash from 'lodash';
import { Portal } from '@radix-ui/react-portal';
import { defaultState, SearchContext } from './search-context';
import { Link } from '@remix-run/react';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { useCountry } from '~/hooks/use-country';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import type { SingleOffer } from '~/types/single-offer';
import type { SingleItem } from '~/types/single-item';
import type { SingleSeller } from '~/types/sellers';
import { Skeleton } from '~/components/ui/skeleton';
import { Image } from '~/components/app/image';
import { getImage } from '~/lib/getImage';
import {
  getPlatformsArray,
  platformIcons,
  textPlatformIcons,
} from '~/components/app/platform-icons';
import { ScrollArea } from '~/components/ui/scroll-area';
import { httpClient } from '~/lib/http-client';
import { calculatePrice } from '~/lib/calculate-price';

const { debounce } = lodash;

interface Search {
  elements: Element[];
  total: number;
}

export interface SearchState {
  focus: boolean;
  query: string;
  results: Element[];
  inputRef: React.RefObject<HTMLInputElement>;
  setQuery: (query: string) => void;
  setFocus: (focus: boolean) => void;
}

interface SearchProviderProps {
  children: ReactNode;
}

function SearchProvider({ children }: SearchProviderProps) {
  const [searchState, setSearchState] = useState<SearchState>(defaultState);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query || query === '') {
        setSearchState((prevState) => ({
          ...prevState,
          results: [],
        }));
        return;
      }

      httpClient
        .get<Search>('/autocomplete', {
          params: { query },
        })
        .then((data) => {
          setSearchState((prevState) => ({
            ...prevState,
            results: data.elements,
          }));
        });
    }, 300), // 300ms debounce time
    [],
  );

  useEffect(() => {
    if (searchState.query) {
      debouncedSearch(searchState.query);
    }
  }, [searchState.query, debouncedSearch]);

  return (
    <SearchContext.Provider
      value={{
        ...searchState,
        setQuery: (query: string) =>
          setSearchState((prevState) => ({
            ...prevState,
            query,
          })),
        setFocus: (focus: boolean) =>
          setSearchState((prevState) => ({
            ...prevState,
            focus,
          })),
        inputRef,
      }}
    >
      {children}
      <Portal>
        {searchState.focus && (
          <SearchPortal
            searchState={searchState}
            setSearchState={setSearchState}
            inputRef={inputRef}
          />
        )}
      </Portal>
    </SearchContext.Provider>
  );
}

interface Multisearch<T> {
  query: string;
  hits: T[];
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

interface SearchPortalProps {
  searchState: SearchState;
  setSearchState: (value: React.SetStateAction<SearchState>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

function SearchPortal({ searchState, setSearchState, inputRef }: SearchPortalProps) {
  const { country } = useCountry();
  const [searchQuery, setSearchQuery] = useState<string>(searchState.query);

  const [
    { data: offersData, isLoading: offersLoading, error: offersError },
    { data: itemsData, isLoading: itemsLoading, error: itemsError },
    { data: sellersData, isLoading: sellersLoading, error: sellersError },
  ] = useQueries({
    queries: [
      {
        queryKey: [
          'multisearch:offers',
          {
            query: searchQuery,
          },
        ],
        queryFn: async () => {
          const data = await httpClient.get<Multisearch<SingleOffer>>('/multisearch/offers', {
            params: { query: searchQuery },
          });
          return data;
        },
        placeholderData: keepPreviousData,
      },
      {
        queryKey: [
          'multisearch:items',
          {
            query: searchQuery,
          },
        ],
        queryFn: async () => {
          const data = await httpClient.get<Multisearch<SingleItem>>('/multisearch/items', {
            params: { query: searchQuery },
          });
          return data;
        },
        placeholderData: keepPreviousData,
      },
      {
        queryKey: [
          'multisearch:sellers',
          {
            query: searchQuery,
          },
        ],
        queryFn: async () => {
          const data = await httpClient.get<Multisearch<SingleSeller>>('/multisearch/sellers', {
            params: { query: searchQuery },
          });
          return data;
        },
        placeholderData: keepPreviousData,
      },
    ],
  });
  const [selected, setSelected] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchState((prevState: SearchState) => ({
          ...prevState,
          focus: false,
        }));
      } else if (e.key === 'Enter' && selected) {
        e.preventDefault();
        // Navigate to the selected result
        let url = '';
        if (selected.type === 'offer') {
          url = `/offers/${selected.id}`;
        } else if (selected.type === 'item') {
          url = `/items/${selected.id}`;
        } else if (selected.type === 'seller') {
          url = `/sellers/${selected.id}`;
        }

        if (url) {
          setSearchState((prevState) => ({
            ...prevState,
            focus: false,
          }));
          window.location.href = url;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputRef, setSearchState, selected]);

  useEffect(() => {
    const debouncedSearch = debounce((query: string) => {
      setSearchQuery(query);
    }, 300);

    debouncedSearch(searchState.query);

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchState.query]);

  const getDisplayCount = (totalItems: number, availableSlots: number) => {
    return Math.min(totalItems, availableSlots);
  };

  const calculateDisplayCounts = (offers: number, items: number, sellers: number) => {
    const totalSlots = 9;
    let remainingSlots = totalSlots;

    let sellersCount = 0;
    let itemsCount = 0;
    let offersCount = 0;

    if (remainingSlots > 0 && sellers > 0) {
      sellersCount = getDisplayCount(sellers, Math.min(remainingSlots, 3));
      remainingSlots -= sellersCount;
    }

    if (remainingSlots > 0 && items > 0) {
      itemsCount = getDisplayCount(items, Math.min(remainingSlots, 3));
      remainingSlots -= itemsCount;
    }

    if (remainingSlots > 0 && offers > 0) {
      offersCount = getDisplayCount(offers, Math.min(remainingSlots, 5));
      remainingSlots -= offersCount;
    }

    return { offersCount, itemsCount, sellersCount };
  };

  const offersCount = offersData ? offersData.hits.length : 0;
  const itemsCount = itemsData ? itemsData.hits.length : 0;
  const sellersCount = sellersData ? sellersData.hits.length : 0;

  const {
    offersCount: displayOffers,
    itemsCount: displayItems,
    sellersCount: displaySellers,
  } = calculateDisplayCounts(offersCount, itemsCount, sellersCount);

  return (
    <div className="fixed top-0 right-0 z-20 w-full h-full bg-card/50 backdrop-blur-[3px] items-center flex-col gap-2 justify-center flex">
      <span
        className="absolute top-0 left-0 w-full h-full cursor-pointer z-0"
        onClick={() =>
          setSearchState((prevState) => ({
            ...prevState,
            focus: false,
          }))
        }
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setSearchState((prevState) => ({
              ...prevState,
              focus: false,
            }));
          }
        }}
      />

      <div className="w-full inline-flex justify-center items-center z-10">
        <Input
          type="text"
          value={searchState.query}
          className="md:w-1/3 h-12 p-4 bg-card text-white w-full"
          placeholder="Search..."
          onChange={(e) => setSearchState((prevState) => ({ ...prevState, query: e.target.value }))}
          ref={inputRef}
        />
      </div>
      <div className="flex flex-col gap-4 p-4 w-full h-[80vh] xl:w-2/3 mx-auto bg-card rounded-xl z-10">
        <div className="flex text-white h-full max-h-[79vh]">
          <ScrollArea className="md:w-2/3 p-4 w-full max-h-[79vh] overflow-y-hidden">
            <div>
              <h2 className="text-xl font-bold mb-4">Offers</h2>
              <div className="space-y-4">
                {offersLoading && (
                  <>
                    <ResultItemSkeleton />
                    <ResultItemSkeleton />
                    <ResultItemSkeleton />
                  </>
                )}
                {offersError && <p>Error: {offersError.message}</p>}
                {offersData && offersData.hits.length === 0 && searchState.query !== '' && (
                  <p>No offers available</p>
                )}
                {offersData && offersData.hits.length === 0 && searchState.query === '' && (
                  <p>Type something to search</p>
                )}
                {offersData &&
                  offersData.hits.length > 0 &&
                  offersData.hits.slice(0, displayOffers).map((offer) => (
                    <Link
                      className="flex items-center justify-between p-2 bg-slate-700/25 rounded"
                      key={offer._id}
                      to={`/offers/${offer.id}`}
                      onClick={() => {
                        setSearchState((prevState) => ({
                          ...prevState,
                          focus: false,
                          query: '',
                        }));
                      }}
                      onMouseEnter={() => setSelected({ type: 'offer', id: offer.id })}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-12 rounded">
                          <Image
                            src={
                              getImage(offer.keyImages, [
                                'DieselGameBoxWide',
                                'DieselStoreFrontWide',
                              ])?.url ?? '/placeholder.webp'
                            }
                            alt={offer.title}
                            height={300}
                            width={300}
                            className="w-12 h-12 rounded object-cover"
                          />
                        </div>
                        <span>{offer.title}</span>
                      </div>
                      <OfferPrice id={offer.id} country={country} />
                    </Link>
                  ))}
              </div>
              <h2 className="text-xl font-bold mt-8 mb-4">Items</h2>
              <div className="space-y-4">
                {itemsLoading && (
                  <>
                    <ResultItemSkeleton />
                    <ResultItemSkeleton />
                    <ResultItemSkeleton />
                  </>
                )}
                {itemsError && <p>Error: {itemsError.message}</p>}
                {itemsData && itemsData.hits.length === 0 && searchState.query !== '' && (
                  <p>No items available</p>
                )}
                {itemsData && itemsData.hits.length === 0 && searchState.query === '' && (
                  <p>Type something to search</p>
                )}
                {itemsData &&
                  itemsData.hits.length > 0 &&
                  itemsData.hits.slice(0, displayItems).map((item) => (
                    <Link
                      className="flex items-center justify-between p-2 bg-slate-700/25 rounded"
                      key={item._id}
                      to={`/items/${item.id}`}
                      onClick={() => {
                        setSearchState((prevState) => ({
                          ...prevState,
                          focus: false,
                          query: '',
                        }));
                      }}
                      onMouseEnter={() => setSelected({ type: 'item', id: item._id })}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-12 h-12 rounded">
                          <Image
                            src={
                              getImage(item.keyImages, [
                                'DieselGameBoxWide',
                                'DieselStoreFrontWide',
                              ])?.url ?? '/placeholder.webp'
                            }
                            alt={item.title}
                            height={300}
                            width={300}
                            quality="low"
                            className="w-12 h-12 rounded object-cover"
                          />
                        </div>
                        <span>{item.title}</span>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        {getPlatformsArray(item.releaseInfo)
                          .filter((platform) => textPlatformIcons[platform])
                          .map((platform) => (
                            <span key={platform} title={platform}>
                              {textPlatformIcons[platform]}
                            </span>
                          ))}
                      </div>
                    </Link>
                  ))}
              </div>
              <h2 className="text-xl font-bold mt-8 mb-4">Sellers</h2>
              <div className="space-y-4">
                {sellersLoading && (
                  <>
                    <ResultItemSkeleton />
                    <ResultItemSkeleton />
                    <ResultItemSkeleton />
                  </>
                )}
                {sellersError && <p>Error: {sellersError.message}</p>}
                {sellersData && sellersData.hits.length === 0 && searchState.query !== '' && (
                  <p>No sellers available</p>
                )}
                {sellersData && sellersData.hits.length === 0 && searchState.query === '' && (
                  <p>Type something to search</p>
                )}
                {sellersData &&
                  sellersData.hits.length > 0 &&
                  sellersData.hits.slice(0, displaySellers).map((seller) => (
                    <Link
                      className="flex items-center justify-between p-2 bg-slate-700/25 rounded"
                      key={seller._id}
                      to={`/sellers/${seller._id}`}
                      onClick={() => {
                        setSearchState((prevState) => ({
                          ...prevState,
                          focus: false,
                          query: '',
                        }));
                      }}
                      onMouseEnter={() => setSelected({ type: 'seller', id: seller._id })}
                    >
                      <div className="flex items-center space-x-2">
                        <img
                          src={seller.logo?.url ?? '/placeholder.webp'}
                          alt={seller.name}
                          className="w-12 h-12 rounded"
                          width="50"
                          height="50"
                          style={{ aspectRatio: '50/50', objectFit: 'cover' }}
                        />
                        <span>{seller.name}</span>
                      </div>
                      <span>{seller.igdb_id ? seller.igdb_id : 'N/A'}</span>
                    </Link>
                  ))}
              </div>
            </div>
          </ScrollArea>

          <ScrollArea className="w-0 md:w-1/3 p-4 bg-slate-700/25 rounded-xl h-auto md:flex flex-col justify-start items-start hidden sticky">
            <div className="w-full flex justify-between items-center">
              {selected && (
                <FeaturedResult
                  id={selected.id}
                  type={selected.type}
                  data={
                    selected.type === 'offer'
                      ? offersData?.hits.find((offer) => offer.id === selected.id)
                      : selected.type === 'item'
                        ? itemsData?.hits.find((item) => item._id === selected.id)
                        : sellersData?.hits.find((seller) => seller._id === selected.id)
                  }
                />
              )}
              {!selected && <p className="text-lg font-bold">Hover a result to see more details</p>}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function FeaturedResult({
  id,
  type,
  data,
}: { id: string; type: string; data?: SingleOffer | SingleItem | SingleSeller }) {
  if (!data) {
    return null;
  }

  if (type === 'offer') {
    return <FeaturedOffer id={id} data={data as SingleOffer} />;
  }

  const imageToShow =
    getImage(data?.keyImages ?? [], ['Featured', 'DieselStoreFrontWide', 'OfferImageWide'])?.url ??
    '/placeholder.webp';

  return (
    <div className="flex flex-col gap-4 w-full" key={`multi-search-${id}`}>
      <Image
        src={imageToShow}
        alt={type === 'item' || type === 'offer' ? data.title : data.name}
        className="w-full rounded mb-4 aspect-video"
        width={600}
        height={325}
        quality="high"
        key={`${id}-preview-image`}
      />
      <h6 className="text-lg font-bold inline-flex items-center gap-2">
        {type === 'offer' || type === 'item' ? data.title : data.name}{' '}
        <Badge variant="default">{type}</Badge>
      </h6>
    </div>
  );
}

function FeaturedOffer({ id, data }: { id: string; data: SingleOffer }) {
  if (!data) {
    return null;
  }

  const imageToShow =
    getImage(data.keyImages, ['Featured', 'DieselStoreFrontWide', 'OfferImageWide'])?.url ??
    '/placeholder.webp';

  return (
    <div className="flex flex-col gap-4 w-full">
      <Image
        src={imageToShow}
        alt="Game Screenshot"
        className="w-full rounded mb-4 aspect-video"
        width={600}
        height={325}
        quality="high"
        key={`${id}-preview-image`}
      />
      <h6 className="text-lg font-bold">{data.title}</h6>
      <div className="flex flex-wrap gap-2 mb-4">
        {data.tags
          .filter((tag) => tag !== null)
          .slice(0, 4)
          .map((tag) => (
            <Badge variant="default" key={`${data.id}-${tag?.id}`}>
              {tag.name}
            </Badge>
          ))}
      </div>
      <div className="space-y-2">
        <p>
          <span className="font-bold">Seller:</span> {data.seller.name}
        </p>
        <p>
          <span className="font-bold">Developer:</span>{' '}
          {data.developerDisplayName ?? data.seller.name}
        </p>
        <p className="inline-flex items-center gap-2">
          <span className="font-bold">Supported Platforms:</span>{' '}
          {data.tags
            .filter((tag) => platformIcons[tag.id])
            .map((tag) => (
              <span key={`${data.id}-${tag.id}`} title={tag.name}>
                {platformIcons[tag.id]}
              </span>
            ))}
        </p>
        <p>
          <span className="font-bold">Release Date:</span>{' '}
          {new Date(data.releaseDate).toLocaleDateString('en-UK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

function ResultItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
      <div className="flex items-center space-x-2">
        <Skeleton className="w-12 h-12 rounded" />
        <Skeleton className="w-32 h-4" />
      </div>
      <Skeleton className="w-24 h-8" />
    </div>
  );
}

function OfferPrice({ id, country }: { id: string; country: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['offer-price', { id, country }],
    queryFn: async () => {
      const data = await httpClient.get<SingleOffer['price']>(`/offers/${id}/price`, {
        params: { country },
      });
      return data;
    },
  });

  if (isLoading) {
    return <Skeleton className="w-24 h-8" />;
  }

  if (error) {
    console.error(error);
    return null;
  }

  if (!data) {
    return null;
  }

  const priceFmtr = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: data.price.currencyCode,
    signDisplay: 'negative',
    currencySign: 'standard',
  });

  if (data.price.discountPrice === 0) {
    return <p>Free</p>;
  }

  return (
    <p>{priceFmtr.format(calculatePrice(data.price.discountPrice, data.price.currencyCode))}</p>
  );
}

function ComputerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="8" x="5" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 18h2" />
      <path d="M12 18h6" />
    </svg>
  );
}

export { SearchProvider };
