import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import { OfferCard } from '~/components/app/offer-card';
import type { SingleOffer } from '~/types/single-offer';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import { shuffle } from '~/lib/shuffle';
import { useCountry } from '~/hooks/use-country';

export function SellerOffers({
  id,
  name,
  currentOffer,
}: { id: string; name: string; currentOffer: string }) {
  const { country } = useCountry();
  const { data } = useQuery({
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
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return (
    <section className="w-full h-full" id={`seller-offers-${id}`}>
      <h2 className="text-xl font-bold text-left inline-flex group items-center gap-2">
        More from {name}
      </h2>
      <Carousel className="mt-2 h-full p-4">
        <CarouselPrevious />
        <CarouselContent>
          {data
            ?.filter((offer) => offer.id !== currentOffer)
            .map((game) => (
              <CarouselItem key={game.id} className="basis-1/1 lg:basis-1/5">
                <OfferCard offer={game} size="md" />
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselNext />
      </Carousel>
    </section>
  );
}
