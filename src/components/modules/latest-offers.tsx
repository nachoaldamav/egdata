import { OfferCard } from '../app/offer-card';
import {
  Carousel,
  CarouselPrevious,
  CarouselContent,
  CarouselItem,
  CarouselNext,
} from '../ui/carousel';
import { useQuery } from '@tanstack/react-query';
import { useCountry } from '~/hooks/use-country';
import { getLatestOffers } from '~/queries/latest-offers';

export function LatestOffers() {
  const { country } = useCountry();
  const { data: offers, isLoading: loading } = useQuery({
    queryKey: ['latest-games'],
    queryFn: () => getLatestOffers(country),
  });

  if (loading || !offers) return null;

  return (
    <section className="w-full pt-4" id="latest-games">
      <h4 className="text-xl font-bold text-left">Latest Offers</h4>
      <Carousel className="mt-2 h-full p-4">
        <CarouselPrevious />
        <CarouselContent>
          {offers.map((game) => (
            <CarouselItem key={game.id} className="basis-1/1 lg:basis-1/5">
              <OfferCard offer={game} key={game.id} size="md" />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNext />
      </Carousel>
    </section>
  );
}
