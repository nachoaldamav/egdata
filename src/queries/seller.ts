import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';

export const getSeller = async (id: string, country: string) => {
  const response = await client.get(`/sellers/${id}`, {
    params: {
      country,
    },
  });

  return response.data as SingleOffer[];
};
