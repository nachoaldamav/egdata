type EGSImageTypes =
  | 'OfferImageTall'
  | 'OfferImageWide'
  | 'Thumbnail'
  | 'Screenshot'
  | 'DieselStoreFrontWide'
  | 'featuredMedia'
  | 'DieselStoreFrontTall'
  | 'DieselGameBox'
  | 'DieselGameBoxWide'
  | 'DieselGameBoxTall'
  | 'TakeoverLogo'
  | 'TakeoverLogoSmall'
  | 'TakeoverTall'
  | 'TakeoverWide'
  | 'GalleryImage'
  | 'VaultClosed'
  | 'Sale'
  | 'ComingSoon'
  | 'Featured'
  | 'ESRB'
  | 'OgImage'
  | 'ProductLogo'
  | 'CodeRedemption_340x440'
  | 'heroCarouselVideo'
  | 'image name';

type KeyImages = {
  type: string;
  url: string;
  md5: string;
};

export const getImage = (keyImages: KeyImages[], types: EGSImageTypes[]) => {
  return (
    keyImages.find((image) => types.includes(image.type as EGSImageTypes)) ||
    keyImages[0]
  );
};
