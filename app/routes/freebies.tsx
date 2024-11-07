import { DynamicPagination } from '@/components/app/dynamic-pagination';
import { OfferListItem } from '@/components/app/game-card';
import { OfferCard } from '@/components/app/offer-card';
import { EGSIcon } from '@/components/icons/egs';
import { GiveawaysCarousel } from '@/components/modules/giveaways';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCountry } from '@/hooks/use-country';
import { usePreferences } from '@/hooks/use-preferences';
import { calculatePrice } from '@/lib/calculate-price';
import { getQueryClient } from '@/lib/client';
import getCountryCode from '@/lib/get-country-code';
import { httpClient } from '@/lib/http-client';
import { offersDictionary } from '@/lib/offers-dictionary';
import { parseCookieString } from '@/lib/parse-cookies';
import { cn } from '@/lib/utils';
import type { GiveawayOffer } from '@/types/giveaways';
import type { Price } from '@/types/price';
import type { SingleOffer } from '@/types/single-offer';
import { ListBulletIcon } from '@radix-ui/react-icons';
import {
  dehydrate,
  HydrationBoundary,
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useDebounce } from '@uidotdev/usehooks';
import { ArrowDown, GridIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { default as Motion, type MotionNumberProps } from 'motion-number';
import { getBuyLink } from '@/lib/get-build-link';

const sortByList: Record<string, string> = {
  giveawayDate: 'Giveaway Date',
  releaseDate: 'Release Date',
  lastModifiedDate: 'Modified Date',
  effectiveDate: 'Effective Date',
  creationDate: 'Creation Date',
  viewableDate: 'Viewable Date',
  price: 'Price',
};

interface SearchGiveawaysParams {
  query: string;
  sortBy: keyof typeof sortByList;
  sortDir: 'asc' | 'desc';
  offerType: keyof typeof offersDictionary | undefined;
  country: string;
  page: number;
  year: string | undefined;
}

const searchGiveaways = async ({
  query,
  sortBy,
  sortDir,
  offerType,
  country,
  page,
  year,
}: SearchGiveawaysParams): Promise<{
  elements: SingleOffer[];
  page: number;
  limit: number;
  total: number;
}> => {
  const res = await httpClient.get<{
    elements: SingleOffer[];
    page: number;
    limit: number;
    total: number;
  }>('/free-games/search', {
    params: {
      title: query === '' ? undefined : query,
      sortBy,
      sortDir,
      offerType,
      country,
      limit: 25,
      page,
      year,
    },
  });

  return res;
};

const getGiveawaysStats = async ({ country }: { country: string }) => {
  const res = await httpClient.get<{
    totalValue: Price['price'];
    totalGiveaways: number;
    totalOffers: number;
    repeated: number;
    sellers: number;
  }>('/free-games/stats', {
    params: {
      country,
    },
  });

  return res;
};

const giveawaysSearchSchema = z.object({
  page: z.number().optional(),
  query: z.string().optional(),
  sortBy: z.string().optional(),
  offerType: z.string().optional(),
  sortDir: z.string().optional(),
  year: z.number().optional(),
});

export const Route = createFileRoute('/freebies')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <FreeGames />
      </HydrationBoundary>
    );
  },

  validateSearch: (search) => giveawaysSearchSchema.parse(search),

  loader: async () => {
    const client = getQueryClient();

    let url: URL;
    let cookieHeader: string;

    if (import.meta.env.SSR) {
      const { getWebRequest } = await import('vinxi/http');
      const request = getWebRequest();
      url = new URL(request.url);
      cookieHeader = request.headers.get('Cookie') ?? '';
    } else {
      url = new URL(window.location.href);
      cookieHeader = document.cookie;
    }

    if (typeof cookieHeader !== 'string') {
      cookieHeader = '';
    }

    const parsedCookies = parseCookieString(cookieHeader);
    const cookies = Object.fromEntries(
      Object.entries(parsedCookies).map(([key, value]) => [key, value || '']),
    );
    const country = getCountryCode(url, cookies);

    const page = Number.parseInt(url.searchParams.get('page') ?? '1');
    const query = url.searchParams.get('query') ?? '';
    const sortBy = url.searchParams.get('sortBy') ?? 'giveawayDate';
    const offerType = (url.searchParams.get('offerType') ?? undefined) as
      | keyof typeof offersDictionary
      | undefined;
    const sortDir = (url.searchParams.get('sortDir') ?? 'desc') as
      | 'asc'
      | 'desc';
    const year = url.searchParams.get('year') ?? undefined;

    await Promise.all([
      client.prefetchQuery({
        queryKey: [
          'search-giveaways',
          { page, limit: 25, country, query, sortBy, offerType, sortDir, year },
        ],
        queryFn: () =>
          searchGiveaways({
            query,
            sortBy,
            sortDir,
            offerType,
            country,
            page,
            year,
          }),
      }),
      client.prefetchQuery({
        queryKey: ['giveaways-stats', { country }],
        queryFn: () => getGiveawaysStats({ country }),
      }),
      client.prefetchQuery({
        queryKey: ['giveaways'],
        queryFn: () =>
          httpClient.get<GiveawayOffer[]>('/free-games', {
            params: {
              country,
            },
          }),
      }),
    ]);

    return {
      dehydratedState: dehydrate(client),
      page,
      query,
      sortBy,
      offerType,
      sortDir,
      year,
    };
  },
});

function FreeGames() {
  const {
    page: serverPage,
    query: serverQuery,
    sortBy: serverSortBy,
    offerType: serverOfferType,
    sortDir: serverSortDir,
    year: serverYear,
  } = Route.useLoaderData();
  const { view, setView } = usePreferences();
  const { country } = useCountry();
  const years = useMemo(() => getYearsFrom2018ToCurrent(), []);
  const navigate = Route.useNavigate();
  const [page, setPage] = useState(serverPage);
  const [query, setQuery] = useState<string>(serverQuery ?? '');
  const [sortBy, setSortBy] = useState<keyof typeof sortByList>(
    serverSortBy ?? 'giveawayDate',
  );
  const [offerType, setOfferType] = useState<
    keyof typeof offersDictionary | undefined
  >(serverOfferType ?? undefined);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(
    serverSortDir ?? 'desc',
  );
  const [year, setYear] = useState<string | undefined>(serverYear ?? undefined);

  // Debounce the query, sortBy, offerType, sortDir, and year values
  const debouncedQuery = useDebounce(query, 300);
  const debouncedSortBy = useDebounce(sortBy, 300);
  const debouncedOfferType = useDebounce(offerType, 300);
  const debouncedSortDir = useDebounce(sortDir, 300);
  const debouncedYear = useDebounce(year, 300);

  const { data, isLoading } = useQuery({
    queryKey: [
      'search-giveaways',
      {
        page,
        limit: 25,
        country,
        query: debouncedQuery,
        sortBy: debouncedSortBy,
        offerType: debouncedOfferType,
        sortDir: debouncedSortDir,
        year: debouncedYear,
      },
    ],
    queryFn: () =>
      searchGiveaways({
        query: debouncedQuery,
        sortBy: debouncedSortBy,
        sortDir: debouncedSortDir,
        offerType: debouncedOfferType,
        country,
        page,
        year: debouncedYear,
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    navigate({
      search: {
        query: debouncedQuery,
        sortBy: debouncedSortBy,
        offerType: debouncedOfferType,
        sortDir: debouncedSortDir,
        year: debouncedYear ? Number.parseInt(debouncedYear) : undefined,
        page: 1,
      },
      resetScroll: false,
    });
  }, [
    debouncedQuery,
    debouncedSortBy,
    debouncedOfferType,
    debouncedSortDir,
    debouncedYear,
    navigate,
  ]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!data) {
    return <p>No data</p>;
  }

  const totalPages = useMemo(
    () => Math.ceil((data?.total ?? 0) / (data?.limit ?? 0)),
    [data?.total, data?.limit],
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    window.history.pushState(null, '', url.href);
  };

  return (
    <div className="flex flex-col items-start justify-start h-full gap-4 p-4">
      <GiveawaysStats />
      <div className="flex flex-row justify-between items-center gap-4 w-full">
        <h2 className="text-xl font-semibold mb-4">Current Free Games</h2>
        <Button
          className="bg-black text-white hover:bg-card border inline-flex items-center gap-2 w-fit"
          onClick={() => {
            const proxy = window.open(
              getBuyLink({
                // Get the offers that are available right now
                offers: data.elements.filter((offer) => {
                  if (!offer.giveaway) return false;
                  const startDate = new Date(offer.giveaway.startDate);
                  const endDate = new Date(offer.giveaway.endDate);
                  const now = new Date();

                  const isOnGoing = startDate < now && endDate > now;

                  if (isOnGoing) {
                    return true;
                  }

                  return false;
                }),
              }),
              '_blank',
              'width=1000,height=700',
            );

            if (proxy) {
              proxy.focus();
              proxy.onclose = () => {
                window.location.reload();
              };
            } else {
              console.error('Failed to open window');
            }
          }}
        >
          <EGSIcon className="w-5 h-5" />
          <span>Redeem Now</span>
        </Button>
      </div>
      <GiveawaysCarousel hideTitle={true} />
      <Separator orientation="horizontal" className="my-4" />
      <header className="flex flex-row justify-between items-center gap-4 w-full">
        <h2 className="text-xl font-semibold">Past Free Games</h2>
        <div id="filters" className="flex flex-row gap-2 items-center">
          <Input
            type="search"
            placeholder="Search for games"
            onChange={(e) => setQuery(e.target.value)}
            value={query}
          />
          <Select
            value={offerType}
            onValueChange={(value) =>
              setOfferType(value as keyof typeof offersDictionary)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue className="text-sm" placeholder="All">
                {offerType ? (offersDictionary[offerType] ?? offerType) : 'All'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined as unknown as string}>
                All
              </SelectItem>
              {Object.entries(offersDictionary)
                .sort((a, b) => a[1].localeCompare(b[1]))
                .filter(([key]) => key !== 'null' && key !== 'undefined')
                .map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as keyof typeof sortByList)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue className="text-sm">
                {sortByList[sortBy] ?? sortBy}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortByList).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={(value) => setYear(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue className="text-sm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined as unknown as string}>
                All Years
              </SelectItem>
              {years
                .sort((a, b) => b - a)
                .map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="h-9 w-9 p-0"
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowDown
              className={cn(
                'h-5 w-5 m-2 transition-transform ease-in-out duration-300',
                {
                  '-rotate-180': sortDir === 'asc',
                },
              )}
            />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0 hidden md:flex"
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
          >
            {view === 'grid' ? (
              <ListBulletIcon className="size-5 m-2" aria-hidden="true" />
            ) : (
              <GridIcon className="size-5 m-2" aria-hidden="true" />
            )}
          </Button>
        </div>
      </header>
      <section
        className={cn(
          'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 mt-4 w-full',
          view === 'list' ? 'flex flex-col gap-4' : '',
        )}
      >
        {data.elements?.map((game) => {
          if (view === 'grid') {
            return <OfferCard key={game._id} offer={game} size="md" />;
          }

          return <OfferListItem key={game._id} game={game} />;
        })}
      </section>
      <DynamicPagination
        currentPage={page}
        setPage={handlePageChange}
        totalPages={totalPages}
      />
    </div>
  );
}

function GiveawaysStats() {
  const { country } = useCountry();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['giveaways-stats', { country }],
    queryFn: () => getGiveawaysStats({ country }),
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-start gap-4 w-full">
      <h2 className="text-xl font-semibold">Giveaways in numbers</h2>
      <div className="flex flex-row items-center justify-center gap-10 bg-card rounded-lg p-4 w-full">
        <TooltipProvider>
          <Tooltip>
            <div className="flex flex-col items-center justify-center gap-2">
              <ClientOnlyMotionNumber
                value={calculatePrice(
                  data.totalValue.originalPrice,
                  data.totalValue.currencyCode,
                )}
                format={{
                  style: 'currency',
                  currency: data.totalValue.currencyCode,
                }}
                className="text-4xl font-semibold"
              />
              <TooltipTrigger>
                <span className="text-lg font-medium text-gray-400 decoration-dotted decoration-gray-400/50 underline underline-offset-4">
                  Total Value
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex flex-row items-center gap-1">
                  <span className="text-xs font-medium">
                    {calculatePrice(
                      data.totalValue.discountPrice,
                      data.totalValue.currencyCode,
                    ).toLocaleString(undefined, {
                      style: 'currency',
                      currency: data.totalValue.currencyCode,
                    })}
                  </span>
                  <span className="text-xs font-medium">
                    Total value including any active discounts
                  </span>
                </div>
              </TooltipContent>
            </div>
          </Tooltip>

          <Tooltip>
            <div className="flex flex-col items-center justify-center gap-2">
              <ClientOnlyMotionNumber
                value={data.totalGiveaways}
                className="text-4xl font-semibold"
              />
              <TooltipTrigger>
                <span className="text-lg font-medium text-gray-400 decoration-dotted decoration-gray-400/50 underline underline-offset-4">
                  Giveaways
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs font-medium">
                  Total number of giveaways that appear in the database
                </span>
              </TooltipContent>
            </div>
          </Tooltip>

          <Tooltip>
            <div className="flex flex-col items-center justify-center gap-2">
              <ClientOnlyMotionNumber
                value={data.totalOffers}
                className="text-4xl font-semibold"
              />
              <TooltipTrigger>
                <span className="text-lg font-medium text-gray-400 decoration-dotted decoration-gray-400/50 underline underline-offset-4">
                  Offers
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs font-medium">
                  Total number of unique offers that have appeared in giveaways
                </span>
              </TooltipContent>
            </div>
          </Tooltip>

          <Tooltip>
            <div className="flex flex-col items-center justify-center gap-2">
              <ClientOnlyMotionNumber
                value={data.repeated}
                className="text-4xl font-semibold"
              />
              <TooltipTrigger>
                <span className="text-lg font-medium text-gray-400 decoration-dotted decoration-gray-400/50 underline underline-offset-4">
                  Repeated
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs font-medium">
                  Number of unique offers that appear multiple times in
                  giveaways
                </span>
              </TooltipContent>
            </div>
          </Tooltip>

          <Tooltip>
            <div className="flex flex-col items-center justify-center gap-2">
              <ClientOnlyMotionNumber
                value={data.sellers}
                className="text-4xl font-semibold"
              />
              <TooltipTrigger>
                <span className="text-lg font-medium text-gray-400 decoration-dotted decoration-gray-400/50 underline underline-offset-4">
                  Sellers
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <span className="text-xs font-medium">
                  Total number of unique sellers providing offers
                </span>
              </TooltipContent>
            </div>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

function MotionNumber({
  value,
  format,
  className,
  ...props
}: MotionNumberProps) {
  const [v, setV] = useState(0);

  useEffect(() => {
    setV(value as number);
  }, [value]);

  return <Motion value={v} format={format} className={className} {...props} />;
}

function ClientOnlyMotionNumber({
  value,
  format,
  className,
  ...props
}: MotionNumberProps) {
  if (typeof window === 'undefined')
    return (
      <span className={className}>
        {new Intl.NumberFormat(undefined, format).format(
          typeof value === 'string' ? Number.parseInt(value) : value,
        )}
      </span>
    );

  return (
    <MotionNumber
      value={value}
      format={format}
      className={className}
      {...props}
    />
  );
}

function getYearsFrom2018ToCurrent(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  for (let year = 2018; year <= currentYear; year++) {
    years.push(year);
  }

  return years;
}
