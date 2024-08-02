import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';

export const getSeller = async (id: string, country: string, limit?: number) => {
  const response = await client.get(`/sellers/${id}`, {
    params: {
      country,
      limit: limit || undefined,
    },
  });

  return response.data as SingleOffer[];
};
