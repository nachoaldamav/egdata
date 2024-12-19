import { ChangeItem } from '@/components/app/changelog-item';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useLocale } from '@/hooks/use-locale';
import { getQueryClient } from '@/lib/client';
import { generateOfferMeta } from '@/lib/generate-offer-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { httpClient } from '@/lib/http-client';
import type { ChangeRecord } from '@/types/changelog';
import type { SingleOffer } from '@/types/single-offer';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/offers/$id/changelog')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <ChangelogPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ params, context }) => {
    const { queryClient } = context;
    const { id } = params;

    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      dehydrate(queryClient),
      ['offer', { id: params.id }],
    );

    await queryClient.prefetchQuery({
      queryKey: ['changelog', { id: params.id }],
      queryFn: () =>
        httpClient.get<ChangeRecord[]>(`/offers/${params.id}/changelog`),
    });

    return {
      id,
      offer,
      dehydratedState: dehydrate(queryClient),
    };
  },

  head: (ctx) => {
    const { params } = ctx;
    const queryClient = getQueryClient();

    if (!ctx.loaderData) {
      return {
        meta: [
          {
            title: 'Offer not found',
            description: 'Offer not found',
          },
        ],
      };
    }

    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      ctx.loaderData?.dehydratedState,
      ['offer', { id: params.id }],
    );

    if (!offer) {
      return {
        meta: [
          {
            title: 'Offer not found',
            description: 'Offer not found',
          },
        ],
      };
    }

    return {
      meta: generateOfferMeta(offer, 'Changelog'),
    };
  },
});

function ChangelogPage() {
  const { id } = Route.useLoaderData();
  const { timezone } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['changelog', { id }],
    queryFn: () => httpClient.get<ChangeRecord[]>(`/offers/${id}/changelog`),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 mt-6">
        <h2 className="text-2xl font-bold">Changelog</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: This is a fallback component
            <Skeleton key={index} className="w-full h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-2xl font-bold text-gray-300">
          No changelog available
        </p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4 mt-6">
      <div className="inline-flex justify-between items-center ">
        <h2 className="text-2xl font-bold">Changelog</h2>
      </div>
      <div className="flex flex-col w-full gap-4">
        <TooltipProvider>
          {data
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            )
            .map((changelist) => (
              <div
                key={changelist._id}
                className="space-y-2 bg-gray-800 p-4 rounded-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-lg">
                      {changelist.metadata.contextType}
                    </span>
                    <span className="font-medium text-lg">-</span>
                    <span className="text-medium text-gray-400 font-mono">
                      {changelist.metadata.contextId}
                    </span>
                  </div>
                  <time className="text-sm text-gray-400">
                    {new Date(changelist.timestamp).toLocaleDateString(
                      'en-UK',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        timeZone: timezone,
                      },
                    )}
                  </time>
                </div>
                <div className="space-y-2 pt-2">
                  {changelist.metadata.changes.map((change, index) => (
                    <ChangeItem key={index} change={change} />
                  ))}
                </div>
              </div>
            ))}
        </TooltipProvider>
      </div>
    </section>
  );
}
