import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';

export const getLastModified = async (country: string) => {
  return client
    .get<{ elements: SingleOffer[] }>('/offers?limit=25', {
      params: {
        country,
      },
    })
    .then((res) => res.data.elements);
};
