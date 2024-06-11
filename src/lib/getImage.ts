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

/**
 * Get the image from the keyImages array (the types are in order of preference)
 * @param keyImages - Array of keyImages
 * @param types - Array of types to search for
 */
export const getImage = (keyImages: KeyImages[], types: EGSImageTypes[]) => {
  for (const type of types) {
    const image = keyImages.find((image) => image.type === type);
    if (image) {
      return image;
    }
  }

  return keyImages[0];
};
