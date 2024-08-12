import { FaAndroid, FaApple, FaWindows } from 'react-icons/fa6';
import type { SingleItem } from '~/types/single-item';

export const platformIcons: Record<string, React.ReactNode> = {
  '9547': <FaWindows className="w-5 h-5 text-muted-foreground" />,
  '10719': <FaApple className="w-5 h-5 text-muted-foreground" />,
};

export const textPlatformIcons: Record<string, React.ReactNode> = {
  Windows: <FaWindows className="w-5 h-5 text-muted-foreground" />,
  Mac: <FaApple className="w-5 h-5 text-muted-foreground" />,
  Android: <FaAndroid className="w-5 h-5 text-muted-foreground" />,
};

export const getPlatformsArray = (releaseInfo: SingleItem['releaseInfo']): string[] => {
  const platforms = releaseInfo.flatMap((release) => release.platform);

  return Array.from(new Set(platforms));
};
