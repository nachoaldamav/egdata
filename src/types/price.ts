export interface Price {
  country: string;
  region: string;
  namespace: string;
  offerId: string;
  price: SinglePrice;
  appliedRules: AppliedRule[];
  updatedAt: string;
}

export interface SinglePrice {
  currencyCode: string;
  discount: number;
  discountPrice: number;
  originalPrice: number;
  basePayoutCurrencyCode: string;
  basePayoutPrice: number;
  payoutCurrencyExchangeRate: number;
}

export interface AppliedRule {
  id: string;
  name: string;
  namespace: string;
  promotionStatus: string;
  startDate: string;
  endDate: string;
  saleType: string;
  regionIds: string[];
  discountSetting: DiscountSetting;
  promotionSetting: PromotionSetting;
}

export interface DiscountSetting {
  discountType: string;
  discountValue: number | null;
  discountPercentage: number;
}

export interface PromotionSetting {
  promotionType: string;
  discountOffers: DiscountOffer[];
}

export interface DiscountOffer {
  offerId: string;
}
