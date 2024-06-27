import { useLoaderData } from '@remix-run/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible';
import { Input } from '~/components/ui/input';
import { client } from '~/lib/client';
import type { FullTag } from '~/types/tags';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { ScrollArea } from '~/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '~/components/ui/select';
import { GameCard, GameCardSkeleton } from '~/components/app/offer-card';
import { SingleOffer } from '~/types/single-offer';

export async function loader() {
  const [tagsData] = await Promise.allSettled([client.get<FullTag[]>('/search/tags')]);

  const tags = tagsData.status === 'fulfilled' ? tagsData.value.data : [];

  return {
    tags,
  };
}

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
  | 'pcReleaseDate';

const sortByDisplay: Record<SortBy, string> = {
  releaseDate: 'Release Date',
  lastModifiedDate: 'Modified Date',
  effectiveDate: 'Effective Date',
  creationDate: 'Creation Date',
  viewableDate: 'Viewable Date',
  pcReleaseDate: 'PC Release Date',
};

export default function SearchPage() {
  const { tags } = useLoaderData<typeof loader>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsCount, setTagsCount] = useState<TagCount[]>([]);
  const [query, setQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortBy>('creationDate');

  function handleSelect(tag: string) {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }

      return [...prev, tag];
    });
  }

  return (
    <div className="flex flex-row flex-1 min-h-[85vh] min-w-screen">
      <aside id="form" className="flex flex-col gap-2 p-4">
        <h2>Search</h2>
        <Input
          type="search"
          placeholder="Search for games"
          className="mb-4"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {tagTypes.map((tagType) => {
          const tagTypeTags = tags
            .filter((tag) => tag.groupName === tagType.name)
            .filter((tag) => {
              // If there is a tag count, we need to filter the tags with 0 count
              if (tagsCount.length > 0) {
                return tagsCount.find((t) => t._id === tag.id) !== undefined;
              }

              return true;
            });

          return (
            <Collapsible key={tagType.name}>
              <CollapsibleTrigger className="flex justify-between items-center gap-2 py-2 px-4 text-sm font-bold rounded-lg bg-white/10 w-full">
                <span>{tagType.label}</span>
                <ChevronDownIcon className="h-4 w-4" />
              </CollapsibleTrigger>
              <ScrollArea className="flex flex-col gap-2 w-full max-h-[500px]">
                <CollapsibleContent className="flex flex-col gap-2 w-[250px] mt-2">
                  {tagTypeTags.map((tag) => (
                    <TagSelect
                      key={tag.id}
                      isSelected={selectedTags.includes(tag.id)}
                      handleSelect={handleSelect}
                      tag={tag}
                      count={tagsCount.find((t) => t._id === tag.id)}
                    />
                  ))}
                  {tagTypeTags.length === 0 && (
                    <span className="text-gray-400 px-4">No tags found</span>
                  )}
                </CollapsibleContent>
              </ScrollArea>
            </Collapsible>
          );
        })}
      </aside>
      <main id="results" className="flex flex-col flex-1 gap-4 px-4">
        <header className="flex flex-row justify-between items-center gap-4">
          <h2 className="flex-none text-2xl">Results</h2>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue className="text-sm">{sortByDisplay[sortBy]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="releaseDate">Release Date</SelectItem>
              <SelectItem value="lastModifiedDate">Last Modified Date</SelectItem>
              <SelectItem value="effectiveDate">Effective Date</SelectItem>
              <SelectItem value="creationDate">Creation Date</SelectItem>
              <SelectItem value="viewableDate">Viewable Date</SelectItem>
              <SelectItem value="pcReleaseDate">PC Release Date</SelectItem>
            </SelectContent>
          </Select>
        </header>
        <SearchResults
          query={query}
          selectedTags={selectedTags}
          setTagsCount={setTagsCount}
          sortBy={sortBy}
        />
      </main>
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
        'rounded-lg inline-flex justify-between items-center gap-2 px-4 py-2 text-sm',
        isSelected
          ? 'bg-white/5 text-white'
          : 'bg-transparent text-white hover:bg-white/5 transition-colors duration-200 ease-in-out hover:text-white',
      )}
    >
      <span className="inline-flex gap-2 items-center justify-start">
        {tag.name} {count && <span className="text-xs text-gray-400">({count.count})</span>}
      </span>
      {isSelected && <CheckIcon className="h-4 w-4" />}
    </Button>
  );
}

function SearchResults({
  query,
  selectedTags,
  setTagsCount,
  sortBy,
}: {
  query: string;
  selectedTags: string[];
  setTagsCount: React.Dispatch<React.SetStateAction<TagCount[]>>;
  sortBy: SortBy;
}) {
  const { isPending, error, data } = useQuery({
    queryKey: ['search', query, selectedTags, sortBy],
    queryFn: () =>
      client
        .post<{
          elements: SingleOffer[];
          page: number;
          limit: number;
          total: number;
          /**
           * The query hash to calculate the tags count
           */
          query: string;
        }>('/offers', {
          sortBy: sortBy,
          limit: 32,
          page: 1,
          title: query === '' ? undefined : query,
          tags: selectedTags.length === 0 ? undefined : selectedTags,
        })
        .then((res) => res.data),
  });

  useEffect(() => {
    if (data?.query)
      client
        .get<{
          tagCounts: TagCount[];
        }>(`/search/${data.query}/count`)
        .then((res) => setTagsCount(res.data.tagCounts || []))
        .catch(console.error);
  }, [data, setTagsCount]);

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 34 }).map((_, i) => (
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.elements.map((offer) => (
        <GameCard key={offer.id} game={offer} />
      ))}
    </div>
  );
}
