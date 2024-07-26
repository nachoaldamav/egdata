import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';

export const getFeaturedDiscounts = async ({ country }: { country: string }) => {
  return client
    .get<SingleOffer[]>('/offers/featured-discounts', {
      params: { country },
    })
    .then((response) => response.data);
};
