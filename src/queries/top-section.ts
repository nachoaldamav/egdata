import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';

type TopSection = {
  elements: SingleOffer[];
  page: number;
  limit: number;
  total: number;
};

export const getTopSection = async (slug: string) => {
  return client.get<TopSection>(`/offers/${slug}`).then((res) => res.data);
};
