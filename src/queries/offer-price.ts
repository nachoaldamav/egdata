import { client } from '~/lib/client';

export interface Metadata {
  id: string;
  country: string;
  region: string;
}

export interface TotalPaymentPrice {
  paymentCurrencyAmount: number;
  paymentCurrencyCode: string;
  paymentCurrencyExchangeRate: number;
  paymentCurrencySymbol: string;
}

export interface TotalPrice {
  basePayoutCurrencyCode: string;
  basePayoutPrice: number;
  convenienceFee: number;
  currencyCode: string;
  discount: number;
  discountPrice: number;
  originalPrice: number;
  vat: number;
  voucherDiscount: number;
}

interface PriceHistory {
  [key: string]: {
    metadata: Metadata;
    _id: string;
    date: string;
    totalPaymentPrice: TotalPaymentPrice;
    totalPrice: TotalPrice;
    __v: number;
  }[];
}

export async function fetchOfferPrice({ id }: { id: string }) {
  return client.get<PriceHistory>(`/offers/${id}/price-history`).then((res) => res.data);
}
