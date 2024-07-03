import { client } from '~/lib/client';
import type { Price } from '~/types/price';

interface PriceHistory {
  [key: string]: Price[];
}

export async function fetchOfferPrice({ id }: { id: string }) {
  return client.get<PriceHistory>(`/offers/${id}/price-history`).then((res) => res.data);
}
