import { usePreferences } from '@/hooks/use-preferences';
import { getQueryClient } from '@/lib/client';
import { httpClient } from '@/lib/http-client';
import type { FullTag, TagCount } from '@/types/tags';
import {
  dehydrate,
  HydrationBoundary,
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import debounce from 'lodash.debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { offersDictionary } from '@/lib/offers-dictionary';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowDownIcon, GridIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListBulletIcon } from '@radix-ui/react-icons';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCountry } from '@/hooks/use-country';
import type { SingleOffer } from '@/types/single-offer';
import { GameCardSkeleton, OfferCard } from '@/components/app/offer-card';
import { OfferListItem } from '@/components/app/game-card';
import { TagSelect } from '@/components/app/tag-select';
import { QuickPill } from '@/components/app/quick-pill';
import { z } from 'zod';
import { zodSearchValidator } from '@tanstack/router-zod-adapter';
import { DynamicPagination } from '@/components/app/dynamic-pagination';

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
});

export const Route = createFileRoute('/search')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <Search />
      </HydrationBoundary>
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
      httpClient.get<FullTag[]>('/search/tags?raw=true'),
      httpClient.get<{
        [key: string]:
          | unknown
          | {
              [key: string]: unknown;
            };
      }>(`/search/${hash}?country=${country}`, {
        retries: 0,
        retryDelay: 10,
      }),
      httpClient.get<
        {
          _id: string;
          count: number;
        }[]
      >('/search/offer-types'),
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

  meta() {
    return [
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
        key: 'twitter:title',
      },
      {
        property: 'twitter:description',
        content: 'Search for offers from the Epic Games Store.',
        key: 'twitter:description',
      },
    ];
  },
});

function Search() {
  const {
    tags: initialTagList,
    hash,
    offerTypes,
    initialTags,
    categories: initialCategories,
    onSale,
    initialQuery,
    page: initialPage,
  } = Route.useLoaderData();

  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: () => httpClient.get<FullTag[]>('/search/tags'),
    placeholderData: initialTagList || [],
    refetchInterval: 1000 * 60,
  });
  const { view, setView } = usePreferences();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    (hash?.tags as string[]) ?? initialTags,
  );
  const [categories, setCategories] = useState<string[]>(
    (hash?.categories as string[]) ?? initialCategories,
  );
  const [selectedOfferType, setSelectedOfferType] = useState<
    string | undefined
  >(hash?.offerType as string);
  const [tagsCount, setTagsCount] = useState<TagCount[]>([]);
  const [offerTypeCount, setOfferTypeCount] = useState<
    {
      _id: string;
      count: number;
    }[]
  >([]);
  const [query, setQuery] = useState<string>(
    initialQuery ?? (hash?.title as string) ?? '',
  );
  const [sortBy, setSortBy] = useState<SortBy>(
    (hash?.sortBy as SortBy) ?? 'lastModifiedDate',
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isCodeRedemptionOnly, setIsCodeRedemptionOnly] = useState<
    boolean | undefined
  >((hash?.isCodeRedemptionOnly as boolean) ?? undefined);
  const [isSale, setIsSale] = useState<boolean | undefined>(onSale);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    (hash?.price as { min?: number; max?: number })?.max,
  );
  const [minPrice, setMinPrice] = useState<number | undefined>(
    (hash?.price as { min?: number; max?: number })?.min,
  );
  const [inputValue, setInputValue] = useState<string>(query);
  const [page, setPage] = useState(initialPage ?? 1);
  const [fetching, setFetching] = useState<boolean>(false);

  function handleSelect(tag: string) {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }

      return [...prev, tag];
    });
  }

  function handleSelectOfferType(offerType: string) {
    setSelectedOfferType((prev) => {
      if (prev === offerType) {
        return undefined;
      }

      return offerType;
    });
  }

  const handleQueryChange = useCallback(
    debounce((value: string) => {
      setQuery(value);
    }, 300),
    [],
  );

  useEffect(() => {
    handleQueryChange(inputValue);
  }, [inputValue, handleQueryChange]);

  return (
    <div className="flex flex-row min-h-[85vh] w-full max-w-full gap-2">
      <aside
        id="form"
        className="flex-col gap-1 p-4 max-w-[300px] hidden md:flex"
      >
        <div className="flex flex-row justify-between items-center gap-1">
          <h2>Search</h2>
          <Button
            variant="link"
            className="py-1"
            onClick={() => {
              setQuery('');
              setSelectedTags([]);
              setSortBy('creationDate');
              setIsCodeRedemptionOnly(undefined);
              setSelectedOfferType(undefined);
              setIsSale(undefined);
              setInputValue('');
              setMaxPrice(undefined);
              setMinPrice(undefined);
              setSortDir('desc');
            }}
          >
            Clear
          </Button>
        </div>
        <Input
          type="search"
          placeholder="Search for games"
          className="mb-4"
          onChange={(e) => setInputValue(e.target.value)}
          value={inputValue}
        />
        <div id="selected_filters" className="flex flex-row flex-wrap gap-2">
          {selectedTags.map((tag) => {
            const tagData = tags?.find((t) => t.id === tag);

            return (
              <QuickPill
                key={tag}
                label={tagData?.name ?? tag}
                onRemove={() =>
                  setSelectedTags((prev) => prev.filter((t) => t !== tag))
                }
              />
            );
          })}
          {selectedOfferType && (
            <QuickPill
              label={offersDictionary[selectedOfferType] ?? selectedOfferType}
              onRemove={() => setSelectedOfferType(undefined)}
            />
          )}
          {isCodeRedemptionOnly && (
            <QuickPill
              label="Code Redemption Only"
              onRemove={() => setIsCodeRedemptionOnly(undefined)}
            />
          )}
          {isSale && (
            <QuickPill label="Sale" onRemove={() => setIsSale(false)} />
          )}
          {typeof minPrice === 'number' && (
            <QuickPill
              label={`> $${minPrice / 100}`}
              onRemove={() => setMinPrice(undefined)}
            />
          )}
          {typeof maxPrice === 'number' && (
            <QuickPill
              label={`< $${maxPrice / 100}`}
              onRemove={() => setMaxPrice(undefined)}
            />
          )}
          {categories.length > 0 && (
            <QuickPill
              label={categories.map((c) => offersDictionary[c] ?? c).join(', ')}
              onRemove={() => setCategories([])}
            />
          )}
        </div>
        <div className="flex flex-col justify-between items-start gap-2 mt-4">
          <Label>Price</Label>
          <div className="flex flex-row gap-2">
            <Input
              type="number"
              placeholder="Min"
              className="w-[100px]"
              onChange={(e) =>
                setMinPrice(Number.parseInt(e.target.value) * 100)
              }
              value={typeof minPrice === 'number' ? minPrice / 100 : undefined}
            />
            <Input
              type="number"
              placeholder="Max"
              className="w-[100px]"
              onChange={(e) =>
                setMaxPrice(Number.parseInt(e.target.value) * 100)
              }
              value={typeof maxPrice === 'number' ? maxPrice / 100 : undefined}
            />
          </div>
        </div>
        <Accordion type="single" collapsible className="w-[250px] gap-2">
          <AccordionItem value="offerType">
            <AccordionTrigger>Offer Type</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2 w-[250px] mt-2">
              {offerTypes
                .filter((type) => offersDictionary[type._id] !== undefined)
                .filter((type) => {
                  // If there is a tag count, we need to filter the tags with 0 count
                  if (offerTypeCount.length > 0) {
                    return (
                      offerTypeCount.find((t) => t._id === type._id) !==
                      undefined
                    );
                  }

                  return true;
                })
                .sort((a, b) => {
                  const aName = offersDictionary[a._id] ?? a._id;
                  const bName = offersDictionary[b._id] ?? b._id;

                  return aName.localeCompare(bName);
                })
                .map((type) => (
                  <TagSelect
                    key={type._id}
                    isSelected={selectedOfferType === type._id}
                    handleSelect={handleSelectOfferType}
                    tag={{
                      id: type._id,
                      name: offersDictionary[type._id] ?? type._id,
                      aliases: [],
                      groupName: 'OFFER_TYPE',
                      status: 'ACTIVE',
                    }}
                    count={offerTypeCount.find((t) => t._id === type._id)}
                  />
                ))}
              {offerTypes.length === 0 && (
                <span className="text-gray-400 px-4">No offer types found</span>
              )}
            </AccordionContent>
          </AccordionItem>
          {tagTypes.map((tagType) => {
            const tagTypeTags = tags
              ?.filter((tag) => tag.groupName === tagType.name)

              .filter((tag) => {
                // If there is a tag count, we need to filter the tags with 0 count
                if (tagsCount.length > 0) {
                  return tagsCount.find((t) => t._id === tag.id) !== undefined;
                }

                return true;
              });

            return (
              <AccordionItem
                key={tagType.name}
                value={tagType.name ?? 'alltags'}
              >
                <AccordionTrigger>{tagType.label}</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2 w-[250px] mt-2">
                  {tagTypeTags?.map((tag) => (
                    <TagSelect
                      key={tag.id}
                      isSelected={selectedTags.includes(tag.id)}
                      handleSelect={handleSelect}
                      tag={tag}
                      count={tagsCount.find((t) => t._id === tag.id)}
                    />
                  ))}
                  {tagTypeTags?.length === 0 && (
                    <span className="text-gray-400 px-4">No tags found</span>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        <div className="items-center flex space-x-2 mt-4">
          <Checkbox
            checked={isCodeRedemptionOnly ?? false}
            onCheckedChange={(checked: boolean) =>
              setIsCodeRedemptionOnly(checked)
            }
            id="isCodeRedemptionOnly"
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="isCodeRedemptionOnly"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Code Redemption Only
            </label>
          </div>
        </div>
        <div className="items-center flex space-x-2">
          <Checkbox
            checked={isSale ?? false}
            onCheckedChange={(checked: boolean) => setIsSale(checked)}
            id="isSale"
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="isSale"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Sale
            </label>
          </div>
        </div>
      </aside>
      <main
        id="results"
        className="flex flex-col gap-4 px-4 overflow-hidden flex-1"
      >
        <header className="flex flex-row justify-between items-center gap-4">
          <div className="inline-flex items-center gap-2">
            <h2 className="flex-none text-2xl">Results</h2>
            {fetching && (
              <svg
                className="animate-spin -ml-1 mr-3 size-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <title>Loading...</title>
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
          <div className="flex flex-row gap-2">
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
        <SearchResults
          query={query}
          selectedTags={selectedTags}
          categories={categories}
          selectedOfferType={selectedOfferType}
          setTagsCount={setTagsCount}
          setOfferTypesCount={setOfferTypeCount}
          sortBy={sortBy}
          sortDir={sortDir}
          isCodeRedemptionOnly={isCodeRedemptionOnly}
          isSale={isSale}
          viewType={view}
          price={{ min: minPrice, max: maxPrice }}
          page={page}
          setPage={setPage}
          setFetching={setFetching}
        />
      </main>
      <Drawer>
        <DrawerTrigger
          asChild
          className="fixed bottom-0 left-0 right-0 z-10 w-full p-4 sm:hidden flex items-center justify-center mb-2"
        >
          <Button variant="outline" className="mx-auto rounded-full w-fit">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <title>Open menu</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
              />
            </svg>
          </Button>
        </DrawerTrigger>
        <DrawerContent className="px-3">
          <DrawerHeader>
            <div className="flex flex-row justify-between items-center gap-1">
              <h2>Search</h2>
              <Button
                variant="link"
                className="py-1"
                onClick={() => {
                  setQuery('');
                  setSelectedTags([]);
                  setSortBy('creationDate');
                  setIsCodeRedemptionOnly(undefined);
                  setSelectedOfferType(undefined);
                  setIsSale(undefined);
                  setInputValue('');
                  setMaxPrice(undefined);
                  setMinPrice(undefined);
                  setSortDir('desc');
                }}
              >
                Clear
              </Button>
            </div>
            <Input
              type="search"
              placeholder="Search for games"
              className="mb-4"
              onChange={(e) => setInputValue(e.target.value)}
              value={inputValue}
            />
            <div
              id="selected_filters"
              className="flex flex-row flex-wrap gap-2"
            >
              {selectedTags.map((tag) => {
                const tagData = tags?.find((t) => t.id === tag);

                return (
                  <QuickPill
                    key={tag}
                    label={tagData?.name ?? tag}
                    onRemove={() =>
                      setSelectedTags((prev) => prev.filter((t) => t !== tag))
                    }
                  />
                );
              })}
              {selectedOfferType && (
                <QuickPill
                  label={
                    offersDictionary[selectedOfferType] ?? selectedOfferType
                  }
                  onRemove={() => setSelectedOfferType(undefined)}
                />
              )}
              {isCodeRedemptionOnly && (
                <QuickPill
                  label="Code Redemption Only"
                  onRemove={() => setIsCodeRedemptionOnly(undefined)}
                />
              )}
              {isSale && (
                <QuickPill label="Sale" onRemove={() => setIsSale(false)} />
              )}
              {typeof minPrice === 'number' && (
                <QuickPill
                  label={`> $${minPrice / 100}`}
                  onRemove={() => setMinPrice(undefined)}
                />
              )}
              {typeof maxPrice === 'number' && (
                <QuickPill
                  label={`< $${maxPrice / 100}`}
                  onRemove={() => setMaxPrice(undefined)}
                />
              )}
              {categories.length > 0 && (
                <QuickPill
                  label={categories
                    .map((c) => offersDictionary[c] ?? c)
                    .join(', ')}
                  onRemove={() => setCategories([])}
                />
              )}
            </div>
          </DrawerHeader>
          <ScrollArea>
            <DrawerDescription className="max-h-56 w-full">
              <div className="flex flex-col justify-between items-start gap-2 mt-4">
                <Label>Price</Label>
                <div className="flex flex-row gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    className="w-[100px]"
                    onChange={(e) =>
                      setMinPrice(Number.parseInt(e.target.value) * 100)
                    }
                    value={
                      typeof minPrice === 'number' ? minPrice / 100 : undefined
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    className="w-[100px]"
                    onChange={(e) =>
                      setMaxPrice(Number.parseInt(e.target.value) * 100)
                    }
                    value={
                      typeof maxPrice === 'number' ? maxPrice / 100 : undefined
                    }
                  />
                </div>
              </div>
              <Accordion type="single" collapsible className="w-full gap-2">
                <AccordionItem value="offerType">
                  <AccordionTrigger>Offer Type</AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2 w-full mt-2">
                    {offerTypes
                      .filter(
                        (type) => offersDictionary[type._id] !== undefined,
                      )
                      .filter((type) => {
                        // If there is a tag count, we need to filter the tags with 0 count
                        if (offerTypeCount.length > 0) {
                          return (
                            offerTypeCount.find((t) => t._id === type._id) !==
                            undefined
                          );
                        }

                        return true;
                      })
                      .sort((a, b) => {
                        const aName = offersDictionary[a._id] ?? a._id;
                        const bName = offersDictionary[b._id] ?? b._id;

                        return aName.localeCompare(bName);
                      })
                      .map((type) => (
                        <TagSelect
                          key={type._id}
                          isSelected={selectedOfferType === type._id}
                          handleSelect={handleSelectOfferType}
                          tag={{
                            id: type._id,
                            name: offersDictionary[type._id] ?? type._id,
                            aliases: [],
                            groupName: 'OFFER_TYPE',
                            status: 'ACTIVE',
                          }}
                          count={offerTypeCount.find((t) => t._id === type._id)}
                        />
                      ))}
                    {offerTypes.length === 0 && (
                      <span className="text-gray-400 px-4">
                        No offer types found
                      </span>
                    )}
                  </AccordionContent>
                </AccordionItem>
                {tagTypes.map((tagType) => {
                  const tagTypeTags = tags
                    ?.filter((tag) => tag.groupName === tagType.name)
                    .filter((tag) => {
                      // If there is a tag count, we need to filter the tags with 0 count
                      if (tagsCount.length > 0) {
                        return (
                          tagsCount.find((t) => t._id === tag.id) !== undefined
                        );
                      }

                      return true;
                    });

                  return (
                    <AccordionItem
                      key={tagType.name}
                      value={tagType.name ?? 'alltags'}
                    >
                      <AccordionTrigger>{tagType.label}</AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-2 w-[250px] mt-2">
                        {tagTypeTags?.map((tag) => (
                          <TagSelect
                            key={tag.id}
                            isSelected={selectedTags.includes(tag.id)}
                            handleSelect={handleSelect}
                            tag={tag}
                            count={tagsCount.find((t) => t._id === tag.id)}
                          />
                        ))}
                        {tagTypeTags?.length === 0 && (
                          <span className="text-gray-400 px-4">
                            No tags found
                          </span>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>

              <div className="items-center flex space-x-2 mt-4">
                <Checkbox
                  checked={isCodeRedemptionOnly ?? false}
                  onCheckedChange={(checked: boolean) =>
                    setIsCodeRedemptionOnly(checked)
                  }
                  id="isCodeRedemptionOnly"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="isCodeRedemptionOnly"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Code Redemption Only
                  </label>
                </div>
              </div>
              <div className="items-center flex space-x-2">
                <Checkbox
                  checked={isSale ?? false}
                  onCheckedChange={(checked: boolean) => setIsSale(checked)}
                  id="isSale"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="isSale"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sale
                  </label>
                </div>
              </div>
            </DrawerDescription>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

interface SearchResultsProps {
  query: string;
  selectedTags: string[];
  categories: string[];
  setTagsCount: React.Dispatch<React.SetStateAction<TagCount[]>>;
  selectedOfferType: string | undefined;
  setOfferTypesCount: React.Dispatch<
    React.SetStateAction<
      {
        _id: string;
        count: number;
      }[]
    >
  >;
  sortBy: SortBy;
  sortDir: 'asc' | 'desc';
  isCodeRedemptionOnly?: boolean;
  isSale?: boolean;
  viewType: 'grid' | 'list';
  price?: { min?: number; max?: number };
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setFetching: React.Dispatch<React.SetStateAction<boolean>>;
}

function SearchResults({
  query,
  selectedTags,
  categories,
  setTagsCount,
  selectedOfferType,
  setOfferTypesCount,
  sortBy,
  sortDir,
  isCodeRedemptionOnly,
  isSale,
  viewType,
  price,
  page,
  setPage,
  setFetching,
}: SearchResultsProps) {
  const router = useRouter();
  const queryClient = getQueryClient();
  const { country } = useCountry();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [count, setCount] = useState(0);
  const { isPending, error, data, isFetching } = useQuery({
    queryKey: [
      'search',
      {
        query,
        selectedTags,
        categories,
        sortBy,
        sortDir,
        isCodeRedemptionOnly,
        selectedOfferType,
        isSale,
        country,
        page,
        price,
      },
    ],
    queryFn: () =>
      httpClient.post<{
        elements: SingleOffer[];
        page: number;
        limit: number;
        total: number;
        query: string;
      }>(
        '/search',
        {
          sortBy: sortBy,
          sortDir: sortDir,
          limit: 32,
          page: page,
          title: query === '' ? undefined : query,
          tags: selectedTags.length === 0 ? undefined : selectedTags,
          categories: categories.length === 0 ? undefined : categories,
          isCodeRedemptionOnly,
          offerType: selectedOfferType,
          onSale: isSale,
          price: price,
        },
        {
          params: {
            country,
          },
        },
      ),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (data?.query) {
      queryClient
        .fetchQuery({
          queryKey: [
            'count',
            {
              hash: data.query,
            },
          ],
          queryFn: () =>
            httpClient.get<{
              tagCounts: TagCount[];
              offerTypeCounts: {
                _id: string;
                count: number;
              }[];
              total: number;
            }>(`/search/${data.query}/count?country=${country}`),
        })
        .then((res) => {
          setTagsCount(res.tagCounts || []);
          setOfferTypesCount(res.offerTypeCounts || []);
          setCount(res.total || 0);
        })
        .catch((e) => {
          console.error(e);
          setTagsCount([]);
          setOfferTypesCount([]);
          setCount(0);
        })
        .finally(() => {
          router.invalidate();
        });
    }
  }, [data, setTagsCount, setOfferTypesCount, country, queryClient, router]);

  useEffect(() => {
    if (data?.query && search.hash !== data.query) {
      setPage(1);

      navigate({
        search: {
          ...search,
          hash: data.query,
          page: 1,
        },
      });

      router.invalidate();
    }
  }, [data, navigate, router, search, setPage]);

  useEffect(() => {
    setFetching(isFetching);
  }, [setFetching, isFetching]);

  if (isPending && !data) {
    return (
      <div
        className={cn(
          viewType === 'grid'
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
          viewType === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
            : 'flex flex-col gap-4',
        )}
      >
        {data.elements.map((offer) => {
          if (viewType === 'grid') {
            return <OfferCard key={offer.id} offer={offer} size="md" />;
          }

          return <OfferListItem key={offer.id} game={offer} />;
        })}
      </div>
      <SearchPagination
        page={page}
        setPage={setPage}
        total={count}
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
  const search = Route.useSearch();
  const totalPages = Math.ceil(total / limit);

  // If there is only one page, don't show the pagination
  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate({
      search: {
        ...search,
        page: newPage,
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
