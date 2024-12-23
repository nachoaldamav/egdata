import { httpClient } from '@/lib/http-client';
import {
  dehydrate,
  HydrationBoundary,
  useQueries,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/tables/assets/table';
import { columns } from '@/components/tables/assets/columns';
import type { SingleOffer } from '@/types/single-offer';
import type { Asset } from '@/types/asset';
import { SandboxHeader } from '@/components/app/sandbox-header';
import type { SingleSandbox } from '@/types/single-sandbox';
import { getQueryClient } from '@/lib/client';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { generateSandboxMeta } from '@/lib/generate-sandbox-meta';

export const Route = createFileRoute('/sandboxes/$id/assets')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <SandboxAssetsPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context, params }) => {
    const { id } = params;
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['sandbox', 'assets', { id }],
      queryFn: () => httpClient.get<Asset[]>(`/sandboxes/${id}/assets`),
    });

    return {
      id,
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
            title: 'Sandbox not found',
            description: 'Sandbox not found',
          },
        ],
      };
    }

    const { id } = params;

    const sandbox = getFetchedQuery<SingleSandbox>(
      queryClient,
      ctx.loaderData?.dehydratedState,
      ['sandbox', { id }],
    );
    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      ctx.loaderData?.dehydratedState,
      ['sandbox', 'base-game', { id }],
    );

    if (!sandbox)
      return {
        meta: [
          {
            title: 'Sandbox not found',
            description: 'Sandbox not found',
          },
        ],
      };

    return {
      meta: generateSandboxMeta(sandbox, offer, 'Assets'),
    };
  },
});

function SandboxAssetsPage() {
  const { id } = Route.useParams();
  const [assetsQuery, baseGameQuery, sandboxQuery] = useQueries({
    queries: [
      {
        queryKey: ['sandbox', 'assets', { id }],
        queryFn: () => httpClient.get<Asset[]>(`/sandboxes/${id}/assets`),
      },
      {
        queryKey: ['sandbox', 'base-game', { id }],
        queryFn: () =>
          httpClient.get<SingleOffer>(`/sandboxes/${id}/base-game`),
        retry: false,
      },
      {
        queryKey: ['sandbox', { id }],
        queryFn: () => httpClient.get<SingleSandbox>(`/sandboxes/${id}`),
      },
    ],
  });

  const { data: assets } = assetsQuery;
  const { data: baseGame } = baseGameQuery;
  const { data: sandbox } = sandboxQuery;

  if (!assets) {
    return null;
  }

  return (
    <main className="flex flex-col items-start justify-start h-full gap-4 px-4 w-full">
      <SandboxHeader
        title={
          baseGame?.title ?? sandbox?.displayName ?? (sandbox?.name as string)
        }
        section="assets"
        id={id}
        sandbox={id}
      />
      <DataTable columns={columns} data={assets} />
    </main>
  );
}
