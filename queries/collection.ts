import { httpClient } from '@/lib/http-client';
import type { SingleOffer } from '@/types/single-offer';

export interface OfferWithTops extends SingleOffer {
  position: number;
  previousPosition: number;
  metadata: {
    _id: string;
    position: number;
    timesInTop1: number;
    timesInTop5: number;
    timesInTop10: number;
    timesInTop20: number;
    timesInTop50: number;
    timesInTop100: number;
    previous: number;
  };
}

export interface Collections {
  elements: OfferWithTops[];
  limit: number;
  page: number;
  total: number;
  title: string;
}

export const getCollection = async ({
  slug,
  limit,
  page,
  country,
}: {
  slug: string;
  limit: number;
  page: number;
  country: string;
}) => {
  const data = await httpClient.get<Collections>(`/collections/${slug}`, {
    params: {
      country,
      page,
      limit,
    },
  });
  return data;
};
