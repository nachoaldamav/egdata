import { httpClient } from '@/lib/http-client';
import type { SingleOffer } from '@/types/single-offer';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/tables/offers/table';
import { columns } from '@/components/tables/offers/columns';
import { SandboxHeader } from '@/components/app/sandbox-header';
import type { SingleSandbox } from '@/types/single-sandbox';
import { getQueryClient } from '@/lib/client';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { generateSandboxMeta } from '@/lib/generate-sandbox-meta';

export const Route = createFileRoute('/sandboxes/$id/offers')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <SandboxOffersPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context, params }) => {
    const { id } = params;
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['sandbox', 'offers', { id }],
      queryFn: () => httpClient.get<SingleOffer[]>(`/sandboxes/${id}/offers`),
    });

    return {
      id,
      dehydratedState: dehydrate(queryClient),
    };
  },

  meta({ params, loaderData, matches }) {
    const queryClient = getQueryClient();
    const { dehydratedState } = loaderData;
    const { id } = params;

    const sandbox = getFetchedQuery<SingleSandbox>(
      queryClient,
      dehydratedState,
      ['sandbox', { id }]
    );

    const offer = getFetchedQuery<SingleOffer>(queryClient, dehydratedState, [
      'sandbox',
      'base-game',
      { id },
    ]);

    if (!sandbox) {
      return [
        {
          title: 'Sandbox not found',
          description: 'Sandbox not found',
        },
      ];
    }

    return generateSandboxMeta(sandbox, offer, 'Offers');
  },
});

function SandboxOffersPage() {
  const { id } = Route.useParams();
  const { data: offers } = useQuery({
    queryKey: ['sandbox', 'offers', { id }],
    queryFn: () => httpClient.get<SingleOffer[]>(`/sandboxes/${id}/offers`),
  });
  const { data: baseGame } = useQuery({
    queryKey: ['sandbox', 'base-game', { id }],
    queryFn: () => httpClient.get<SingleOffer>(`/sandboxes/${id}/base-game`),
  });
  const { data: sandbox } = useQuery({
    queryKey: ['sandbox', { id }],
    queryFn: () => httpClient.get<SingleSandbox>(`/sandboxes/${id}`),
  });

  if (!offers) {
    return null;
  }

  return (
    <main className="flex flex-col items-start justify-start h-full gap-4 px-4 w-full">
      <SandboxHeader
        title={
          baseGame?.title ?? sandbox?.displayName ?? (sandbox?.name as string)
        }
        section="offers"
        id={id}
        sandbox={id}
      />
      <DataTable columns={columns} data={offers} />
    </main>
  );
}
