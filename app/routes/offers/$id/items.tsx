import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getQueryClient } from '@/lib/client';
import { generateOfferMeta } from '@/lib/generate-offer-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { httpClient } from '@/lib/http-client';
import type { SingleItem } from '@/types/single-item';
import type { SingleOffer } from '@/types/single-offer';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/offers/$id/items')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <ItemsPage />
      </HydrationBoundary>
    );
  },
  loader: async ({ params, context }) => {
    const { queryClient } = context;

    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      dehydrate(queryClient),
      ['offer', { id: params.id }]
    );

    await queryClient.prefetchQuery({
      queryKey: ['offer-items', { id: params.id }],
      queryFn: () => httpClient.get<SingleItem[]>(`/offers/${params.id}/items`),
    });

    return {
      id: params.id,
      dehydratedState: dehydrate(queryClient),
      offer,
    };
  },

  meta(ctx) {
    const { params } = ctx;
    const queryClient = getQueryClient();

    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      ctx.loaderData.dehydratedState,
      ['offer', { id: params.id }]
    );

    if (!offer) {
      return [
        {
          title: 'Offer not found',
          description: 'Offer not found',
        },
      ];
    }

    return generateOfferMeta(offer, 'Items');
  },
});

function ItemsPage() {
  const { id } = Route.useLoaderData();
  const {
    data: items,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['offer-items', { id }],
    queryFn: () => httpClient.get<SingleItem[]>(`/offers/${id}/items`),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return (
      <section id="offer-items" className="w-full h-full">
        <h2 className="text-2xl font-bold">Items</h2>
        <div>Something went wrong</div>
      </section>
    );
  }

  return (
    <section id="offer-items" className="w-full h-full">
      <h2 className="text-2xl font-bold">Items</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Item ID</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Entitlement Type</TableHead>
            <TableHead>Entitlement Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items?.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono underline">
                <Link to={`/items/${item.id}`}>{item.id}</Link>
              </TableCell>
              <TableCell className="text-left">{item.title}</TableCell>
              <TableCell className="text-left">
                {item.entitlementType}
              </TableCell>
              <TableCell className="text-left">
                {item.entitlementName}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
