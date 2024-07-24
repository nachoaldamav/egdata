export interface SingleSandbox {
  _id: string;
  namespaceType: string;
  accessType: string;
  defaultPublic: boolean;
  store: string;
  parent: string;
  name: string;
  merchantGroup: string;
  taxSkuId: string;
  eulaIds: unknown[];
  displayName: string;
  addVatToPrice: boolean;
  priceTierType: string;
  convenienceFee: boolean;
  status: string;
  ratingAgeGating: RatingAgeGating;
  ageGatings: AgeGatings;
  slug: string;
  created: string;
  updated: string;
  countriesBlacklist: unknown[];
  purposeTypes: unknown[];
}

export interface RatingAgeGating {
  ACB: number;
  CERO: number;
  PEGI: number;
  GRAC: number;
  ESRB: number;
}

export interface AgeGatings {
  ACB: Acb;
  CERO: Cero;
  PEGI: Pegi;
  GRAC: Grac;
  ESRB: Esrb;
}

export interface Acb {
  ratingSystem: string;
  ageControl: number;
  gameRating: string;
  ratingImage: string;
  title: string;
  descriptor: string;
  descriptorIds: unknown[];
  element: string;
  elementIds: unknown[];
  isTrad: boolean;
  isIARC: boolean;
}

export interface Cero {
  ratingSystem: string;
  ageControl: number;
  gameRating: string;
  ratingImage: string;
  title: string;
  descriptor: string;
  descriptorIds: unknown[];
  element: string;
  elementIds: unknown[];
  isTrad: boolean;
  isIARC: boolean;
}

export interface Pegi {
  ratingSystem: string;
  ageControl: number;
  gameRating: string;
  ratingImage: string;
  title: string;
  descriptor: string;
  descriptorIds: number[];
  element: string;
  elementIds: unknown[];
  isTrad: boolean;
  isIARC: boolean;
}

export interface Grac {
  ratingSystem: string;
  ageControl: number;
  gameRating: string;
  ratingImage: string;
  title: string;
  descriptor: string;
  descriptorIds: unknown[];
  element: string;
  elementIds: unknown[];
  isTrad: boolean;
  isIARC: boolean;
}

export interface Esrb {
  ratingSystem: string;
  ageControl: number;
  gameRating: string;
  ratingImage: string;
  title: string;
  descriptor: string;
  descriptorIds: number[];
  element: string;
  elementIds: number[];
  isTrad: boolean;
  isIARC: boolean;
}
