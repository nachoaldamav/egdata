export interface SingleOfferWithPrice {
  _id: string;
  id: string;
  namespace: string;
  title: string;
  description: string;
  offerType: string;
  effectiveDate: string;
  creationDate: string;
  lastModifiedDate: string;
  isCodeRedemptionOnly: boolean;
  keyImages: KeyImage[];
  seller: Seller;
  productSlug: string | null;
  urlSlug: string | null;
  url: string | null;
  tags: Tag[];
  items: Item[];
  customAttributes: CustomAttribute[];
  categories: string[];
  developerDisplayName: string | null;
  publisherDisplayName: string | null;
  prePurchase: boolean | null;
  releaseDate: string;
  pcReleaseDate: string | null;
  viewableDate: string | null;
  countriesBlacklist: string[] | null;
  countriesWhitelist: string[] | null;
  refundType: string;
  price: Price;
}

export interface KeyImage {
  type: string;
  url: string;
  md5: string;
}

export interface Seller {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  namespace: string;
  _id: string;
}

export interface CustomAttribute {
  key: string;
  value: string;
  _id: string;
}

export interface Price {
  _id: string;
  totalPrice: LastPrice;
  totalPaymentPrice: LastPaymentPrice;
  metadata: {
    id: string;
    country: string;
    region: string;
  };
}

export interface LastPrice {
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

export interface LastPaymentPrice {
  paymentCurrencyAmount: number;
  paymentCurrencyCode: string;
  paymentCurrencyExchangeRate: number;
  paymentCurrencySymbol: string;
}
