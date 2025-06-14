export interface OfferMapping {
  _id: string;
  namespace: string;
  displayName: string;
  mappings: Mapping[];
}

export interface Mapping {
  pageSlug: string;
  pageType: string;
  productId: string;
  sandboxId: string;
  updatedDate: string;
}
