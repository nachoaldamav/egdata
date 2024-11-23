import { RegionalPricing } from '@/components/app/regional-pricing';
import { getQueryClient } from '@/lib/client';
import { generateOfferMeta } from '@/lib/generate-offer-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import type { SingleOffer } from '@/types/single-offer';
import { dehydrate } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/offers/$id/price')({
  component: () => {
    const { id } = Route.useParams();

    return (
      <section id="offer-information" className="w-full h-full">
        <h2 className="text-2xl font-bold">Price</h2>
        <RegionalPricing id={id} />
      </section>
    );
  },

  loader: async ({ params, context }) => {
    const { id } = params;
    const { queryClient } = context;

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
            title: 'Offer not found',
            description: 'Offer not found',
          },
        ],
      };
    }

    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      ctx.loaderData?.dehydratedState,
      ['offer', { id: params.id }],
    );

    if (!offer) {
      return {
        meta: [
          {
            title: 'Offer not found',
            description: 'Offer not found',
          },
        ],
      };
    }

    return {
      meta: generateOfferMeta(offer, 'Price'),
    };
  },
});
