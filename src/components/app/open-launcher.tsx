import { useEffect, useState } from 'react';
import { client } from '~/lib/client';
import { Button } from '../ui/button';
import { EpicGamesIcon } from '../icons/epic';
import { buildGameLauncherURI } from '~/lib/build-game-launcher';

type Asset = {
  artifactId: string;
  downloadSizeBytes: number;
  installSizeBytes: number;
  itemId: string;
  namespace: string;
  platform: string;
};

export function OpenLauncher({ id }: { id: string }) {
  const [assets, setAssets] = useState<Asset[] | null>(null);

  useEffect(() => {
    client.get<Asset[]>(`/offers/${id}/assets`).then((response) => {
      setAssets(response.data);
    });
  }, [id]);

  if (!assets) return null;

  const asset = assets.find((asset) => asset.platform === getPlaform());

  if (!asset) return null;

  return (
    <Button
      variant="outline"
      className="bg-gray-900 text-white dark:hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
      onClick={() =>
        open(
          buildGameLauncherURI({
            namespace: asset.namespace,
            asset: {
              assetId: asset.artifactId,
              itemId: asset.itemId,
            },
          }),
        )
      }
    >
      <div className="flex items-center justify-center gap-2">
        <EpicGamesIcon className="h-6 w-6" />
        <span className="font-semibold">Launch</span>
      </div>
    </Button>
  );
}

/**
 * Get the platform based on the current user agent
 */
const getPlaform = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'Mac';
  return 'unknown';
};
