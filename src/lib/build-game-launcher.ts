/**
 * com.epicgames.launcher://apps/fn%3A4fe75bbc5a674f4f9b356b5c90567da5%3AFortnite?action=launch (escape "/" with %3A)
 * @param param0
 * @returns
 */
export function buildGameLauncherURI({
  namespace,
  asset,
}: {
  namespace: string;
  asset: {
    assetId: string;
    itemId: string;
  };
}): string {
  const uri = `com.epicgames.launcher://apps/${namespace}%3A${asset.itemId}%3A${asset.assetId}?action=launch`;
  return uri;
}
