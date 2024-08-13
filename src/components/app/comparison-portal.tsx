import * as Portal from '@radix-ui/react-portal';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';
import { useCompare } from '~/hooks/use-compare';
import { httpClient } from '~/lib/http-client';
import { cn } from '~/lib/utils';
import type { SingleOffer } from '~/types/single-offer';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { Image } from './image';
import { getImage } from '~/lib/getImage';

const CompareIcon = (props: JSX.IntrinsicElements['svg']) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
    className={cn('size-6', props.className)}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
    />
  </svg>
);

export function ComparisonPortal() {
  const { compare, addToCompare, removeFromCompare } = useCompare();
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Portal.Root>
      {compare.length > 0 && (
        <div className="fixed top-0 right-0 m-4">
          <button
            className="bg-card rounded-full p-2 relative z-10"
            onClick={() => setOpen((prev) => !prev)}
            type="button"
          >
            <span className="absolute -top-2 -right-2 bg-primary/10 text-white rounded-full text-xs size-6 p-1">
              {compare.length}
            </span>
            <CompareIcon className="text-white size-7" />
          </button>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <span
            className="absolute inset-0 cursor-pointer w-full h-full"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-card rounded-lg p-4 w-fit max-w-5xl">
              <CompareTable />
            </div>
          </div>
        </div>
      )}
    </Portal.Root>
  );
}

function CompareTable() {
  const { compare } = useCompare();

  const queries = useQueries({
    queries: compare.map((id) => ({
      queryKey: ['offer', { id }],
      queryFn: () => httpClient.get<SingleOffer>(`/offers/${id}`),
    })),
  });

  return (
    <ScrollArea>
      <div className="flex flex-row gap-2">
        {queries.map((query, index) => (
          <SingleGame key={compare[index]} query={query} />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function SingleGame({ query }: { query: UseQueryResult<SingleOffer, Error> }) {
  const { data, isLoading, isError } = query;

  if (isLoading || !data) {
    return <Skeleton className="w-48 h-48" />;
  }

  if (isError) {
    return <div>Error</div>;
  }

  return (
    <div className="flex flex-col gap-2 h-[600px] w-72">
      <Image
        src={
          getImage(data.keyImages, ['OfferImageWide', 'Featured', 'DieselStoreFrontWide'])?.url ??
          '/placeholder.webp'
        }
        alt={data.title}
        className="w-full h-48 object-cover"
        width={600}
        height={400}
      />
      <h3 className="font-bold">{data.title}</h3>
      <p>{data.price?.price.discountPrice}</p>
    </div>
  );
}
