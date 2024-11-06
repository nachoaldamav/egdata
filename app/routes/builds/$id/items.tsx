import { columns } from '@/components/tables/items/columns';
import { DataTable } from '@/components/tables/items/table';
import { Separator } from '@/components/ui/separator';
import { httpClient } from '@/lib/http-client';
import type { SingleItem } from '@/types/single-item';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/builds/$id/items')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <ItemsPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ params, context }) => {
    const { id } = params;
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['build-items', { id }],
      queryFn: () => httpClient.get<SingleItem[]>(`/builds/${id}/items`),
    });

    return {
      id,
      dehydratedState: dehydrate(queryClient),
    };
  },
});

function ItemsPage() {
  const { id } = Route.useLoaderData();
  const { data: items } = useQuery({
    queryKey: ['build-items', { id }],
    queryFn: () => httpClient.get<SingleItem[]>(`/builds/${id}/items`),
  });

  return (
    <main className="flex flex-col items-start justify-start h-full gap-1 px-4 w-full">
      <p className="text-lg font-semibold">Items</p>
      <DataTable columns={columns} data={items ?? []} />
    </main>
  );
}
