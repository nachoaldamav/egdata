import { httpClient } from '@/lib/http-client';
import type { SingleOffer } from '@/types/single-offer';

export const getFeaturedDiscounts = async ({
  country,
}: {
  country: string;
}) => {
  return httpClient.get<SingleOffer[]>('/offers/featured-discounts', {
    params: { country },
  });
};
