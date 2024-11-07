import { columns } from '@/components/tables/assets/columns';
import { DataTable } from '@/components/tables/assets/table';
import { getQueryClient } from '@/lib/client';
import { generateItemMeta } from '@/lib/generate-item-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { httpClient } from '@/lib/http-client';
import type { Asset } from '@/types/asset';
import type { SingleItem } from '@/types/single-item';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/items/$id/assets')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <ItemAssetsPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context, params }) => {
    const { id } = params;
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['item', 'assets', { id }],
      queryFn: () => httpClient.get<Asset[]>(`/items/${id}/assets`),
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

    return generateItemMeta(item, 'Assets');
  },
});

function ItemAssetsPage() {
  const { id } = Route.useParams();
  const { data: assets } = useQuery({
    queryKey: ['item', 'assets', { id }],
    queryFn: () => httpClient.get<Asset[]>(`/items/${id}/assets`),
  });

  if (!assets) {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-start h-full gap-4 w-full">
      <h2 className="text-xl font-bold">Assets</h2>
      <DataTable columns={columns} data={assets} />
    </div>
  );
}