import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { useEffect } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { dehydrate, HydrationBoundary, keepPreviousData, useQuery } from '@tanstack/react-query';
import { getQueryClient } from '~/lib/client';
import getCountryCode from '~/lib/get-country-code';
import { httpClient } from '~/lib/http-client';
import cookie from 'cookie';
import { OfferCard } from '~/components/app/offer-card';
import { useCountry } from '~/hooks/use-country';
import { useMemo, useState } from 'react';
import { GiveawaysCarousel } from '~/components/modules/giveaways';
import { Separator } from '~/components/ui/separator';
import { Input } from '~/components/ui/input';
import { offersDictionary } from '~/lib/offers-dictionary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Button } from '~/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { GridIcon } from '@radix-ui/react-icons';
import { cn } from '~/lib/utils';
import { DynamicPagination } from '~/components/app/dynamic-pagination';
import { ListBulletIcon } from '@radix-ui/react-icons';
import { usePreferences } from '~/hooks/use-preferences';
import { OfferListItem } from '~/components/app/game-card';
import type { SingleOffer } from '~/types/single-offer';
import type { Price } from '~/types/price';
import { calculatePrice } from '~/lib/calculate-price';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';

export const meta: MetaFunction = () => {
  return [
    {
      title: 'Free Games - egdata.app',
    },
    {
      name: 'description',
      content: 'Checkout the Epic Games free games list.',
    },
    {
      name: 'og:image',
      content: 'https://egdata.app/300x150-egdata-placeholder.png',
    },
    {
      name: 'twitter:image',
      content: 'https://egdata.app/300x150-egdata-placeholder.png',
    },
    {
      name: 'og:title',
      content: 'Free Games - egdata.app',
    },
    {
      name: 'og:description',
      content: 'Checkout the Epic Games Free games list.',
    },
    {
      name: 'twitter:title',
      content: 'Free Games - egdata.app',
    },
    {
      name: 'twitter:description',
      content: 'Checkout the Epic Games Free games list.',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:site_name',
      content: 'egdata.app',
    },
    {
      property: 'og:url',
      content: 'https://egdata.app/freebies',
    },
  ];
};

const searchGiveaways = async ({
  query,
  sortBy,
  sortDir,
  offerType,
  country,
  page,
  year,
}: {
  query: string;
  sortBy: keyof typeof sortByList;
  sortDir: 'asc' | 'desc';
  offerType: keyof typeof offersDictionary | undefined;
  country: string;
  page: number;
  year: string | undefined;
}): Promise<{
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
      title: query,
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
    totalOffers: number;
    totalGiveaways: number;
  }>('/free-games/stats', {
    params: {
      country,
    },
  });

  return res;
};

export const loader: LoaderFunction = async ({ request }) => {
  const client = getQueryClient();
  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get('page') ?? '1');
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));
  const query = url.searchParams.get('query') ?? '';
  const sortBy = url.searchParams.get('sortBy') ?? 'giveawayDate';
  const offerType = (url.searchParams.get('offerType') ?? undefined) as
    | keyof typeof offersDictionary
    | undefined;
  const sortDir = (url.searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc';
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
};

export default function Index() {
  const { dehydratedState } = useLoaderData<typeof loader>();
  return (
    <HydrationBoundary state={dehydratedState}>
      <FreeGames />
    </HydrationBoundary>
  );
}

const sortByList: Record<string, string> = {
  giveawayDate: 'Giveaway Date',
  releaseDate: 'Release Date',
  lastModifiedDate: 'Modified Date',
  effectiveDate: 'Effective Date',
  creationDate: 'Creation Date',
  viewableDate: 'Viewable Date',
  price: 'Price',
};

function getYearsFrom2018ToCurrent(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  for (let year = 2018; year <= currentYear; year++) {
    years.push(year);
  }

  return years;
}

function FreeGames() {
  const {
    page: serverPage,
    query: serverQuery,
    sortBy: serverSortBy,
    offerType: serverOfferType,
    sortDir: serverSortDir,
    year: serverYear,
  } = useLoaderData<typeof loader>();
  const { view, setView } = usePreferences();
  const { country } = useCountry();
  const years = useMemo(() => getYearsFrom2018ToCurrent(), []);

  const [page, setPage] = useState(serverPage);
  const [query, setQuery] = useState<string>(serverQuery ?? '');
  const [sortBy, setSortBy] = useState<keyof typeof sortByList>(serverSortBy ?? 'giveawayDate');
  const [offerType, setOfferType] = useState<keyof typeof offersDictionary | undefined>(
    serverOfferType ?? undefined,
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(serverSortDir ?? 'desc');
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
    const url = new URL(window.location.href);
    if (debouncedQuery) {
      url.searchParams.set('query', debouncedQuery);
    } else {
      url.searchParams.delete('query');
    }
    if (debouncedSortBy) {
      url.searchParams.set('sortBy', debouncedSortBy);
    } else {
      url.searchParams.delete('sortBy');
    }
    if (debouncedOfferType) {
      url.searchParams.set('offerType', debouncedOfferType ?? '');
    } else {
      url.searchParams.delete('offerType');
    }
    if (debouncedSortDir) {
      url.searchParams.set('sortDir', debouncedSortDir);
    } else {
      url.searchParams.delete('sortDir');
    }
    if (debouncedYear) {
      url.searchParams.set('year', debouncedYear ?? '');
    } else {
      url.searchParams.delete('year');
    }

    setPage(1);

    url.searchParams.set('page', '1');

    window.history.pushState(null, '', url.href);
  }, [debouncedQuery, debouncedSortBy, debouncedOfferType, debouncedSortDir, debouncedYear]);

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
      <h2 className="text-2xl font-bold mb-4">Current Free Games</h2>
      <GiveawaysCarousel hideTitle={true} />
      <Separator orientation="horizontal" className="my-4" />
      <header className="flex flex-row justify-between items-center gap-4 w-full">
        <h2 className="text-xl font-bold">Past Free Games</h2>
        <div id="filters" className="flex flex-row gap-2 items-center">
          <Input
            type="search"
            placeholder="Search for games"
            onChange={(e) => setQuery(e.target.value)}
            value={query}
          />
          <Select
            value={offerType}
            onValueChange={(value) => setOfferType(value as keyof typeof offersDictionary)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue className="text-sm" placeholder="All">
                {offerType ? offersDictionary[offerType] ?? offerType : 'All'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined as unknown as string}>All</SelectItem>
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
            onValueChange={(value) => setSortBy(value as keyof typeof sortByList)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue className="text-sm">{sortByList[sortBy] ?? sortBy}</SelectValue>
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
              <SelectItem value={undefined as unknown as string}>All Years</SelectItem>
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
              className={cn('h-5 w-5 m-2 transition-transform ease-in-out duration-300', {
                '-rotate-180': sortDir === 'asc',
              })}
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
            return <OfferCard key={game.id} offer={game} size="md" />;
          }

          return <OfferListItem key={game.id} game={game} />;
        })}
      </section>
      <DynamicPagination currentPage={page} setPage={handlePageChange} totalPages={totalPages} />
    </div>
  );
}

function GiveawaysStats() {
  const { country } = useCountry();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['giveaways-stats', { country }],
    queryFn: () => getGiveawaysStats({ country }),
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-start gap-4 w-full">
      <h2 className="text-2xl font-bold">Giveaways in numbers</h2>
      <div className="flex flex-row items-center justify-center gap-10 bg-card rounded-lg p-4 w-full">
        <TooltipProvider>
          <Tooltip>
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="text-4xl font-semibold">
                {calculatePrice(
                  data.totalValue.originalPrice,
                  data.totalValue.currencyCode,
                ).toLocaleString(undefined, {
                  style: 'currency',
                  currency: data.totalValue.currencyCode,
                })}
              </span>
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
                  <span className="text-xs font-medium">With current discounts</span>
                </div>
              </TooltipContent>
            </div>
          </Tooltip>
        </TooltipProvider>

        <div className="flex flex-col items-center justify-center gap-2">
          <span className="text-4xl font-semibold">
            {data.totalGiveaways.toLocaleString('en-UK')}
          </span>
          <span className="text-lg font-medium text-gray-400">Giveaways</span>
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          <span className="text-4xl font-semibold">{data.totalOffers.toLocaleString('en-UK')}</span>
          <span className="text-lg font-medium text-gray-400">Offers</span>
        </div>
      </div>
    </div>
  );
}
