import { useEffect, useState } from 'react';
import type { SingleOffer } from '~/types/single-offer';
import type { Price } from '~/types/price';
import type { Media } from '~/types/media';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { Image } from '../app/image';
import { getImage } from '~/lib/getImage';
import { Link } from '@remix-run/react';
import { cn } from '~/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import { useCountry } from '~/hooks/use-country';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import Autoplay from 'embla-carousel-autoplay';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

const SLIDE_DELAY = 5000; // 5 seconds

export function FeaturedModule({
  offers,
}: {
  offers: SingleOffer[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [progress, setProgress] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    setProgress(Array.from({ length: offers.length }, () => 0));

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
      setProgress(Array.from({ length: offers.length }, () => 0));
    });

    const handleInteraction = () => {
      setIsPaused(true);
    };

    const handleMouseEnter = () => {
      setIsPaused(true);
    };

    const handleMouseLeave = () => {
      setIsPaused(false);
    };

    api.on('pointerDown', handleInteraction);
    api.containerNode().addEventListener('mouseenter', handleMouseEnter);
    api.containerNode().addEventListener('mouseleave', handleMouseLeave);

    const interval = setInterval(() => {
      if (!isPaused) {
        setProgress((prevProgress) => {
          const newProgress = [...prevProgress];
          newProgress[current - 1] += 100 / (SLIDE_DELAY / 100);
          if (newProgress[current - 1] >= 100) {
            api.scrollNext();
            newProgress[current - 1] = 0;
          }
          return newProgress;
        });
      }
    }, 100);

    return () => {
      clearInterval(interval);
      api.off('pointerDown', handleInteraction);
      api.containerNode().removeEventListener('mouseenter', handleMouseEnter);
      api.containerNode().removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [api, current, isPaused, offers]);

  return (
    <Carousel
      className="text-white p-4 w-full"
      setApi={setApi}
      plugins={[Autoplay({ delay: SLIDE_DELAY, stopOnMouseEnter: true, stopOnInteraction: false })]}
    >
      <h2 className="text-xl font-bold mb-4">Featured</h2>
      <CarouselContent className="h-auto">
        {offers.map((offer) => (
          <CarouselItem
            key={offer.id}
            className="flex flex-col items-center w-full max-w-[100vw] select-none"
          >
            <div className="hidden md:flex flex-col md:flex-row bg-[#12141f] rounded-lg overflow-hidden w-full h-full">
              <div className="w-full md:w-2/3 flex-0">
                <Image
                  src={
                    getImage(offer.keyImages, [
                      'DieselStoreFrontWide',
                      'Featured',
                      'OfferImageWide',
                    ])?.url
                  }
                  quality="original"
                  alt={offer.title}
                  width={1920}
                  height={1080}
                  className="object-cover"
                />
              </div>
              <article className="w-full md:w-1/3 p-4 flex flex-col justify-between items-start flex-1">
                <header>
                  <OfferLogo id={offer.id} />
                  <h3 className="text-2xl font-bold">{offer.title}</h3>
                  <p className="text-sm my-2">{offer.description}</p>
                  <div className="flex flex-wrap gap-2 my-2">
                    {offer.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="cursor-default">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </header>
                <footer className="w-full">
                  <div className="flex items-end justify-end gap-5">
                    <OfferPrice id={offer.id} releaseDate={new Date(offer.releaseDate)} />
                    <Button asChild>
                      <Link to={`/offers/${offer.id}`}>Check offer</Link>
                    </Button>
                  </div>
                </footer>
              </article>
            </div>
            <div className="md:hidden flex flex-col items-center w-full h-full">
              <article className="w-full p-4 flex flex-col justify-start items-start flex-1 bg-[#12141f] rounded-lg overflow-hidden gap-2">
                <Image
                  src={
                    getImage(offer.keyImages, [
                      'DieselStoreFrontWide',
                      'Featured',
                      'OfferImageWide',
                    ])?.url
                  }
                  alt={offer.title}
                  width={1920}
                  height={1080}
                  className="object-cover"
                />
                <header>
                  <OfferLogo id={offer.id} />
                  <h3 className="text-xl font-bold">{offer.title}</h3>
                  <p className="text-sm my-2">{offer.description}</p>
                  <div className="flex flex-wrap gap-2 my-2">
                    {offer.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="cursor-default">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </header>
                <footer className="w-full h-full flex flex-col justify-end">
                  <div className="flex items-end justify-end gap-5">
                    <OfferPrice id={offer.id} releaseDate={new Date(offer.releaseDate)} />
                    <Button asChild>
                      <Link to={`/offers/${offer.id}`}>Check offer</Link>
                    </Button>
                  </div>
                </footer>
              </article>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
      <div className="flex space-x-2 mt-4 mx-auto w-full justify-center">
        <ProgressIndicator
          current={current}
          total={count}
          api={api}
          offers={offers}
          progress={progress}
        />
      </div>
    </Carousel>
  );
}

function ProgressIndicator({
  current,
  total,
  api,
  offers,
  progress,
}: {
  current: number;
  total: number;
  api: CarouselApi;
  offers: SingleOffer[];
  progress: number[];
}) {
  return (
    <div className="flex space-x-2 mt-4 mx-auto w-full justify-center">
      <TooltipProvider>
        {Array.from({ length: total }).map((_, i) => (
          <Tooltip key={`${offers[i].id}-progress`} delayDuration={0}>
            <TooltipTrigger
              className={cn('block w-4 h-1 rounded-full cursor-pointer relative', 'bg-gray-500')}
              onClick={() => api?.scrollTo(i)}
              onKeyDown={() => api?.scrollTo(i)}
            >
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full"
                style={{
                  width: `${progress[i]}%`,
                  transition: 'width 0.1s linear',
                }}
              />
            </TooltipTrigger>
            <TooltipContent className="p-0" sideOffset={10}>
              {current !== i + 1 && (
                <img
                  src={
                    getImage(offers[i].keyImages, [
                      'DieselStoreFrontWide',
                      'Featured',
                      'OfferImageWide',
                    ])?.url
                  }
                  alt={offers[i].title}
                  className="w-auto h-28 object-cover rounded-md"
                />
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}

function OfferPrice({ id, releaseDate }: { id: string; releaseDate: Date }) {
  const { country } = useCountry();
  const { data } = useQuery<Price>({
    queryKey: ['offer-price', id],
    staleTime: 3600,
    queryFn: () =>
      client.get<Price>(`/offers/${id}/price?country=${country}`).then((res) => res.data),
  });

  if (!data) {
    return null;
  }

  const isDiscountedFree = data.price.discountPrice === 0;
  const isFree = data.price.originalPrice === 0;

  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: data.price.currencyCode,
  });

  // Show the price if the game has a price greater than 0, or if it's free and has been released
  return (
    <span className="inline-flex items-start gap-1">
      <span className="text-2xl font-bold">
        {isDiscountedFree || (isFree && releaseDate < new Date())
          ? releaseDate < new Date() && 'Free'
          : formatter.format(data.price.discountPrice / 100)}
      </span>
      {data.price.discountPrice !== data.price.originalPrice && (
        <span className="text-sm text-gray-500 line-through">
          {formatter.format(data.price.originalPrice / 100)}
        </span>
      )}
    </span>
  );
}

function OfferLogo({ id }: { id: string }) {
  const { data: media } = useQuery({
    queryKey: ['media', { id }],
    queryFn: () => client.get<Media>(`/offers/${id}/media`).then((response) => response.data),
    retry: false,
  });

  if (!media || !media.logo) {
    return null;
  }

  return (
    <img
      src={media.logo}
      alt={id}
      width="50%"
      height="auto"
      className="w-auto h-20 object-contain mb-4"
    />
  );
}
