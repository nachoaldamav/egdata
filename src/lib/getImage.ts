type KeyImages = {
  type: string;
  url: string;
  md5: string;
};

export const getImage = (keyImages: KeyImages[], types: string[]) => {
  return keyImages.find((image) => types.includes(image.type)) ?? keyImages[0];
};
