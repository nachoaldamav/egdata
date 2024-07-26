import { ChevronRightIcon } from '@radix-ui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible';
import { Input } from '~/components/ui/input';
import { client } from '~/lib/client';
import { cn } from '~/lib/utils';

export interface Root {
  hits: Hit[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

interface Hit {
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

export default function ChangelogPage() {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'changelogs',
      {
        query,
      },
    ],
    queryFn: () =>
      client
        .get<Root>('/search/changelog', {
          params: {
            query,
          },
        })
        .then((res) => res.data),
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto px-4 py-8 sm:px-6">
      <div className="flex items-center gap-4">
        <Input
          type="search"
          placeholder="Search changelogs..."
          className="flex-1 bg-background"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button>Search</Button>
      </div>
      <div className="grid gap-4">
        {isLoading && <div>Loading...</div>}
        {isError && <div>Error fetching data</div>}
        {data?.hits.map((hit) => (
          <ChangelogItem key={hit._id} hit={hit} query={query} />
        ))}
      </div>
    </div>
  );
}

function ChangelogItem({ hit, query }: { hit: Hit; query: string }) {
  const [open, setOpen] = useState(false);

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
              <h3 className="font-medium">{ValueToString(hit.metadata.contextId, query)}</h3>
              <Badge variant="secondary" className="text-xs">
                {hit.metadata.contextType}
              </Badge>
            </div>
            <p className="text-muted-foreground">{hit.metadata.changes.length} changes</p>
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
                  <h4 className="font-medium">{ValueToString(change.field, query)}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {change.changeType}
                  </Badge>
                </div>
                <div className="grid gap-2">
                  <div>
                    <span className="font-medium">Old value:</span>{' '}
                    <span className="text-muted-foreground">
                      {ValueToString(change.oldValue, query)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">New value:</span>{' '}
                    <span className="text-muted-foreground">
                      {ValueToString(change.newValue, query)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ValueToString(value: unknown, query: string) {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? <mark key={i}>{part}</mark> : part,
    );
  };

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
