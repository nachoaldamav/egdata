import { OfferListItem } from '@/components/app/game-card';
import { OfferCard } from '@/components/app/offer-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCountry } from '@/hooks/use-country';
import { usePreferences } from '@/hooks/use-preferences';
import { checkCountryCode } from '@/lib/check-country';
import { getImage } from '@/lib/get-image';
import { httpClient } from '@/lib/http-client';
import { cn } from '@/lib/utils';
import type { SingleOffer } from '@/types/single-offer';
import { GridIcon, ListBulletIcon } from '@radix-ui/react-icons';
import {
  dehydrate,
  HydrationBoundary,
  keepPreviousData,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { zodSearchValidator } from '@tanstack/router-zod-adapter';
import debounce from 'lodash.debounce';
import { ArrowDownIcon } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

type SortBy =
  | 'releaseDate'
  | 'lastModifiedDate'
  | 'effectiveDate'
  | 'creationDate'
  | 'viewableDate'
  | 'pcReleaseDate'
  | 'upcoming'
  | 'price';

const sortByDisplay: Record<SortBy, string> = {
  releaseDate: 'Release Date',
  lastModifiedDate: 'Modified Date',
  effectiveDate: 'Effective Date',
  creationDate: 'Creation Date',
  viewableDate: 'Viewable Date',
  pcReleaseDate: 'PC Release Date',
  upcoming: 'Upcoming',
  price: 'Price',
};

const fetchPromotionData = async ({
  id,
  country,
  page,
  sortBy,
  sortDir,
  query,
}: {
  id: string;
  country: string;
  page: number;
  sortBy: SortBy | null;
  sortDir: 'asc' | 'desc' | null;
  query: '' | string;
}) => {
  const data = await httpClient.get<{
    elements: SingleOffer[];
    title: string;
    start: number;
    page: number;
    count: number;
  }>(`/promotions/${id}`, {
    params: {
      country,
      page,
      limit: 20,
      sortBy: sortBy || undefined,
      sortDir: sortDir || undefined,
      q: query !== '' ? query : undefined,
    },
  });
  return data;
};

const searchParamsSchema = z.object({
  page: z.number().optional().default(1),
  sortBy: z
    .enum([
      'releaseDate',
      'lastModifiedDate',
      'effectiveDate',
      'creationDate',
      'viewableDate',
      'pcReleaseDate',
      'upcoming',
      'price',
    ])
    .optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
  country: z.string().optional(),
});

export const Route = createFileRoute('/sales/$id')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <SalesPage />
      </HydrationBoundary>
    );
  },

  beforeLoad(ctx) {
    const { search } = ctx;
    return {
      search,
    };
  },

  loader: async ({ params, context }) => {
    const { queryClient, country, search } = context;
    const { id } = params;

    if (!checkCountryCode(country)) {
      console.warn(`Invalid country code: ${country}`);
      throw redirect({
        to: `/sales/${id}`,
        search: {
          country: 'US',
          page: 1,
        },
        code: 302,
      });
    }

    // const { page, sortBy, sortDir, q } = search;
    const page = search.page ?? 1;
    const sortBy = search.sortBy ?? 'lastModifiedDate';
    const sortDir = search.sortDir ?? 'desc';
    const q = search.q ?? '';

    const [coverData, initialData] = await Promise.allSettled([
      queryClient.fetchQuery({
        queryKey: ['promotion-cover', { id }],
        queryFn: () =>
          httpClient.get<
            Pick<
              SingleOffer,
              '_id' | 'id' | 'namespace' | 'title' | 'keyImages'
            >
          >(`/promotions/${id}/cover`),
      }),
      queryClient.fetchQuery({
        queryKey: [
          'promotion-meta',
          { id, country, limit: 20, sortBy, sortDir, query: q, page: 1 },
        ],
        queryFn: () =>
          fetchPromotionData({
            id,
            country,
            page: 1,
            sortBy,
            sortDir,
            query: q,
          }),
      }),
      queryClient.prefetchInfiniteQuery({
        queryKey: [
          'promotion',
          { id, country, sortBy, sortDir, query: q, limit: 20 },
        ],
        queryFn: ({ pageParam }) =>
          fetchPromotionData({
            id,
            country,
            page: pageParam as number,
            sortBy,
            sortDir,
            query: q,
          }),
        initialPageParam: page,
        getNextPageParam: (
          lastPage: { elements: SingleOffer[]; start: number; count: number },
          allPages: { elements: SingleOffer[]; start: number; count: number }[],
        ) => {
          // If the start is greater than the count, we have reached the end
          if (lastPage.start + 20 > lastPage.count) {
            return undefined;
          }

          return allPages?.length + 1;
        },
      }),
    ]);

    const cover = coverData.status === 'fulfilled' ? coverData.value : null;

    return {
      cover,
      id,
      promotion: initialData.status === 'fulfilled' ? initialData.value : null,
      dehydratedState: dehydrate(queryClient),
    };
  },

  validateSearch: zodSearchValidator(searchParamsSchema),

  head: (ctx) => {
    if (!ctx.loaderData) {
      return {
        meta: [
          {
            title: 'Promotion not found',
            description: 'Promotion not found',
          },
        ],
      };
    }

    const { promotion } = ctx.loaderData;

    if (!promotion)
      return {
        meta: [
          {
            title: 'Promotion not found',
            description: 'Promotion not found',
          },
        ],
      };

    return {
      meta: [
        {
          title: `${promotion.title} | egdata.app`,
        },
        {
          name: 'description',
          content: `Check out ${promotion.title} from the Epic Games Store.`,
        },
        {
          name: 'og:title',
          content: `${promotion.title} | egdata.app`,
        },
        {
          name: 'og:description',
          content: `Check out ${promotion.title} from the Epic Games Store.`,
        },
        {
          property: 'twitter:title',
          content: `${promotion.title} | egdata.app`,
        },
        {
          property: 'twitter:description',
          content: `Check out ${promotion.title} from the Epic Games Store.`,
        },
        {
          name: 'og:image',
          content:
            getImage(promotion.elements[0]?.keyImages ?? [], [
              'OfferImageWide',
              'DieselGameBoxWide',
              'DieselStoreFrontWide',
            ])?.url ?? '/placeholder.webp',
        },
        {
          name: 'og:type',
          content: 'website',
        },
        {
          name: 'twitter:image',
          content:
            getImage(promotion.elements[0]?.keyImages ?? [], [
              'OfferImageWide',
              'DieselGameBoxWide',
              'DieselStoreFrontWide',
            ])?.url ?? '/placeholder.webp',
        },
      ],
    };
  },
});

function SalesPage() {
  const { country } = useCountry();
  const { view, setView } = usePreferences();
  const [sortBy, setSortBy] = useState<SortBy>('lastModifiedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const debouncedSetQuery = debounce(setQuery, 500);
  const { cover, id } = Route.useLoaderData();
  const {
    data: promotion,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ['promotion', { id, country, sortBy, sortDir, query, limit: 20 }],
    queryFn: ({ pageParam }) =>
      fetchPromotionData({
        id,
        country,
        page: pageParam as number,
        sortBy,
        sortDir,
        query,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.start + 20 > lastPage.count) {
        return undefined;
      }

      return allPages?.length + 1;
    },
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!promotion) {
    return null;
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    debouncedSetQuery(event.target.value);
  };

  return (
    <main className="container mx-auto">
      <div
        className="relative h-96 overflow-hidden rounded-2xl flex items-center bg-cover bg-center"
        style={{
          backgroundImage: `url(${
            getImage(cover?.keyImages ?? [], [
              'OfferImageWide',
              'featuredMedia',
              'DieselGameBoxWide',
              'DieselStoreFrontWide',
            ])?.url ?? '/placeholder.webp'
          })`,
        }}
      >
        <div className="h-full w-full flex flex-col justify-center items-start text-white p-8 bg-gradient-to-r from-black/80 to-black/30">
          <h1 className="text-5xl font-bold">{promotion.pages[0].title}</h1>
          <p className="mt-4 text-lg">
            {promotion.pages[0]?.count} offers available in this event
          </p>
        </div>
      </div>

      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mt-5">
        <div className="inline-flex items-center gap-2">
          <h2 className="text-2xl">Results</h2>
          <span className="text-sm text-gray-500">
            (
            {promotion.pages.reduce(
              (acc, page) => acc + page.elements.length,
              0,
            )}{' '}
            results)
          </span>
          {isFetching && (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
        </div>
        <div className="flex :flex-row gap-2">
          <Input
            type="search"
            placeholder="Search..."
            className="w-[200px] cursor-text"
            onChange={handleInputChange}
            value={inputValue}
          />
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortBy)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue className="text-sm">
                {sortByDisplay[sortBy]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortByDisplay).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-9 w-9 p-0"
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowDownIcon
              className={cn(
                'h-5 w-5 transform transition-transform',
                sortDir === 'asc' ? '-rotate-180' : 'rotate-0',
              )}
              aria-hidden="true"
            />
          </Button>
          <Button
            variant="outline"
            className="h-9 w-9 p-0"
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
          >
            {view === 'grid' ? (
              <ListBulletIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <GridIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </header>
      <div
        className={cn(
          'mt-8 grid gap-4',
          view === 'grid'
            ? 'grid-cols-1 lg:grid-cols-3 xl:grid-cols-5'
            : 'grid-cols-1',
        )}
      >
        {promotion.pages
          .flatMap((page) => page.elements)
          .map((game) =>
            view === 'grid' ? (
              <OfferCard offer={game} key={game.id} size="md" />
            ) : (
              <OfferListItem game={game} key={game.id} />
            ),
          )}
      </div>
      <div className="flex justify-center mt-8">
        <Button disabled={!hasNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage && (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          Load More
        </Button>
      </div>
    </main>
  );
}
