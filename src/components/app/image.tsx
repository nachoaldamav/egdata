export type ImageProps = {
  quality?: number;
  unoptimized?: boolean;
  width: number;
  height: number;
  alt?: string;
} & React.ImgHTMLAttributes<HTMLImageElement>;

export const Image: React.FC<ImageProps> = ({
  src,
  width,
  height,
  quality = 75,
  unoptimized = false,
  alt,
  ...props
}) => {
  const aspectRatio = (height / width) * 100;

  const generateSrcSet = (src: string, quality: number) => {
    const widths = [320, 480, 800, 1200];
    return widths
      .map((w) => `${src}?width=${w}&quality=${quality} ${w}w`)
      .join(', ');
  };

  const sizes =
    '(max-width: 320px) 280px, (max-width: 480px) 440px, (max-width: 800px) 800px, 100vw';

  const url = `https://cdn.egdata.app/cdn-cgi/image/width=${width},quality=${quality}/${src}`;
  const srcSet = generateSrcSet(url, quality);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: `${aspectRatio}%`,
        overflow: 'hidden',
      }}
    >
      <picture>
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
          }}
          {...props}
        />
      </picture>
    </div>
  );
};
