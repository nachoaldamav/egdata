import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import { OfferCard } from '~/components/app/offer-card';
import type { SingleOffer } from '~/types/single-offer';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '~/components/ui/carousel';
import { shuffle } from '~/lib/shuffle';
import { useCountry } from '~/hooks/use-country';
import { Skeleton } from '../ui/skeleton';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { Link } from '@remix-run/react';

export function SellerOffers({
  id,
  name,
  currentOffer,
}: { id: string; name: string; currentOffer: string }) {
  const [api, setApi] = useState<CarouselApi>();
  const { country } = useCountry();
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'seller-offers',
      {
        id,
        country,
      },
    ],
    queryFn: () =>
      client
        .get<SingleOffer[]>(`/sellers/${id}`, {
          params: {
            country,
            offerType: 'BASE_GAME',
            limit: 15,
          },
        })
        .then((res) => shuffle(res.data)),
  });

  if (isLoading) {
    return (
      <section className="w-full h-full">
        <h2 className="text-xl font-bold text-left inline-flex group items-center gap-2">
          More from {name}
        </h2>
        <Skeleton className="mt-2 h-[400px] p-4" />
      </section>
    );
  }

  if (isError) {
    return null;
  }

  if (!data?.length || data.filter((offer) => offer.id !== currentOffer).length === 0) {
    return null;
  }

  const handlePreviousSlide = () => {
    api?.scrollPrev();
  };

  const handleNextSlide = () => {
    api?.scrollNext();
  };

  return (
    <section className="w-full h-full" id={`seller-offers-${id}`}>
      <div className="flex justify-between items-center mb-4">
        <Link
          className="text-xl font-bold text-left inline-flex group items-center gap-2 group"
          to={`/sellers/${id}`}
        >
          More from {name}
          <ArrowUpIcon className="w-5 h-5 text-muted-foreground group-hover:text-gray-300 rotate-90 transform group-hover:translate-x-1 transition-transform duration-200 ease-in-out" />
        </Link>
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
      <Carousel className="mt-2 h-full p-4" setApi={setApi}>
        <CarouselContent>
          {data
            ?.filter((offer) => offer.id !== currentOffer)
            .map((game) => (
              <CarouselItem key={game.id} className="basis-1/1 lg:basis-1/5">
                <OfferCard offer={game} size="md" />
              </CarouselItem>
            ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
