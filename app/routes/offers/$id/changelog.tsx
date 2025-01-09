import { ChangelogDailyChart } from '@/components/app/changelog-daily-chart';
import { ChangelogFieldsChart } from '@/components/app/changelog-fields.chart';
import { ChangelogTypesChart } from '@/components/app/changelog-types-chart';
import { ChangelogWeekdaysChart } from '@/components/app/changelog-weekdays-chart';
import { ChangeTracker } from '@/components/app/changelog/item';
import { DynamicPagination } from '@/components/app/dynamic-pagination';
import type { Change } from '@/components/modules/changelist';
import { Skeleton } from '@/components/ui/skeleton';
import { getQueryClient } from '@/lib/client';
import { generateOfferMeta } from '@/lib/generate-offer-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { httpClient } from '@/lib/http-client';
import type { ChangelogStats } from '@/types/changelog';
import type { SingleOffer } from '@/types/single-offer';
import {
  dehydrate,
  HydrationBoundary,
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

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

    const offer = await queryClient.ensureQueryData({
      queryKey: ['offer', { id: params.id }],
      queryFn: () => httpClient.get<SingleOffer>(`/offers/${params.id}`),
    });

    await queryClient.prefetchQuery({
      queryKey: ['changelog', { id: params.id, page: 1 }],
      queryFn: () => httpClient.get<Change[]>(`/offers/${params.id}/changelog`),
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
  const [page] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['changelog', { id, page }],
    queryFn: () =>
      httpClient.get<Change[]>(`/offers/${id}/changelog`, {
        params: {
          page,
        },
      }),
    placeholderData: keepPreviousData,
  });
  const { data: stats } = useQuery({
    queryKey: ['changelog-stats', { id }],
    queryFn: () =>
      httpClient.get<ChangelogStats>(`/offers/${id}/changelog/stats`, {
        params: {
          // One year ago
          from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
      }),
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
      <div className="inline-flex justify-between items-center">
        <h2 className="text-2xl font-bold">Changelog</h2>
      </div>
      <div className="flex flex-col w-full gap-4">
        {data
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .map((changelist) => (
            <ChangeTracker
              _id={changelist._id}
              key={changelist._id}
              timestamp={changelist.timestamp}
              document={changelist.document}
              metadata={changelist.metadata}
            />
          ))}
      </div>
      {/* <DynamicPagination
        currentPage={page}
        setPage={setPage}
        totalPages={Math.ceil(1000 / 25)}
      /> */}
      <ChangelogDailyChart
        chartData={stats?.dailyChanges as ChangelogStats['dailyChanges']}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChangelogWeekdaysChart chartData={stats?.weekdayChanges || {}} />
        <ChangelogFieldsChart chartData={stats?.changeFields || {}} />
        <ChangelogTypesChart
          chartData={
            stats?.changeTypes || ({} as ChangelogStats['changeTypes'])
          }
        />
      </div>
    </section>
  );
}
