import { Link } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { Card, CardHeader, CardContent } from '~/components/ui/card';
import {
  Carousel,
  CarouselPrevious,
  CarouselContent,
  CarouselItem,
  CarouselNext,
} from '~/components/ui/carousel';
import { Skeleton } from '~/components/ui/skeleton';
import { Image } from '~/components/app/image';
import { useCountry } from '~/hooks/use-country';

export interface SingleOffer {
  id: string;
  namespace: string;
  title: string;
  seller: Seller;
  keyImages: KeyImage[];
  developerDisplayName: string;
  publisherDisplayName: string;
  price: Price | null;
}

export interface Seller {
  id: string;
  name: string;
}

export interface KeyImage {
  type: string;
  url: string;
  md5: string;
}

export interface Price {
  totalPrice: TotalPrice;
  totalPaymentPrice: TotalPaymentPrice;
  _id: string;
  offerId: string;
  currency: string;
  country: string;
  symbol: string;
  __v: number;
}

export interface TotalPrice {
  basePayoutCurrencyCode: string;
  basePayoutPrice: number;
  convenienceFee: number;
  currencyCode: string;
  discount: number;
  discountPrice: number;
  originalPrice: number;
  vat: number;
  voucherDiscount: number;
}

export interface TotalPaymentPrice {
  paymentCurrencyAmount: number;
  paymentCurrencyCode: string;
  paymentCurrencyExchangeRate: number;
  paymentCurrencySymbol: string;
}

export function SalesModule({
  eventId,
  event,
}: {
  eventId: string;
  event: string;
}) {
  const { country } = useCountry();
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<SingleOffer[]>([]);

  useEffect(() => {
    client
      .get<{ elements: SingleOffer[] }>(`/promotions/${eventId}?country=${country || 'US'}`)
      .then((res) => {
        console.log(`Promotion ${eventId} data`, res.data);
        setGames(res.data.elements);
        setLoading(false);
      });
  }, [eventId, country]);

  return (
    <section className="w-full h-full" id={`promotion-${eventId}`}>
      <Link
        className="text-xl font-bold text-left"
        to={`/promotions/${eventId}`}
        prefetch="viewport"
      >
        {event}
      </Link>
      <Carousel className="mt-2 h-full p-4">
        <CarouselPrevious />
        <CarouselContent>
          {loading &&
            games.length === 0 &&
            [...Array(25)].map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: This is a skeleton loader
              <CarouselItem key={index} className="basis-1/1 lg:basis-1/4">
                <Skeleton className="w-80 h-96" />
              </CarouselItem>
            ))}
          {games.map((game) => (
            <CarouselItem key={game.id} className="basis-1/1 lg:basis-1/4">
              <GameCard game={game} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNext />
      </Carousel>
    </section>
  );
}

function GameCard({ game }: { game: SingleOffer }) {
  const fmt = Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: game.price?.currency || 'USD',
  });

  return (
    <CarouselItem key={game.id} className="basis-1/1 lg:basis-1/4">
      <Link
        to={`/offers/${game.id}`}
        className="h-auto w-96 relative select-none"
        prefetch="viewport"
      >
        <Card className="w-72 lg:max-w-sm rounded-lg overflow-hidden shadow-lg">
          <Image
            src={getImage(game.keyImages, ['Thumbnail'])?.url}
            alt={game.title}
            width={400}
            height={500}
            className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300"
          />
          <CardContent className="p-4 flex-grow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold max-w-xs truncate">{game.title}</h3>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2 h-full">
              <span className="text-sm text-gray-600 dark:text-gray-400">{game.seller.name}</span>
              {game.price && (
                <div className="flex items-center gap-2">
                  {game.price.totalPrice.discount > 0 && (
                    <span className="text-gray-500 line-through dark:text-gray-400">
                      {fmt.format(game.price.totalPrice.originalPrice / 100)}
                    </span>
                  )}
                  <span className="text-primary font-semibold">
                    {fmt.format(game.price.totalPrice.discountPrice / 100)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </CarouselItem>
  );
}
