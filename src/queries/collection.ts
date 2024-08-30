import { httpClient } from '~/lib/http-client';
import type { SingleOffer } from '~/types/single-offer';

export interface Collections {
  elements: (SingleOffer & {
    position: number;
  })[];
  title: string;
  start: number;
  page: number;
  total: number;
}

export const getCollection = async ({
  slug,
  limit,
  page,
  country,
}: { slug: string; limit: number; page: number; country: string }) => {
  const data = await httpClient.get<Collections>(`/collections/${slug}`, {
    params: {
      country,
      page,
      limit,
    },
  });
  return data;
};
