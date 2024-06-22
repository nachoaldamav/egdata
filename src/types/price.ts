export interface Price {
  metadata: Metadata;
  _id: string;
  date: string;
  totalPaymentPrice: TotalPaymentPrice;
  totalPrice: TotalPrice;
}

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
