import { Link } from '@remix-run/react';
import { Image } from './image';
import { Card, CardContent, CardHeader } from '../ui/card';
import { getImage } from '~/lib/getImage';
import { Skeleton } from '../ui/skeleton';
import type { SingleOffer } from '~/types/single-offer';
import { offersDictionary } from '~/lib/offers-dictionary';

export function GameCard({ offer }: { offer: SingleOffer }) {
  const fmt = Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: offer.price?.price.currencyCode || 'USD',
  });

  const isReleased = offer.releaseDate ? new Date(offer.releaseDate) < new Date() : false;
  const isPreOrder = offer.prePurchase;
  const isFree = offer.price?.price.discountPrice === 0;

  return (
    <Link to={`/offers/${offer.id}`} prefetch="viewport">
      <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg relative">
        <CardHeader className="p-0 rounded-t-xl relative">
          <Image
            src={
              getImage(offer.keyImages, [
                'OfferImageTall',
                'Thumbnail',
                'DieselGameBoxTall',
                'DieselStoreFrontTall',
              ])?.url
            }
            alt={offer.title}
            width={400}
            height={500}
            className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300 relative"
            loading="lazy"
          />
          {offer.offerType && (
            <span className="absolute -top-1.5 right-0 bg-gray-500/40 py-2 px-3 justify-center items-center text-white backdrop-blur-sm text-xs font-bold rounded-bl-xl z-10 bg-opacity-40">
              {offersDictionary[offer.offerType]}
            </span>
          )}
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col gap-1 justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold max-w-xs truncate">{offer.title}</h3>
          </div>
          <div className="flex flex-row justify-between items-end gap-1 h-full">
            <span className="text-sm text-gray-600 dark:text-gray-400 text-left truncate items-end flex-1">
              {offer.seller.name}
            </span>
            <div className="inline-flex justify-end items-center flex-0">
              {isReleased && offer.price && (
                <div className="flex items-center gap-2 text-right w-full justify-end">
                  {offer.price.price.discount > 0 && (
                    <span className="text-gray-500 line-through dark:text-gray-400">
                      {fmt.format(offer.price.price.originalPrice / 100)}
                    </span>
                  )}
                  <span className="text-primary font-semibold">
                    {isFree ? 'Free' : fmt.format(offer.price.price.discountPrice / 100)}
                  </span>
                </div>
              )}
              {!isReleased && isPreOrder && (
                <div className="flex items-center gap-2 text-right w-full justify-end">
                  <span className="text-primary font-semibold">
                    {fmt.format(offer.price.price.discountPrice / 100)}
                  </span>
                </div>
              )}
              {!isReleased && !isPreOrder && !offer.price && (
                <span className="text-primary font-semibold text-right">Coming Soon</span>
              )}
              {!isReleased &&
                !isPreOrder &&
                offer.price &&
                offer.price.price.discountPrice !== 0 && (
                  <div className="flex items-center gap-2 text-right w-full justify-end">
                    <span className="text-primary font-semibold">
                      {fmt.format(offer.price.price.discountPrice / 100)}
                    </span>
                  </div>
                )}
              {!isReleased &&
                !isPreOrder &&
                offer.price &&
                offer.price.price.discountPrice === 0 && (
                  <span className="text-primary font-semibold text-xs text-right">Coming Soon</span>
                )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function GameCardSkeleton() {
  return (
    <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg">
      <CardHeader className="p-0 rounded-t-xl">
        <Skeleton className="w-full h-72" />
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Skeleton className="w-3/4 h-6" />
        </div>
        <div className="mt-2 flex items-end justify-between gap-2 h-full">
          <Skeleton className="w-1/2 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>
      </CardContent>
    </Card>
  );
}
