import { useState, useEffect, useRef, type FC, type ImgHTMLAttributes } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import buildImageUrl from '~/lib/build-image-url';
import type { ImageQuality } from '~/lib/build-image-url';

export type ImageProps = {
  quality?: ImageQuality;
  unoptimized?: boolean;
  width: number;
  height: number;
  alt?: string;
} & ImgHTMLAttributes<HTMLImageElement>;

export const Image: FC<ImageProps> = ({
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
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const aspectRatio = (height / width) * 100;

  const url = buildImageUrl(src as string, width, quality);

  useEffect(() => {
    if (inView) {
      setLoading(true);
      const img = new globalThis.Image();
      img.src = url;
      img.onload = () => setLoading(false);
    }
  }, [inView, url]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '0px',
        threshold: 0.1,
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={imgRef}
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: `${aspectRatio}%`,
        overflow: 'hidden',
      }}
    >
      <Skeleton
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transition: 'opacity 0.5s ease',
          opacity: loading ? 1 : 0,
          zIndex: loading ? 1 : -1,
        }}
      />
      {inView && (
        <picture style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.5s ease' }}>
          <img
            src={url}
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onLoad={() => setLoading(false)}
            {...props}
            alt={alt || url}
          />
        </picture>
      )}
    </div>
  );
};
