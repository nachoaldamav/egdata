import { httpClient } from '@/lib/http-client';
import type { SingleBuild } from '@/types/builds';
import {
  dehydrate,
  HydrationBoundary,
  useQueries,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { DataTable } from '@/components/tables/builds/table';
import { columns } from '@/components/tables/builds/columns';
import type { SingleOffer } from '@/types/single-offer';
import { SandboxHeader } from '@/components/app/sandbox-header';
import type { SingleSandbox } from '@/types/single-sandbox';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { getQueryClient } from '@/lib/client';
import { generateSandboxMeta } from '@/lib/generate-sandbox-meta';

export const Route = createFileRoute('/sandboxes/$id/builds')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <SandboxBuildsPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context, params }) => {
    const { id } = params;
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['sandbox', 'builds', { id }],
      queryFn: () => httpClient.get<SingleBuild[]>(`/sandboxes/${id}/builds`),
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
      meta: generateSandboxMeta(sandbox, offer, 'Builds'),
    };
  },
});

function SandboxBuildsPage() {
  const { id } = Route.useParams();
  const [buildsQuery, baseGameQuery, sandboxQuery] = useQueries({
    queries: [
      {
        queryKey: ['sandbox', 'builds', { id }],
        queryFn: () => httpClient.get<SingleBuild[]>(`/sandboxes/${id}/builds`),
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

  const { data: builds } = buildsQuery;
  const { data: baseGame } = baseGameQuery;
  const { data: sandbox } = sandboxQuery;

  if (!builds) {
    return null;
  }

  return (
    <main className="flex flex-col builds-start justify-start h-full gap-4 px-4 w-full">
      <SandboxHeader
        title={
          baseGame?.title ?? sandbox?.displayName ?? (sandbox?.name as string)
        }
        section="builds"
        id={id}
        sandbox={id}
      />
      <DataTable columns={columns} data={builds} />
    </main>
  );
}
