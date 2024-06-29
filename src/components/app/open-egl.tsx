import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import type { OfferMapping } from '~/types/mapping';
import type { SingleOffer } from '~/types/single-offer';
import { Button } from '../ui/button';
import { EpicGamesIcon } from '../icons/epic';

export function OpenEgl({
  offer,
}: {
  offer: SingleOffer;
}) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['open-egs', offer.id],
    queryFn: () => client.get<OfferMapping>(`offers/${offer.id}/mappings`).then((res) => res.data),
  });

  if ((isLoading || error) && !offer.productSlug) {
    return null;
  }

  return (
    <Button
      variant="outline"
      className="bg-gray-900 text-white dark:hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
      onClick={() =>
        open(
          `com.epicgames.launcher://store/product/${offer.productSlug ?? data?.mappings.find((m) => m.pageType === 'productHome')?.pageSlug ?? data?.mappings[0].pageSlug}`,
        )
      }
    >
      <div className="flex items-center justify-center gap-2">
        <EpicGamesIcon className="h-6 w-6" />
        <span className="font-semibold">Open</span>
      </div>
    </Button>
  );
}
