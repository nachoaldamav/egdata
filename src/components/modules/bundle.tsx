import { useQuery } from '@tanstack/react-query';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '../ui/carousel';
import { httpClient } from '~/lib/http-client';
import { Skeleton } from '../ui/skeleton';
import { OfferCard } from '../app/offer-card';
import type { SingleOffer } from '~/types/single-offer';
import { useCountry } from '~/hooks/use-country';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import type { Price } from '~/types/price';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { calculatePrice } from '~/lib/calculate-price';
import { cn } from '~/lib/utils';
import { EqualIcon } from 'lucide-react';
import { EGSIcon } from '../icons/egs';
import { Link } from '@remix-run/react';

const trackEvent = (offers: { id: string; namespace: string }[], type: 'bundle' | 'single') => {
  window.umami.track(`bundle-${type}`, {
    offers: offers.map((offer) => {
      return {
        id: offer.id,
        namespace: offer.namespace,
      };
    }),
  });
};

export function Bundle({ id, offer }: { id: string; offer: SingleOffer }) {
  const { country } = useCountry();
  const [api, setApi] = useState<CarouselApi>();
  const {
    data: collection,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['bundle-offers', { id, country }],
    queryFn: () =>
      httpClient.get<{
        offers: SingleOffer[];
        totalPrice: Price;
        bundlePrice: Price;
      }>(`/offers/${id}/bundle`, {
        params: { country },
      }),
  });

  const handlePreviousSlide = () => {
    api?.scrollPrev();
  };

  const handleNextSlide = () => {
    api?.scrollNext();
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <hr className="my-4" />
        <div className="flex justify-between items-center">
          <h4 className="text-xl font-bold text-left inline-flex group items-center gap-2">
            Collection Offers
          </h4>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousSlide}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground hover:bg-gray-900 focus:outline-none focus:ring focus:ring-gray-300/50 disabled:opacity-50"
              type="button"
            >
              <ArrowUpIcon className="w-5 h-5 transform -rotate-90" />
            </button>
            <button
              onClick={handleNextSlide}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground hover:bg-gray-900 focus:outline-none focus:ring focus:ring-gray-300/50 disabled:opacity-50"
              type="button"
            >
              <ArrowUpIcon className="w-5 h-5 transform rotate-90" />
            </button>
          </div>
        </div>
        <Carousel
          opts={{
            align: 'start',
          }}
          className="w-full"
        >
          <CarouselContent>
            {Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem
                key={`skeleton-collection-${id}-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: This is the loading skeleton
                  index
                }`}
                className="md:basis-1/2 lg:basis-1/4"
              >
                <div className="p-1">
                  <Skeleton className="h-[500px] w-[300px]" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  if (isError) return null;

  const priceFmtr = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: collection?.bundlePrice.price.currencyCode ?? 'USD',
  });

  const bundlePrice = calculatePrice(
    collection?.bundlePrice.price.discountPrice ?? 0,
    collection?.bundlePrice.price.currencyCode,
  );
  const totalPrice = calculatePrice(
    collection?.totalPrice.price.discountPrice ?? 0,
    collection?.totalPrice.price.currencyCode,
  );

  const bundleIsBetter = bundlePrice < totalPrice;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div className="w-full flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xl font-bold text-left inline-flex group items-center gap-2">
            Bundle Offers
            <span className="text-xs opacity-50">- {collection?.offers.length} Offers</span>
          </h4>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousSlide}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground hover:bg-gray-900 focus:outline-none focus:ring focus:ring-gray-300/50 disabled:opacity-50"
              type="button"
            >
              <ArrowUpIcon className="w-5 h-5 transform -rotate-90" />
            </button>
            <button
              onClick={handleNextSlide}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground hover:bg-gray-900 focus:outline-none focus:ring focus:ring-gray-300/50 disabled:opacity-50"
              type="button"
            >
              <ArrowUpIcon className="w-5 h-5 transform rotate-90" />
            </button>
          </div>
        </div>
        <Carousel
          opts={{
            align: 'start',
          }}
          className="w-full"
          setApi={setApi}
        >
          <CarouselContent>
            {collection?.offers.map((offer) => (
              <CarouselItem key={offer.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <OfferCard offer={offer} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      <div className="w-full flex flex-row gap-4 items-center justify-center">
        <EqualIcon className="size-10 inline-block" />
        <Card className="w-full min-w-[200px] max-w-[400px]">
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold mb-4">Bundle Price</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Value:</span>
                <span className="font-semibold">{priceFmtr.format(totalPrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Bundle Price:</span>
                <span className="font-semibold">{priceFmtr.format(bundlePrice)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>You {bundleIsBetter ? 'save' : 'pay more'}:</span>
                <Badge
                  className={cn(
                    'text-lg py-1 ease-in-out duration-300 transition-colors',
                    bundleIsBetter
                      ? 'bg-green-400 font-bold hover:bg-green-500'
                      : 'bg-red-400 font-bold hover:bg-red-500',
                  )}
                >
                  {priceFmtr.format(Math.abs(totalPrice - bundlePrice))}
                </Badge>
              </div>
              <div className="pt-4">
                <Button className="w-full bg-black text-white hover:bg-card border" asChild>
                  <Link
                    to={getBuyLink({
                      offers: bundleIsBetter ? [offer] : collection?.offers ?? [],
                    })}
                    className="inline-flex items-center gap-2 w-full"
                    target="_blank"
                    rel="noreferrer noopener"
                    prefetch="intent"
                    onClick={() => {
                      trackEvent(
                        bundleIsBetter ? [offer] : collection?.offers ?? [],
                        bundleIsBetter ? 'bundle' : 'single',
                      );
                    }}
                  >
                    <EGSIcon className="w-5 h-5" />
                    <span>{bundleIsBetter ? 'Buy Bundle' : 'Buy Items Individually'}</span>
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Bundle direct link
// https://store.epicgames.com/purchase?highlightColor=0078f2&offers=1-883178bfb8b94ce9b95e1e60bec225ed-48a399d8a7f6448daf7bdee752c8fb6d-&showNavigation=true

// Multioffer direct link
// https://store.epicgames.com/purchase?highlightColor=0078f2&offers=1-42c70202dc684966a827bfcb7b49ac5f-cd1610921c934f588d95b7d0d3750730-&offers=1-dbfff2d3f4dc446b8f4931ed8a353685-90d3d1bf246c4aeda03e36a167b463a2-&offers=1-e424e1d51e114ae8b6d685c943043cd7-f8b1645ba22a44439f3b68daec1ba1ee-&showNavigation=true

function getBuyLink({
  offers,
}: {
  offers: SingleOffer[];
}): string {
  const offerList: {
    offerId: string;
    namespace: string;
    quantity: number;
  }[] = offers.map((offer) => ({
    offerId: offer.id,
    namespace: offer.namespace,
    quantity: 1,
  }));

  const url = new URL('https://store.epicgames.com/purchase');
  url.searchParams.set('showNavigation', 'true');
  url.searchParams.set('highlightColor', '4ade80');

  for (const offer of offerList) {
    url.searchParams.append('offers', `${offer.quantity}-${offer.namespace}-${offer.offerId}-`);
  }

  return url.toString();
}
