import { useLoaderData, useSearchParams } from '@remix-run/react';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import cookie from 'cookie';
import { Input } from '~/components/ui/input';
import { getQueryClient } from '~/lib/client';
import type { FullTag } from '~/types/tags';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useEffect, useState, useCallback } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import lodash from 'lodash';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '~/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import { OfferCard as GameCard, GameCardSkeleton } from '~/components/app/offer-card';
import type { SingleOffer } from '~/types/single-offer';
import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNextButton,
  PaginationPreviousButton,
} from '~/components/ui/pagination';
import { Checkbox } from '~/components/ui/checkbox';
import { offersDictionary } from '~/lib/offers-dictionary';
import getCountryCode from '~/lib/get-country-code';
import { useCountry } from '~/hooks/use-country';
import { XIcon } from '@primer/octicons-react';
import { ArrowDownIcon, GridIcon, ListBulletIcon } from '@radix-ui/react-icons';
import { OfferListItem } from '~/components/app/game-card';
import { usePreferences } from '~/hooks/use-preferences';
import { Label } from '~/components/ui/label';
import { httpClient } from '~/lib/http-client';
import * as Portal from '@radix-ui/react-portal';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '~/components/ui/drawer';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Settings, SettingsIcon } from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Search - egdata.app' },
    {
      name: 'description',
      content: 'Search for games on egdata.app',
    },
  ];
};

const tagTypes: { name: string; type: 'single' | 'multiple'; label: string }[] = [
  { name: 'event', type: 'single', label: 'Events' },
  { name: 'genre', type: 'multiple', label: 'Genres' },
  { name: 'usersay', type: 'multiple', label: 'User Say' },
  { name: 'feature', type: 'multiple', label: 'Features' },
  { name: 'epicfeature', type: 'multiple', label: 'Epic Features' },
  { name: 'accessibility', type: 'multiple', label: 'Accessibility' },
];

type TagCount = {
  _id: string;
  count: number;
};

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

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  let hash = url.searchParams.get('hash');
  const initialTags = url.searchParams.get('tags');
  const sortBy = url.searchParams.get('sort_by');
  const q = url.searchParams.get('q');
  const offerType = url.searchParams.get('offer_type');
  const page = url.searchParams.get('page');

  if (!hash) {
    // Try to get the hash from the request.headers.referer
    const referer = request.headers.get('referer');

    if (referer) {
      const refererUrl = new URL(referer);
      hash = refererUrl.searchParams.get('hash');
    }
  }

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

  return {
    tags,
    hash: query,
    offerTypes,
    country,
    initialTags: initialTags ? initialTags.split(',') : [],
    initialQuery: q,
    page: page ? Number.parseInt(page) : 1,
  };
}

export default function SearchPage() {
  const {
    tags: initialTagList,
    hash,
    offerTypes,
    initialTags,
    initialQuery,
    page: initialPage,
  } = useLoaderData<typeof loader>();
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
  const [selectedOfferType, setSelectedOfferType] = useState<string | undefined>(
    hash?.offerType as string,
  );
  const [tagsCount, setTagsCount] = useState<TagCount[]>([]);
  const [offerTypeCount, setOfferTypeCount] = useState<
    {
      _id: string;
      count: number;
    }[]
  >([]);
  const [query, setQuery] = useState<string>(initialQuery ?? (hash?.title as string) ?? '');
  const [sortBy, setSortBy] = useState<SortBy>((hash?.sortBy as SortBy) ?? 'lastModifiedDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isCodeRedemptionOnly, setIsCodeRedemptionOnly] = useState<boolean | undefined>(
    (hash?.isCodeRedemptionOnly as boolean) ?? undefined,
  );
  const [isSale, setIsSale] = useState<boolean | undefined>(hash?.onSale as boolean);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(
    hash?.price?.max as number | undefined,
  );
  const [minPrice, setMinPrice] = useState<number | undefined>(
    hash?.price?.min as number | undefined,
  );
  // New state for the immediate input value
  const [inputValue, setInputValue] = useState<string>(query);
  const [page, setPage] = useState(initialPage ?? 1);

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
    lodash.debounce((value: string) => {
      setQuery(value);
    }, 300),
    [],
  );

  useEffect(() => {
    handleQueryChange(inputValue);
  }, [inputValue, handleQueryChange]);

  return (
    <div className="flex flex-row min-h-[85vh] w-full max-w-full gap-2">
      <aside id="form" className="flex-col gap-1 p-4 max-w-[300px] hidden md:flex">
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
                onRemove={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
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
          {isSale && <QuickPill label="Sale" onRemove={() => setIsSale(false)} />}
          {typeof minPrice === 'number' && (
            <QuickPill label={`> $${minPrice / 100}`} onRemove={() => setMinPrice(undefined)} />
          )}
          {typeof maxPrice === 'number' && (
            <QuickPill label={`< $${maxPrice / 100}`} onRemove={() => setMaxPrice(undefined)} />
          )}
        </div>
        <div className="flex flex-col justify-between items-start gap-2 mt-4">
          <Label>Price</Label>
          <div className="flex flex-row gap-2">
            <Input
              type="number"
              placeholder="Min"
              className="w-[100px]"
              onChange={(e) => setMinPrice(Number.parseInt(e.target.value) * 100)}
              value={typeof minPrice === 'number' ? minPrice / 100 : undefined}
            />
            <Input
              type="number"
              placeholder="Max"
              className="w-[100px]"
              onChange={(e) => setMaxPrice(Number.parseInt(e.target.value) * 100)}
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
                    return offerTypeCount.find((t) => t._id === type._id) !== undefined;
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
              <AccordionItem key={tagType.name} value={tagType.name}>
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
            onCheckedChange={(checked: boolean) => setIsCodeRedemptionOnly(checked)}
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
      <main id="results" className="flex flex-col gap-4 px-4 overflow-hidden flex-1">
        <header className="flex flex-row justify-between items-center gap-4">
          <h2 className="flex-none text-2xl">Results</h2>
          <div className="flex flex-row gap-2">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue className="text-sm">{sortByDisplay[sortBy]}</SelectValue>
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
        />
      </main>
      <Portal.Root>
        <section className="fixed bottom-0 left-0 right-0 z-10 mx-auto w-full p-4 block sm:hidden">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" className="mx-auto rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                  />
                </svg>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
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
                <div id="selected_filters" className="flex flex-row flex-wrap gap-2">
                  {selectedTags.map((tag) => {
                    const tagData = tags?.find((t) => t.id === tag);

                    return (
                      <QuickPill
                        key={tag}
                        label={tagData?.name ?? tag}
                        onRemove={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
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
                  {isSale && <QuickPill label="Sale" onRemove={() => setIsSale(false)} />}
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
                </div>
              </DrawerHeader>
              <ScrollArea>
                <DrawerFooter className="max-h-56 w-full">
                  <div className="flex flex-col justify-between items-start gap-2 mt-4">
                    <Label>Price</Label>
                    <div className="flex flex-row gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        className="w-[100px]"
                        onChange={(e) => setMinPrice(Number.parseInt(e.target.value) * 100)}
                        value={typeof minPrice === 'number' ? minPrice / 100 : undefined}
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        className="w-[100px]"
                        onChange={(e) => setMaxPrice(Number.parseInt(e.target.value) * 100)}
                        value={typeof maxPrice === 'number' ? maxPrice / 100 : undefined}
                      />
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full gap-2">
                    <AccordionItem value="offerType">
                      <AccordionTrigger>Offer Type</AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-2 w-full mt-2">
                        {offerTypes
                          .filter((type) => offersDictionary[type._id] !== undefined)
                          .filter((type) => {
                            // If there is a tag count, we need to filter the tags with 0 count
                            if (offerTypeCount.length > 0) {
                              return offerTypeCount.find((t) => t._id === type._id) !== undefined;
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
                        <AccordionItem key={tagType.name} value={tagType.name}>
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
                      onCheckedChange={(checked: boolean) => setIsCodeRedemptionOnly(checked)}
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
                </DrawerFooter>
              </ScrollArea>
            </DrawerContent>
          </Drawer>
        </section>
      </Portal.Root>
    </div>
  );
}

function TagSelect({
  isSelected,
  handleSelect,
  tag,
  count,
}: { isSelected: boolean; handleSelect: (tag: string) => void; tag: FullTag; count?: TagCount }) {
  return (
    <Button
      variant="outline"
      onClick={() => handleSelect(tag.id)}
      className={cn(
        'rounded-lg inline-flex justify-between items-center gap-2 px-4 py-2 text-sm w-[250px]',
        isSelected
          ? 'bg-white/5 text-white'
          : 'bg-transparent text-white hover:bg-white/5 transition-colors duration-200 ease-in-out hover:text-white',
      )}
    >
      <div className="inline-flex items-center justify-between w-full">
        <span>{tag.name}</span>
        {count && <span className="text-xs text-gray-400">{count.count}</span>}
      </div>
    </Button>
  );
}

function SearchResults({
  query,
  selectedTags,
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
}: {
  query: string;
  selectedTags: string[];
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
}) {
  const queryClient = getQueryClient();
  const { country } = useCountry();
  const [, setSearchParams] = useSearchParams();
  const [count, setCount] = useState(0);
  const { isPending, error, data } = useQuery({
    queryKey: [
      'search',
      {
        query,
        selectedTags,
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
        });
    }
  }, [data, setTagsCount, setOfferTypesCount, country, queryClient]);

  useEffect(() => {
    if (data?.query) {
      console.log('setting search params', data.query);
      setSearchParams(
        { hash: data.query },
        {
          replace: true,
        },
      );
    }
  }, [data, setSearchParams]);

  // Set page to 1 when any filter changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: We don't need to add all the dependencies
  useEffect(() => {
    setPage(1);
  }, [query, selectedTags, selectedOfferType, sortBy, isCodeRedemptionOnly, isSale]);

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
            return <GameCard key={offer.id} offer={offer} size="md" />;
          }

          return <OfferListItem key={offer.id} game={offer} />;
        })}
      </div>
      <SearchPagination page={page} setPage={setPage} total={count} limit={data.limit} />
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
  const totalPages = Math.ceil(total / limit);

  const pagesToShow = 3;
  const startPage = Math.max(1, page - Math.floor(pagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + pagesToShow - 1);

  // If there is only one page, don't show the pagination
  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPreviousButton
            onClick={() => {
              if (page > 1) {
                handlePageChange(page - 1);
              }
            }}
            disabled={page === 1}
          />
        </PaginationItem>
        {startPage > 1 && (
          <PaginationItem>
            <PaginationButton onClick={() => handlePageChange(1)} disabled={page === 1}>
              1
            </PaginationButton>
          </PaginationItem>
        )}

        {startPage > 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {Array.from({ length: endPage - startPage + 1 }).map((_, i) => {
          const pageNumber = startPage + i;

          return (
            <PaginationItem key={pageNumber}>
              <PaginationButton
                onClick={() => handlePageChange(pageNumber)}
                disabled={pageNumber === page}
              >
                {pageNumber}
              </PaginationButton>
            </PaginationItem>
          );
        })}

        {endPage < totalPages - 1 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {endPage < totalPages && (
          <PaginationItem>
            <PaginationButton
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
            >
              {totalPages}
            </PaginationButton>
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNextButton
            onClick={() => {
              handlePageChange(page + 1);
            }}
            disabled={page === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/**
 * Pill component for quick access to remove filters
 */
function QuickPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onRemove}
      className="rounded-xl px-3 py-1 text-xs bg-white/5 text-white h-7"
    >
      <span>{label}</span>
      <XIcon className="h-4 w-4" />
    </Button>
  );
}
