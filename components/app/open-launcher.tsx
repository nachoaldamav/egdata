import { useEffect, useState } from 'react';
import { httpClient } from '@/lib/http-client';
import { Button } from '../ui/button';
import { EpicGamesIcon } from '../icons/epic';
import { buildGameLauncherURI } from '@/lib/build-game-launcher';
import { PlayIcon } from 'lucide-react';

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
    httpClient.get<Asset[]>(`/offers/${id}/assets`).then((response) => {
      setAssets(response);
    });
  }, [id]);

  if (!assets) return null;

  const asset = assets.find((asset) => asset.platform === getPlaform());

  if (!asset) return null;

  return (
    <Button
      variant="outline"
      className="text-white bg-[#1d77a1] hover:bg-[#20688a] transition-all duration-300 ease-in-out"
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
        <PlayIcon className="h-6 w-6" fill="white" />
        <span className="font-semibold">Play</span>
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
