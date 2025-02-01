import { httpClient } from '@/lib/http-client';
import type { FullTag } from '@/types/tags';
import { dehydrate, keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { zodSearchValidator } from '@tanstack/router-zod-adapter';
import { type TypeOf, z } from 'zod';
import { useForm } from '@tanstack/react-form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { offersDictionary } from '@/lib/offers-dictionary';
import { DynamicPagination } from '@/components/app/dynamic-pagination';
import { OfferListItem } from '@/components/app/game-card';
import { GameCardSkeleton, OfferCard } from '@/components/app/offer-card';
import { useEffect, useState } from 'react';
import type { SingleOffer } from '@/types/single-offer';
import { useCountry } from '@/hooks/use-country';
import { usePreferences } from '@/hooks/use-preferences';
import { SearchProvider } from '@/providers/search';
import { useSearchDispatch, useSearchState } from '@/hooks/use-search-state';
import { CheckboxWithCount } from '@/components/app/checkbox-with-count';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowDown, GridIcon } from 'lucide-react';
import { ListBulletIcon } from '@radix-ui/react-icons';
import { PriceRangeSlider } from '@/components/ui/price-range-slider';
import { ExtendedSearch } from '@/components/app/extended-search';
import { QuickPill } from '@/components/app/quick-pill';
import { useDebounce } from '@uidotdev/usehooks';
import { Checkbox } from '@/components/ui/checkbox';

const tagTypes: {
  name: string | null;
  type: 'single' | 'multiple';
  label: string;
}[] = [
  { name: 'event', type: 'single', label: 'Events' },
  { name: 'genre', type: 'multiple', label: 'Genres' },
  { name: 'usersay', type: 'multiple', label: 'User Say' },
  { name: 'feature', type: 'multiple', label: 'Features' },
  { name: 'epicfeature', type: 'multiple', label: 'Epic Features' },
  { name: 'accessibility', type: 'multiple', label: 'Accessibility' },
  { name: null, type: 'multiple', label: 'All Tags' },
];

type SortBy =
  | 'releaseDate'
  | 'lastModifiedDate'
  | 'effectiveDate'
  | 'creationDate'
  | 'viewableDate'
  | 'pcReleaseDate'
  | 'upcoming'
  | 'price'
  | 'discount'
  | 'discountPercent';

const sortByDisplay: Record<SortBy, string> = {
  releaseDate: 'Release Date',
  lastModifiedDate: 'Modified Date',
  effectiveDate: 'Effective Date',
  creationDate: 'Creation Date',
  viewableDate: 'Viewable Date',
  pcReleaseDate: 'PC Release Date',
  upcoming: 'Upcoming',
  price: 'Price',
  discount: 'Discount',
  discountPercent: 'Discount %',
};

const searchParamsSchema = z.object({
  hash: z.string().optional(),
  tags: z
    .number()
    .or(z.array(z.number()))
    .or(z.array(z.string()))
    .or(z.string())
    .optional(),
  categories: z.string().array().optional(),
  offer_type: z.string().optional(),
  on_sale: z.boolean().optional(),
  price: z.string().optional(),
  sort_by: z
    .enum([
      'releaseDate',
      'lastModifiedDate',
      'effectiveDate',
      'creationDate',
      'viewableDate',
      'pcReleaseDate',
      'upcoming',
      'price',
      'discount',
      'discountPercent',
    ])
    .optional(),
  q: z.string().optional(),
  page: z.number().optional(),
  developer: z.string().optional(),
  publisher: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().optional(),
  offerType: z
    .enum([
      'IN_GAME_PURCHASE',
      'BASE_GAME',
      'EXPERIENCE',
      'UNLOCKABLE',
      'ADD_ON',
      'Bundle',
      'CONSUMABLE',
      'WALLET',
      'OTHERS',
      'DEMO',
      'DLC',
      'VIRTUAL_CURRENCY',
      'BUNDLE',
      'DIGITAL_EXTRA',
      'EDITION',
    ])
    .optional(),
  tags: z.string().array().optional(),
  customAttributes: z.string().array().optional(),
  seller: z.string().optional(),
  sortBy: z
    .enum([
      'releaseDate',
      'lastModifiedDate',
      'effectiveDate',
      'creationDate',
      'viewableDate',
      'pcReleaseDate',
      'upcoming',
      'priceAsc',
      'priceDesc',
      'price',
      'discount',
      'discountPercent',
    ])
    .optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  limit: z.number().optional(),
  page: z.number().optional(),
  refundType: z.string().optional(),
  isCodeRedemptionOnly: z.boolean().optional(),
  excludeBlockchain: z.boolean().optional(),
  price: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  onSale: z.boolean().optional(),
  categories: z.string().array().optional(),
  developerDisplayName: z.string().optional(),
  publisherDisplayName: z.string().optional(),
});

export const Route = createFileRoute('/search')({
  component: () => {
    return (
      <SearchProvider>
        <RouteComponent />
      </SearchProvider>
    );
  },

  beforeLoad: ({ search }) => {
    return {
      search,
    };
  },

  loader: async ({ context }) => {
    const { country, queryClient, search } = context;

    const hash = search.hash;
    const initialTags = search.tags;
    const sortBy = search.sort_by;
    const q = search.q;
    const offerType = search.offer_type;
    const page = search.page;
    const categories = search.categories;
    const onSale = search.on_sale;

    const [tagsData, hashData, typesData] = await Promise.allSettled([
      queryClient.ensureQueryData({
        queryKey: ['tags'],
        queryFn: () => httpClient.get<FullTag[]>('/search/tags?raw=true'),
      }),
      queryClient.ensureQueryData({
        queryKey: [
          'hash',
          {
            hash,
            country,
          },
        ],
        queryFn: () =>
          httpClient.get<{
            [key: string]:
              | unknown
              | {
                  [key: string]: unknown;
                };
          }>(`/search/${hash}?country=${country}`, {}),
      }),
      queryClient.ensureQueryData({
        queryKey: ['offerTypes'],
        queryFn: () =>
          httpClient.get<
            {
              _id: string;
              count: number;
            }[]
          >('/search/offer-types'),
      }),
    ]);

    const tags = tagsData.status === 'fulfilled' ? tagsData.value : [];
    let query = hashData.status === 'fulfilled' ? hashData.value : null;
    const offerTypes = typesData.status === 'fulfilled' ? typesData.value : [];

    if (sortBy) {
      if (!query) query = {};
      query.sortBy = sortBy as SortBy;
    }
    if (q) {
      if (!query) query = {};
      query.query = q;
    }
    if (offerType) {
      if (!query) query = {};
      query.offerType = offerType;
    }
    if (categories) {
      if (!query) query = {};
      query.categories = categories;
    }
    if (onSale) {
      if (!query) query = {};
      query.onSale = onSale;
    }

    return {
      tags,
      hash: query,
      offerTypes,
      country,
      initialTags: initialTags
        ? Array.isArray(initialTags)
          ? initialTags.map((tag: number | string) => tag.toString())
          : [initialTags.toString()]
        : [],
      initialQuery: q,
      categories: categories ? categories : [],
      onSale: onSale ? onSale : undefined,
      page: page ? page : 1,
      dehydratedState: dehydrate(queryClient),
    };
  },

  validateSearch: zodSearchValidator(searchParamsSchema),

  loaderDeps(opts) {
    return {
      searchParams: opts.search,
    };
  },

  head() {
    return {
      meta: [
        {
          title: 'Search | egdata.app',
        },
        {
          name: 'description',
          content: 'Search for offers from the Epic Games Store.',
        },
        {
          name: 'og:title',
          content: 'Search | egdata.app',
        },
        {
          name: 'og:description',
          content: 'Search for offers from the Epic Games Store.',
        },
        {
          property: 'twitter:title',
          content: 'Search | egdata.app',
        },
        {
          property: 'twitter:description',
          content: 'Search for offers from the Epic Games Store.',
        },
      ],
    };
  },
});

function RouteComponent() {
  const loaderData = Route.useLoaderData();
  const [showLongLoading, setShowLongLoading] = useState(false);
  const {
    isFetching,
    currentPageNumber,
    tagCounts,
    offerTypeCounts,
    developerCounts,
    publisherCounts,
    priceRange,
  } = useSearchState();
  const { view, setView } = usePreferences();
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => httpClient.get<FullTag[]>('/search/tags'),
    placeholderData: loaderData.initialTags || [],
    refetchInterval: 1000 * 60,
  });

  const form = useForm({
    defaultValues: {
      title: (loaderData.hash?.title as string) || '',
      offerType: (loaderData.hash?.offerType as string) || undefined,
      tags: (loaderData.initialTags as string[]) || undefined,
      customAttributes:
        (loaderData.hash?.customAttributes as string[]) || undefined,
      seller: (loaderData.hash?.seller as string) || undefined,
      sortBy: (loaderData.hash?.sortBy as string) || 'lastModifiedDate',
      sortDir: (loaderData.hash?.sortDir as string) || 'desc',
      limit: 28,
      page: loaderData.page || 1,
      refundType: (loaderData.hash?.refundType as string) || undefined,
      isCodeRedemptionOnly:
        (loaderData.hash?.isCodeRedemptionOnly as boolean) || undefined,
      excludeBlockchain:
        (loaderData.hash?.excludeBlockchain as boolean) || undefined,
      price: {
        // @ts-expect-error
        min: (loaderData.hash?.price?.min as number) || undefined,
        // @ts-expect-error
        max: (loaderData.hash?.price?.max as number) || undefined,
      },
      onSale: (loaderData.hash?.onSale as boolean) || undefined,
      categories: (loaderData.categories as string[]) || undefined,
      developerDisplayName:
        (loaderData.hash?.developerDisplayName as string) || undefined,
      publisherDisplayName:
        (loaderData.hash?.publisherDisplayName as string) || undefined,
    } as TypeOf<typeof formSchema>,

    asyncDebounceMs: 300,
    asyncAlways: true,
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isFetching) {
      timeout = setTimeout(() => {
        setShowLongLoading(true);
      }, 3000);
    } else {
      setShowLongLoading(false);
    }

    return () => clearTimeout(timeout);
  }, [isFetching]);

  useEffect(() => {
    form.setFieldValue('page', currentPageNumber);
  }, [currentPageNumber, form]);

  return (
    <div className="flex flex-col gap-4 min-h-screen">
      <main className="flex flex-row flex-nowrap items-start justify-between gap-4">
        <aside className="flex flex-col gap-4 w-80">
          <form.Field name="title">
            {({ name, handleChange, handleBlur, state }) => (
              <Input
                type="search"
                placeholder="Search for games"
                className=""
                name={name}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                value={state.value}
              />
            )}
          </form.Field>
          <form.Subscribe>
            {({ values }) => (
              <div
                id="selected_filters"
                className="flex flex-row flex-wrap gap-2"
              >
                {values.tags?.map((tag) => {
                  const tagData = tags?.find((t) => t.id === tag);
                  return (
                    <QuickPill
                      key={tag}
                      label={tagData?.name ?? tag}
                      onRemove={() =>
                        form.setFieldValue(
                          'tags',
                          form.state.values.tags?.filter((t) => t !== tag),
                        )
                      }
                    />
                  );
                })}
                {values.developerDisplayName && (
                  <QuickPill
                    label={values.developerDisplayName}
                    onRemove={() =>
                      form.setFieldValue('developerDisplayName', undefined)
                    }
                  />
                )}
                {values.publisherDisplayName && (
                  <QuickPill
                    label={values.publisherDisplayName}
                    onRemove={() =>
                      form.setFieldValue('publisherDisplayName', undefined)
                    }
                  />
                )}
                {values.offerType && (
                  <QuickPill
                    label={
                      offersDictionary[values.offerType] ?? values.offerType
                    }
                    onRemove={() => form.setFieldValue('offerType', undefined)}
                  />
                )}
                {values.onSale && (
                  <QuickPill
                    label="On Sale"
                    onRemove={() => form.setFieldValue('onSale', undefined)}
                  />
                )}
                {values.isCodeRedemptionOnly && (
                  <QuickPill
                    label="Code Redemption Only"
                    onRemove={() =>
                      form.setFieldValue('isCodeRedemptionOnly', undefined)
                    }
                  />
                )}
                {values.excludeBlockchain && (
                  <QuickPill
                    label="Exclude Blockchain/NFT"
                    onRemove={() =>
                      form.setFieldValue('excludeBlockchain', undefined)
                    }
                  />
                )}
              </div>
            )}
          </form.Subscribe>
          <Separator />
          <form.Field name="price">
            {({ handleChange }) => (
              <PriceRangeSlider
                min={priceRange.min}
                max={priceRange.max}
                step={100}
                defaultValue={[
                  // @ts-expect-error
                  loaderData.hash?.price?.min || priceRange.min,
                  // @ts-expect-error
                  loaderData.hash?.price?.max || priceRange.max,
                ]}
                onValueChange={(value) => {
                  handleChange({
                    min: value[0],
                    max: value[1],
                  });
                }}
                currency={
                  priceRange.currency === '' ? 'USD' : priceRange.currency
                }
              />
            )}
          </form.Field>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="offerType">
              <AccordionTrigger>Offer Type</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 w-full mt-2">
                <form.Field name="offerType">
                  {({ handleChange, state }) =>
                    Object.entries(offersDictionary)
                      .filter(([, value]) => value !== 'Unknown')
                      .filter(([key]) => offerTypeCounts[key] > 0)
                      .sort((a, b) => a[1].localeCompare(b[1]))
                      .map(([key, value]) => (
                        <CheckboxWithCount
                          key={key}
                          checked={state.value === key}
                          onChange={(checked: boolean) =>
                            // @ts-expect-error
                            handleChange(checked ? key : undefined)
                          }
                          count={offerTypeCounts[key] || undefined}
                          label={value}
                        />
                      ))
                  }
                </form.Field>
              </AccordionContent>
            </AccordionItem>
            {tagTypes.map((tagType) => {
              const tagTypeTags = tags?.filter(
                (tag) => tag.groupName === tagType.name,
              );

              return (
                <AccordionItem
                  key={tagType.name}
                  value={tagType.name ?? 'alltags'}
                >
                  <AccordionTrigger>{tagType.label}</AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2 mt-2">
                    <ScrollArea>
                      <div className="max-h-[400px] flex flex-col gap-1">
                        <form.Field name="tags">
                          {({ handleChange, state }) =>
                            tagTypeTags
                              ?.filter((tag) => tagCounts[tag.id] > 0)
                              .map((tag) => (
                                <CheckboxWithCount
                                  key={tag.id}
                                  checked={state.value?.includes(tag.id)}
                                  onChange={(checked: boolean) =>
                                    handleChange(
                                      checked
                                        ? [...(state.value ?? []), tag.id]
                                        : state.value?.filter(
                                            (t) => t !== tag.id,
                                          ),
                                    )
                                  }
                                  count={tagCounts[tag.id] || undefined}
                                  label={tag.name}
                                />
                              ))
                          }
                        </form.Field>
                        {tagTypeTags?.filter((tag) => tagCounts[tag.id] > 0)
                          .length === 0 && (
                          <span className="text-gray-400 px-4">
                            No tags found
                          </span>
                        )}
                      </div>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
            <AccordionItem value="developer">
              <AccordionTrigger>Developer</AccordionTrigger>
              <AccordionContent>
                <form.Field name="developerDisplayName">
                  {({ handleChange, state }) => (
                    <ExtendedSearch
                      name="developers"
                      items={
                        developerCounts
                          ? Object.entries(developerCounts).map(
                              ([key, value]) => ({
                                id: key,
                                name: key,
                                count: value,
                              }),
                            )
                          : []
                      }
                      value={state.value}
                      setValue={handleChange}
                    />
                  )}
                </form.Field>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="publisher">
              <AccordionTrigger>Publisher</AccordionTrigger>
              <AccordionContent>
                <form.Field name="publisherDisplayName">
                  {({ handleChange, state }) => (
                    <ExtendedSearch
                      name="publishers"
                      items={
                        publisherCounts
                          ? Object.entries(publisherCounts).map(
                              ([key, value]) => ({
                                id: key,
                                name: key,
                                count: value,
                              }),
                            )
                          : []
                      }
                      value={state.value}
                      setValue={handleChange}
                    />
                  )}
                </form.Field>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <form.Field name="onSale">
            {({ handleChange, state }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="onSale"
                  checked={state.value}
                  onCheckedChange={(value) => handleChange(Boolean(value))}
                />
                <label
                  htmlFor="onSale"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  On Sale
                </label>
              </div>
            )}
          </form.Field>
          <form.Field name="isCodeRedemptionOnly">
            {({ handleChange, state }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isCodeRedemptionOnly"
                  checked={state.value}
                  onCheckedChange={(value) => handleChange(Boolean(value))}
                />
                <label
                  htmlFor="isCodeRedemptionOnly"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Code Redemption Only
                </label>
              </div>
            )}
          </form.Field>
          <form.Field name="excludeBlockchain">
            {({ handleChange, state }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="excludeBlockchain"
                  checked={state.value}
                  onCheckedChange={(value) => handleChange(value as boolean)}
                />
                <label
                  htmlFor="excludeBlockchain"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Exclude Blockchain/NFT
                </label>
              </div>
            )}
          </form.Field>
        </aside>
        <div className="flex flex-col gap-4 w-full justify-start items-start relative">
          <header className="inline-flex items-center justify-between w-full gap-2">
            <div className="flex flex-row items-center justify-start gap-2">
              <h1 className="text-2xl font-bold">Search</h1>
              {isFetching && (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    stroke-width="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
            </div>
            <div className="flex flex-row items-center justify-start gap-2">
              <form.Field name="sortBy">
                {({ handleChange, state }) => (
                  <Select
                    value={state.value}
                    onValueChange={(value) =>
                      handleChange(value as keyof typeof sortByDisplay)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortByDisplay &&
                        Object.entries(sortByDisplay).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </form.Field>
              <form.Field name="sortDir">
                {({ handleChange, state }) => (
                  <Button
                    onClick={() => {
                      if (state.value === 'asc') {
                        handleChange('desc');
                      } else {
                        handleChange('asc');
                      }
                    }}
                    variant="outline"
                    className="w-9"
                  >
                    <ArrowDown
                      className={cn(
                        'transition-transform duration-300 ease-in-out',
                        state.value === 'asc' ? 'rotate-180' : 'rotate-0',
                      )}
                    />
                  </Button>
                )}
              </form.Field>
              <Button
                variant="outline"
                className="h-9 w-9 p-0 hidden md:flex"
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
          <form.Subscribe>
            {({ values }) => <SearchResults search={values} />}
          </form.Subscribe>
          {showLongLoading && (
            <div className="absolute inset-0 bg-opacity-90 bg-gray-900 z-10 w-full h-screen flex items-center justify-center rounded-xl">
              <span className="flex flex-col items-center justify-center gap-2">
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-sm font-medium">Loading...</span>
                  <span className="text-xs text-gray-400">
                    This query is taking more than usual...
                  </span>
                </div>
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
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface SearchResultsProps {
  search: TypeOf<typeof formSchema>;
}

function cleanBody(search: SearchResultsProps): SearchResultsProps['search'] {
  const result = { ...search.search };

  for (const key of Object.keys(result)) {
    if (result[key] === '') {
      delete result[key];
    }
    if (JSON.stringify(result[key]) === '[]') {
      delete result[key];
    }
  }

  return result;
}

function SearchResults({ search }: SearchResultsProps) {
  const debouncedSearch = useDebounce(search, 300);

  const { setCurrentPageNumber, setHash, setIsFetching } = useSearchDispatch();
  const { totalCount: count } = useSearchState();
  const { country } = useCountry();
  const { view } = usePreferences();
  const navigate = useNavigate({ from: Route.fullPath });

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: [
      'search',
      {
        ...cleanBody({ search: debouncedSearch }),
        country,
      },
    ],
    queryFn: () =>
      httpClient.post<{
        elements: SingleOffer[];
        page: number;
        limit: number;
        query: string;
      }>('/search', cleanBody({ search: debouncedSearch }), {
        params: { country },
      }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (data?.query) {
      setHash(data.query);
      navigate({
        search: {
          page: data.page,
          hash: data.query,
        },
      });
    }
  }, [data?.query, data?.page, navigate, setHash]);

  useEffect(() => {
    setIsFetching(isFetching);
  }, [isFetching, setIsFetching]);

  if (isPending && !data) {
    return (
      <div
        className={cn(
          'w-full flex flex-col gap-4',
          view === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
            : 'flex flex-col gap-4',
        )}
      >
        {Array.from({ length: 34 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: This is a skeleton loader
          <GameCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data || data.elements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-gray-400">No results found</span>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4 w-full overflow-hidden">
      <div
        className={cn(
          view === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
            : 'flex flex-col gap-4',
        )}
      >
        {data.elements.map((offer) => {
          if (view === 'grid') {
            return <OfferCard key={offer.id} offer={offer} size="md" />;
          }

          return <OfferListItem key={offer.id} game={offer} />;
        })}
      </div>
      <SearchPagination
        page={search.page ?? 1}
        setPage={setCurrentPageNumber}
        total={count || 0}
        limit={data.limit}
      />
    </section>
  );
}

function SearchPagination({
  page,
  setPage,
  total,
  limit,
}: {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  limit: number;
}) {
  const navigate = Route.useNavigate();
  const totalPages = Math.ceil(total / limit);

  // If there is only one page, don't show the pagination
  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate({
      search: (prevState) => {
        return {
          ...prevState,
          page: newPage,
        };
      },
    });
  };

  return (
    <DynamicPagination
      currentPage={page}
      setPage={handlePageChange}
      totalPages={totalPages}
    />
  );
}
