import { httpClient } from '@/lib/http-client';
import type { SingleItem } from '@/types/single-item';
import {
  dehydrate,
  HydrationBoundary,
  useQueries,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/tables/items/table';
import { columns } from '@/components/tables/items/columns';
import type { SingleOffer } from '@/types/single-offer';
import { SandboxHeader } from '@/components/app/sandbox-header';
import type { SingleSandbox } from '@/types/single-sandbox';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { getQueryClient } from '@/lib/client';
import { generateSandboxMeta } from '@/lib/generate-sandbox-meta';

export const Route = createFileRoute('/sandboxes/$id/items')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <SandboxItemsPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context, params }) => {
    const { id } = params;
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['sandbox', 'items', { id }],
      queryFn: () => httpClient.get<SingleItem[]>(`/sandboxes/${id}/items`),
    });

    return {
      id,
      dehydratedState: dehydrate(queryClient),
    };
  },

  meta({ params, loaderData }) {
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

    return generateSandboxMeta(sandbox, offer, 'Items');
  },
});

function SandboxItemsPage() {
  const { id } = Route.useParams();
  const [itemsQuery, baseGameQuery, sandboxQuery] = useQueries({
    queries: [
      {
        queryKey: ['sandbox', 'items', { id }],
        queryFn: () => httpClient.get<SingleItem[]>(`/sandboxes/${id}/items`),
      },
      {
        queryKey: ['sandbox', 'base-game', { id }],
        queryFn: () =>
          httpClient.get<SingleOffer>(`/sandboxes/${id}/base-game`),
      },
      {
        queryKey: ['sandbox', { id }],
        queryFn: () => httpClient.get<SingleSandbox>(`/sandboxes/${id}`),
      },
    ],
  });

  const { data: items } = itemsQuery;
  const { data: baseGame } = baseGameQuery;
  const { data: sandbox } = sandboxQuery;

  if (!items) {
    return null;
  }

  return (
    <main className="flex flex-col items-start justify-start h-full gap-4 px-4 w-full">
      <SandboxHeader
        title={
          baseGame?.title ?? sandbox?.displayName ?? (sandbox?.name as string)
        }
        section="items"
        id={id}
        sandbox={id}
      />
      <DataTable columns={columns} data={items} />
    </main>
  );
}
