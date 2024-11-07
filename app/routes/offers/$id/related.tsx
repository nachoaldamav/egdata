import { OfferCard } from '@/components/app/offer-card';
import { Separator } from '@/components/ui/separator';
import { useCountry } from '@/hooks/use-country';
import { getQueryClient } from '@/lib/client';
import { generateOfferMeta } from '@/lib/generate-offer-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { httpClient } from '@/lib/http-client';
import { offersDictionary } from '@/lib/offers-dictionary';
import type { SingleOffer } from '@/types/single-offer';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/offers/$id/related')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <RelatedOffersPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ params, context }) => {
    const { queryClient, country } = context;
    const { id } = params;

    await queryClient.prefetchQuery({
      queryKey: ['related-offers', { id, country }],
      queryFn: () =>
        httpClient.get<SingleOffer[]>(`/offers/${id}/related`, {
          params: {
            country,
          },
        }),
    });

    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      dehydrate(queryClient),
      ['offer', { id: params.id }]
    );

    return {
      id,
      dehydratedState: dehydrate(queryClient),
      offer,
      country,
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

    return generateOfferMeta(offer, 'Related');
  },
});

function RelatedOffersPage() {
  const { id } = Route.useLoaderData();
  const { country } = useCountry();
  const {
    data: offers,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['related-offers', { id, country }],
    queryFn: () =>
      httpClient.get<SingleOffer[]>(`/offers/${id}/related`, {
        params: {
          country,
        },
      }),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return (
      <section id="offer-related-offers" className="w-full h-full">
        <h2 className="text-2xl font-bold">Related Offers</h2>
        <div>Something went wrong</div>
      </section>
    );
  }

  const offersGroupedByOfferType = offers?.reduce<
    Record<string, SingleOffer[]>
  >((acc, offer) => {
    if (!acc[offer.offerType]) {
      acc[offer.offerType] = [];
    }
    acc[offer.offerType].push(offer);
    return acc;
  }, {});

  if (!offersGroupedByOfferType) {
    return null;
  }

  const offerTypeOrder = ['BASE_GAME', 'DLC', 'EDITION', 'ADD_ON', 'OTHERS'];

  return (
    <section
      id="offer-related-offers"
      className="w-full h-full flex flex-col gap-4"
    >
      <h2 className="text-2xl font-bold">Related Offers</h2>
      <div className="flex flex-col gap-4">
        {Object.entries(offersGroupedByOfferType)
          .sort(([aType], [bType]) => {
            const aIndex = offerTypeOrder.indexOf(aType);
            const bIndex = offerTypeOrder.indexOf(bType);

            return (
              (aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex) -
              (bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex)
            );
          })
          .map(([offerType, offers]) => (
            <div key={offerType} className="flex flex-col gap-4">
              <h3 className="text-xl font-semibold inline-flex items-center gap-2">
                {offersDictionary[offerType] ?? offerType}{' '}
                <span className="text-xs text-gray-400">({offers.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {offers?.map((offer) => (
                  <div key={offer.id} className="basis-1/1 lg:basis-1/4">
                    <OfferCard offer={offer} size="md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
      <Separator orientation="horizontal" className="my-4" />
    </section>
  );
}
