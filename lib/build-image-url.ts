export type ImageQuality = 'original' | 'low' | 'medium' | 'high';

const qualityMap: Record<ImageQuality, number> = {
  original: 100,
  high: 80,
  medium: 60,
  low: 40,
};

export default (
  src: string,
  height: number,
  quality: ImageQuality = 'medium',
) => {
  const hasExtension = src.includes('.');
  if (!hasExtension || src[0] === '/') {
    return src;
  }

  return `https://cdn.egdata.app/cdn-cgi/image/height=${height},quality=${qualityMap[quality]}/${src}`;
};
