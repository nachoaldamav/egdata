import { useState, useEffect } from 'react';
import { Skeleton } from '~/components/ui/skeleton';

export type ImageProps = {
  quality?: number;
  unoptimized?: boolean;
  width: number;
  height: number;
  alt?: string;
} & React.ImgHTMLAttributes<HTMLImageElement>;

const generateUrl = (
  src: string,
  width: number,
  quality: number,
  format?: string
) =>
  `https://cdn.egdata.app/cdn-cgi/image/width=${width},quality=${quality}${
    format ? `,format=${format}` : ''
  }/${src}`;

export const Image: React.FC<ImageProps> = ({
  src,
  width,
  height,
  quality = 75,
  unoptimized = false,
  alt,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const aspectRatio = (height / width) * 100;

  const generateSrcSet = (src: string, quality: number, format?: string) => {
    const widths = [320, 480, 800, 1200];
    return widths
      .map((w) => `${generateUrl(src, w, quality, format)} ${w}w`)
      .join(', ');
  };

  const sizes =
    '(max-width: 320px) 280px, (max-width: 480px) 440px, (max-width: 800px) 800px, 100vw';

  const url = generateUrl(src as string, width, quality);
  const srcSet = generateSrcSet(src as string, quality);
  const webpSrcSet =
    quality === 100 ? generateSrcSet(src as string, quality, 'webp') : '';

  useEffect(() => {
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
        {quality === 100 && (
          <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
        )}
        <source srcSet={srcSet} sizes={sizes} />
        {/* biome-ignore lint/a11y/useAltText: <explanation> */}
        <img
          src={url}
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
          onLoad={() => setLoading(false)}
          {...props}
        />
      </picture>
    </div>
  );
};
