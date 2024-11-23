import * as React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import type { SingleOffer } from '@/types/single-offer';
import type { SingleItem } from '@/types/single-item';
import { z } from 'zod';
import { zodSearchValidator } from '@tanstack/router-zod-adapter';
import { httpClient } from '@/lib/http-client';
import {
  dehydrate,
  HydrationBoundary,
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DynamicPagination } from '@/components/app/dynamic-pagination';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ArrowRightIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Root {
  hits: (OfferHit | ItemHit | AssetHit | Hit)[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

interface DefaultHit {
  _id: string;
  timestamp: string;
  metadata: Metadata;
}

interface Metadata {
  changes: Change[];
  contextId: string;
  contextType: string;
}

interface Change {
  changeType: string;
  field: string;
  newValue: unknown;
  oldValue: unknown;
}

interface OfferHit extends DefaultHit {
  metadata: Metadata & { contextType: 'offer' };
  document: SingleOffer;
}

interface ItemHit extends DefaultHit {
  metadata: Metadata & { contextType: 'item' };
  document: SingleItem;
}

interface AssetHit extends DefaultHit {
  metadata: Metadata & { contextType: 'asset' };
  document: SingleItem;
}

interface Hit {
  _id: string;
  timestamp: string;
  metadata: Metadata;
  document: null;
}

const searchParamsSchema = z.object({
  query: z.string().optional(),
  page: z.number().optional(),
});

export const Route = createFileRoute('/changelog')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <ChangelogPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context }) => {
    const { queryClient, search } = context;

    const query = search.query ?? '';
    const page = search.page ?? 1;

    await queryClient.prefetchQuery({
      queryKey: [
        'changelogs',
        {
          query,
          page,
        },
      ],
      queryFn: () =>
        httpClient.get<Root>('/search/changelog', {
          params: {
            query,
            page,
          },
        }),
    });

    return {
      dehydratedState: dehydrate(queryClient),
      page,
      query,
    };
  },

  beforeLoad: async ({ search }) => {
    return {
      search,
    };
  },

  validateSearch: zodSearchValidator(searchParamsSchema),

  head() {
    return {
      meta: [
        {
          title: 'Changelog | egdata.app',
        },
      ],
    };
  },
});

function ChangelogPage() {
  const { page: initialPage, query: initialQuery } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const [page, setPage] = React.useState(initialPage || 1);
  const [query, setQuery] = React.useState(initialQuery || '');
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'changelogs',
      {
        query,
        page,
      },
    ],
    queryFn: () =>
      httpClient.get<Root>('/search/changelog', {
        params: {
          query,
          page,
        },
      }),
    refetchOnMount: false,
    placeholderData: keepPreviousData,
  });

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);

    // Add query params to URL
    const url = new URL(window.location.href);
    url.searchParams.set('page', '1');
    url.searchParams.set('query', newQuery);
    window.history.pushState({}, '', url.toString());
  };

  const totalPages = Math.ceil(
    (data?.estimatedTotalHits || 0) / (data?.limit || 1),
  );

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
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-4 py-8 sm:px-6">
      <div className="flex items-center gap-4">
        <Input
          type="search"
          placeholder="Search changelogs..."
          className="flex-1 bg-background"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
        />
        <Button>Search</Button>
      </div>
      <div className="grid gap-4">
        {isLoading && <div>Loading...</div>}
        {isError && <div>Error fetching data</div>}
        {data?.hits
          // Filter out hits without metadata
          .filter((hit) => hit.metadata)
          .map((hit) => (
            <ChangelogItem key={hit._id} hit={hit} query={query} />
          ))}
      </div>
      <DynamicPagination
        totalPages={totalPages}
        currentPage={page}
        setPage={handlePageChange}
      />
    </div>
  );
}

function ChangelogItem({
  hit,
  query,
}: {
  hit: OfferHit | ItemHit | AssetHit | Hit;
  query: string;
}) {
  const [open, setOpen] = React.useState(false);
  const title = hit.document?.title || hit.metadata.contextId;

  return (
    <Collapsible>
      <CollapsibleTrigger
        className="flex items-start gap-4 p-4 rounded-lg bg-muted hover:bg-muted/50 transition-colors w-full cursor-pointer"
        asChild
        onClick={() => setOpen((open) => !open)}
        value={open as unknown as string}
      >
        <div className="flex items-start gap-4 w-full">
          <div className="flex-1 grid gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{ValueToString(title, query)}</h3>
              <Badge variant="secondary" className="text-xs">
                {hit.metadata.contextType}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {hit.metadata.changes.length} changes
            </p>
            <div className="text-xs text-muted-foreground">
              {new Date(hit.timestamp).toLocaleString('en-UK', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
              })}
            </div>
          </div>

          <ChevronRightIcon
            className={cn(
              'w-5 h-5 text-muted-foreground transition-transform ease-in-out duration-200',
              open ? 'transform rotate-90' : 'transform rotate-0',
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="w-full max-w-5xl">
        <div className="p-4">
          <div className="text-muted-foreground flex items-start w-full gap-2 flex-col">
            {hit.metadata.changes.map((change) => (
              <div
                key={change.field}
                className="grid gap-2 border border-muted/50 p-4 rounded-lg w-full"
              >
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">
                    {ValueToString(change.field, query)}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {change.changeType}
                  </Badge>
                </div>
                <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 relative mt-2">
                  <div className="pr-2 flex flex-col gap-1 items-center justify-center">
                    <span className="text-muted-foreground">
                      {ValueToString(change.oldValue, query, change.field)}
                    </span>
                  </div>
                  <div className="pl-8 flex flex-col gap-1 items-center justify-center">
                    <span className="text-muted-foreground">
                      {ValueToString(change.newValue, query, change.field)}
                    </span>
                  </div>
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <ArrowRightIcon className="size-6 text-muted-foreground" />
                  </span>
                </div>
              </div>
            ))}
          </div>
          {(hit.metadata.contextType === 'offer' ||
            hit.metadata.contextType === 'item') && (
            <Link
              to={`/${hit.metadata.contextType}s/${hit.metadata.contextId}`}
              className="w-full bg-card p-4 rounded-lg mt-4 block"
            >
              View {hit.metadata.contextType}
            </Link>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ValueToString(value: unknown, query: string, field?: string) {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        // biome-ignore lint/suspicious/noArrayIndexKey: index is the only key
        <mark key={i}>{part}</mark>
      ) : (
        part
      ),
    );
  };

  if (field === 'keyImages' && value !== null) {
    const typedValue = value as { url: string; md5: string; type: string };
    return (
      <div className="flex items-center justify-center gap-2">
        <img
          src={typedValue.url}
          alt={typedValue.md5}
          className="w-1/2 h-auto object-cover rounded-lg"
        />
      </div>
    );
  }

  if (field?.includes('Date') && typeof value === 'string') {
    return new Date(value).toLocaleString('en-UK', {
      weekday: undefined,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
  }

  if (field === 'tags' && value !== null) {
    const typedValue = value as { id: string; name: string };
    return <span className="font-medium">{typedValue.name}</span>;
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (typeof value === 'string') {
    return <>{highlightText(value, query)}</>;
  }

  if (typeof value === 'object') {
    return (
      <pre>
        <code>{highlightText(JSON.stringify(value, null, 2), query)}</code>
      </pre>
    );
  }

  return value?.toString() || 'N/A';
}
