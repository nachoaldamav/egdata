import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import type { OfferMapping } from '~/types/mapping';
import type { SingleOffer } from '~/types/single-offer';
import { Button } from '../ui/button';
import { Link } from '@remix-run/react';
import { EGSIcon } from '../icons/egs';

export function OpenEgs({
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
      asChild
      className="bg-gray-900 text-white dark:hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
    >
      <Link
        to={`https://store.epicgames.com/p/${offer.productSlug ?? data?.mappings.find((m) => m.pageType === 'productHome')?.pageSlug ?? data?.mappings[0].pageSlug}?utm_source=egdata.app`}
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        target="_blank"
      >
        <div className="flex items-center justify-center gap-2">
          <EGSIcon className="h-6 w-6" />
          <span className="font-semibold">Store</span>
        </div>
      </Link>
    </Button>
  );
}
