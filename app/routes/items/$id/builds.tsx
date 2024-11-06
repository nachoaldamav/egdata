import { columns } from '@/components/tables/builds/columns';
import { DataTable } from '@/components/tables/builds/table';
import { getQueryClient } from '@/lib/client';
import { generateItemMeta } from '@/lib/generate-item-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { httpClient } from '@/lib/http-client';
import type { Build } from '@/types/builds';
import type { SingleItem } from '@/types/single-item';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/items/$id/builds')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <ItemBuildsPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context, params }) => {
    const { id } = params;
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['item', 'builds', { id }],
      queryFn: () => httpClient.get<Build[]>(`/items/${id}/builds`),
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

    const item = getFetchedQuery<SingleItem>(queryClient, dehydratedState, [
      'item',
      { id },
    ]);

    if (!item) {
      return [
        {
          title: 'Item not found',
          description: 'Item not found',
        },
      ];
    }

    return generateItemMeta(item, 'Builds');
  },
});

function ItemBuildsPage() {
  const { id } = Route.useParams();
  const { data: builds } = useQuery({
    queryKey: ['item', 'builds', { id }],
    queryFn: () => httpClient.get<Build[]>(`/items/${id}/builds`),
  });

  if (!builds) {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-start h-full gap-4 w-full">
      <h2 className="text-xl font-bold">Builds</h2>
      <DataTable columns={columns} data={builds} />
    </div>
  );
}
