import { type FC, type ImgHTMLAttributes, useMemo } from 'react';
import buildImageUrl from '~/lib/build-image-url';
import type { ImageQuality } from '~/lib/build-image-url';
import { Image as BaseImage } from '@adobe/react-spectrum';
import { cn } from '~/lib/utils';

export type ImageProps = {
  quality?: ImageQuality;
  unoptimized?: boolean;
  width?: number;
  height?: number;
  alt?: string;
  eager?: boolean;
} & ImgHTMLAttributes<HTMLImageElement>;

export const Image: FC<ImageProps> = ({
  src,
  width = 400,
  height = 500,
  quality = 'medium',
  unoptimized = false,
  alt = '',
  eager = false,
  className,
  ...props
}) => {
  const imageSrc = src || `https://via.placeholder.com/${width}x${height}`;
  const url = useMemo(() => buildImageUrl(imageSrc, width, quality), [imageSrc, width, quality]);

  return (
    <div className={cn(className, 'w-fit h-fit')}>
      <BaseImage
        src={unoptimized ? imageSrc : url}
        loading={eager ? 'eager' : 'lazy'}
        alt={alt}
        {...props}
      />
    </div>
  );
};
