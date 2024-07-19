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
import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons';
import type { Price } from '~/types/price';
import { GameCard, OfferCard } from '../app/offer-card';

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
        className="text-xl font-bold text-left inline-flex group items-center gap-2"
        to={`/promotions/${eventId}`}
        prefetch="viewport"
      >
        {event}{' '}
        <ArrowRightIcon className="w-6 h-6 inline-block group-hover:translate-x-1 transition-transform duration-300 ease-in-out" />
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
              <OfferCard offer={game} key={game.id} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNext />
      </Carousel>
    </section>
  );
}
