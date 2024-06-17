export type ImageQuality = 'original' | 'low' | 'medium' | 'high';

export default (src: string, height: number, quality: ImageQuality = 'medium') =>
  `${src}?h=${height}&quality=${quality}&resize=1`;
