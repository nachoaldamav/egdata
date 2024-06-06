export type ImageProps = {
  quality?: number;
  unoptimized?: boolean;
} & React.ImgHTMLAttributes<HTMLImageElement>;

export const Image: React.FC<ImageProps> = ({
  src,
  width,
  quality = 75,
  unoptimized = false,
  alt,
  ...props
}) => {
  const url = `https://egdata.app/cdn-cgi/image/width=${width},quality=${quality}/${src}`;

  return (
    // biome-ignore lint/a11y/useAltText: Alt is provided in the props
    <img src={url} alt={alt || url} {...props} />
  );
};
