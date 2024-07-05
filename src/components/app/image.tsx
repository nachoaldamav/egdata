import { useState, useEffect } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import buildImageUrl from '~/lib/build-image-url';
import type { ImageQuality } from '~/lib/build-image-url';

export type ImageProps = {
  quality?: ImageQuality;
  unoptimized?: boolean;
  width: number;
  height: number;
  alt?: string;
} & React.ImgHTMLAttributes<HTMLImageElement>;

export const Image: React.FC<ImageProps> = ({
  src,
  width,
  height,
  quality = 'medium',
  unoptimized = false,
  alt,
  ...props
}) => {
  if (!src && width && height) {
    src = `https://via.placeholder.com/${width}x${height}`;
  }

  const [loading, setLoading] = useState(true);
  const aspectRatio = (height / width) * 100;

  const generateSrcSet = (src: string, quality: ImageQuality, originalWidth: number) => {
    const widths = [320, 480, 800, originalWidth > 1200 ? originalWidth : 1200];

    // Ensure unique and sorted widths
    const uniqueWidths = Array.from(new Set(widths)).sort((a, b) => a - b);

    return uniqueWidths.map((w) => `${buildImageUrl(src, w, quality)} ${w}w`).join(', ');
  };

  const sizes = `(max-width: 320px) 280px, (max-width: 480px) 440px, (max-width: 800px) 800px, ${width}px`;

  const url = buildImageUrl(src as string, width, quality);
  const srcSet = generateSrcSet(src as string, quality, width);

  useEffect(() => {
    setLoading(true);
    const img = new globalThis.Image();
    img.src = url;
    img.onload = () => setLoading(false);
  }, [url]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: `${aspectRatio}%`,
        overflow: 'hidden',
      }}
    >
      {loading && (
        <Skeleton
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}
      <picture style={{ display: loading ? 'none' : 'block' }}>
        <source srcSet={srcSet} sizes={sizes} />
        {/* biome-ignore lint/a11y/useAltText: <explanation> */}
        <img
          src={buildImageUrl(src as string, width, quality)}
          alt={alt || url}
          width={width}
          height={height}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: loading ? 'none' : 'block',
          }}
          decoding="async"
          onLoad={() => setLoading(false)}
          {...props}
        />
      </picture>
    </div>
  );
};
