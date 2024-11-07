import buildImageUrl from '@/lib/build-image-url';
import { getImage } from '@/lib/get-image';
import { httpClient } from '@/lib/http-client';
import { cn } from '@/lib/utils';
import type { SingleOffer } from '@/types/single-offer';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/sales/')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <SalesPageIndex />
      </HydrationBoundary>
    );
  },

  loader: async ({ context }) => {
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['active-sales'],
      queryFn: () =>
        httpClient.get<
          {
            id: string;
            name: string;
            offers: SingleOffer[];
          }[]
        >('/active-sales'),
    });

    return {
      dehydratedState: dehydrate(queryClient),
    };
  },
});

function SalesPageIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ['active-sales'],
    queryFn: () =>
      httpClient.get<
        {
          id: string;
          name: string;
          offers: SingleOffer[];
        }[]
      >('/active-sales'),
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!data) {
    return <p>No data</p>;
  }

  return (
    <div>
      <h1>Active Sales</h1>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data?.map((sale) => <SaleCard key={sale.id} sale={sale} />)}
      </section>
    </div>
  );
}

function SaleCard({
  sale,
}: {
  sale: {
    id: string;
    name: string;
    offers: SingleOffer[];
  };
}) {
  return (
    <Link
      to={`/sales/${sale.id}`}
      className="genre-card relative w-72 h-[300px] mx-auto text-white overflow-hidden rounded-lg shadow-lg m-4 bg-gray-900/40 hover:bg-gray-900/60 transition group"
    >
      <div className="title absolute bottom-2 w-full text-center font-light text-xl z-10">
        {sale.name}
      </div>
      <span className="absolute top-0 left-0 w-full h-full backdrop-blur-[1px] bg-black/10 z-[5] group-hover:opacity-0 transition duration-300 ease-in-out" />
      {sale.offers.map((offer, index) => (
        <img
          key={offer.id}
          src={buildImageUrl(
            getImage(offer.keyImages, [
              'DieselGameBoxTall',
              'DieselStoreFrontTall',
              'OfferImageTall',
            ])?.url ?? '/placeholder.webp',
            300,
            'medium'
          )}
          alt={offer.title}
          className={cn(
            'absolute w-40 h-56 object-cover rounded shadow-2xl antialiased',
            index === 1 &&
              'left-2 z-0 opacity-35 backdrop-filter backdrop-blur-lg top-4',
            index === 0 &&
              'left-1/2 transform -translate-x-1/2 z-[9] w-44 h-60 top-2 group-hover:scale-[1.03] transition duration-200 ease-in-out',
            index === 2 &&
              'right-2 z-0 opacity-35 backdrop-filter backdrop-blur-lg top-4'
          )}
        />
      ))}
    </Link>
  );
}