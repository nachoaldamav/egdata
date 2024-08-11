import { useQuery } from '@tanstack/react-query';
import type { SingleOffer } from '~/types/single-offer';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '~/components/ui/carousel';
import { Link } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Image } from '~/components/app/image';
import { getImage } from '~/lib/getImage';
import type { Media } from '~/types/media';
import { useEffect, useRef, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { TooltipProvider, TooltipTrigger, TooltipContent, Tooltip } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';
import { Badge } from '../ui/badge';
import { platformIcons } from '../app/platform-icons';
import buildImageUrl from '~/lib/build-image-url';
import { useCountry } from '~/hooks/use-country';
import { Skeleton } from '../ui/skeleton';
import { getFeaturedDiscounts } from '~/queries/featured-discounts';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import type { Price as OfferPrice } from '~/types/price';
import { httpClient } from '~/lib/http-client';

const SLIDE_DELAY = 10_000;

export function FeaturedDiscounts() {
  const { country } = useCountry();
  const {
    data: featuredDiscounts,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['featuredDiscounts', { country }],
    queryFn: () => getFeaturedDiscounts({ country }),
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

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
    setProgress(Array.from({ length: (featuredDiscounts as SingleOffer[])?.length || 0 }, () => 0));

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
      setProgress(
        Array.from({ length: (featuredDiscounts as SingleOffer[])?.length || 0 }, () => 0),
      );
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
  }, [api, current, isPaused, featuredDiscounts]);

  if (isLoading && isFetching && !featuredDiscounts) {
    return (
      <section id="featured-discounts" className="w-full">
        <h4 className="text-xl font-bold text-left inline-flex group items-center gap-2">
          Featured Discounts
        </h4>
        <Skeleton className="w-full h-[550px] mt-2 p-4" />
      </section>
    );
  }

  const handleNextSlide = () => {
    api?.scrollNext();
  };

  const handlePreviousSlide = () => {
    api?.scrollPrev();
  };

  if (!featuredDiscounts) {
    return null;
  }

  return (
    <section id="featured-discounts">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xl font-bold text-left inline-flex group items-center gap-2">
          Featured Discounts
        </h4>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousSlide}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground hover:bg-gray-900 focus:outline-none focus:ring focus:ring-gray-300/50 disabled:opacity-50"
            disabled={current === 1}
            type="button"
          >
            <ArrowUpIcon className="w-5 h-5 transform -rotate-90" />
          </button>
          <button
            onClick={handleNextSlide}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-card text-muted-foreground hover:bg-gray-900 focus:outline-none focus:ring focus:ring-gray-300/50 disabled:opacity-50"
            disabled={current === count}
            type="button"
          >
            <ArrowUpIcon className="w-5 h-5 transform rotate-90" />
          </button>
        </div>
      </div>
      <Carousel
        className="mt-2 p-4 h-[550px]"
        setApi={setApi}
        plugins={[
          Autoplay({ delay: SLIDE_DELAY, stopOnMouseEnter: true, stopOnInteraction: false }),
        ]}
      >
        <CarouselContent>
          {featuredDiscounts.map((offer) => (
            <CarouselItem key={offer.id}>
              <FeaturedOffer offer={offer} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex space-x-2 mt-4 mx-auto w-full justify-center">
          <ProgressIndicator
            current={current}
            total={count}
            api={api}
            offers={featuredDiscounts}
            progress={progress}
          />
        </div>
      </Carousel>
    </section>
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
    <div className="flex space-x-2 mt-4 mx-auto w-full justify-center min-h-1">
      <TooltipProvider>
        {Array.from({ length: total }).map((_, i) => (
          <Tooltip key={`tooltip-${offers[i].id}`} delayDuration={0}>
            <TooltipTrigger
              className={cn(
                'block w-5 h-[5px] rounded-full cursor-pointer relative',
                'bg-gray-500',
                current === i + 1 ? 'w-10' : 'hover:bg-gray-700 hover:w-8',
                'transition-width duration-300 ease-in-out',
              )}
              onClick={() => api?.scrollTo(i)}
              onKeyDown={() => api?.scrollTo(i)}
            >
              <div
                className="absolute top-0 left-0 h-full bg-white rounded-full transition-width duration-300 ease-in-out"
                style={{
                  width: `${progress[i]}%`,
                }}
              />
            </TooltipTrigger>
            <TooltipContent className="p-0 bg-card" sideOffset={10}>
              {current !== i + 1 && (
                <img
                  src={buildImageUrl(
                    getImage(offers[i].keyImages, [
                      'DieselStoreFrontWide',
                      'Featured',
                      'OfferImageWide',
                    ])?.url ?? '/300x150-egdata-placeholder.png',
                    400,
                    'medium',
                  )}
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

function FeaturedOffer({ offer }: { offer: SingleOffer }) {
  const [image, setImage] = useState<string | null>(null);
  const { data: offerMedia } = useQuery({
    queryKey: ['media', { id: offer.id }],
    queryFn: () => httpClient.get<Media>(`/offers/${offer.id}/media`),
  });
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoUrl = offerMedia?.videos[0]?.outputs
    .filter((output) => output.width !== undefined)
    .sort((a, b) => (b?.width ?? 0) - (a?.width ?? 0))[0]?.url;

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      if (!isHovered) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isHovered]);

  return (
    <div className="w-full bg-background rounded-lg shadow-lg overflow-hidden group mx-auto select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div
            className="relative w-full h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {videoUrl && (
              <video
                className={cn(
                  'rounded-xl shadow-lg transition-opacity duration-700 absolute inset-0 ease-in-out w-full h-full object-cover',
                  isHovered ? 'opacity-100' : 'opacity-0',
                )}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                width={'100%'}
                height={'100%'}
                src={videoUrl}
                ref={videoRef}
              />
            )}
            <Image
              src={
                image ??
                getImage(offer.keyImages, ['OfferImageWide', 'DieselStoreFrontWide', 'Featured'])
                  ?.url
              }
              alt={offer.title}
              width={500}
              height={300}
              quality="original"
              className={cn(
                'w-full h-auto object-cover rounded-lg transition-opacity duration-700 ease-in-out',
                videoUrl && isHovered ? 'opacity-0' : 'opacity-100',
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-bold">{offer.title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{offer.description}</p>
          </div>
        </div>
        <div className="md:col-span-1 flex flex-col justify-between px-4 gap-1">
          <div className="h-full">
            <div className="grid grid-cols-2 gap-2 h-full">
              {offerMedia?.images.slice(0, 4).map((image) => (
                <div
                  className="h-auto w-full rounded-lg inline-flex items-center justify-center opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                  key={image._id}
                  onClick={() => setImage(image.src)}
                  onKeyDown={() => setImage(image.src)}
                >
                  <Image
                    src={image.src}
                    alt={offer.title}
                    width={1080}
                    height={560}
                    quality="high"
                    className="object-cover rounded-lg mx-auto h-full w-full"
                  />
                </div>
              ))}
              {!offerMedia?.images.length &&
                Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={`${offer.id}-image-${index}`} className="w-full h-full" />
                ))}
            </div>
          </div>
          <div className="inline-flex items-center justify-start gap-2">
            {offer.tags.slice(0, 4).map((tag) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}
            {offer.tags.length > 4 && (
              <Badge>
                +{offer.tags.length - 4} <span className="sr-only">more</span>
              </Badge>
            )}
          </div>
          <div className="flex flex-col justify-end">
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm inline-flex gap-1 items-center justify-start">
                  {offer.tags
                    .filter((tag) => platformIcons[tag.id])
                    .map((tag) => (
                      <span key={tag.id} className="inline-flex items-center gap-1">
                        {platformIcons[tag.id]}
                      </span>
                    ))}
                </span>
              </div>
              <Price offer={offer} />
            </div>
            <Button asChild size="lg" className="w-full mt-4 h-10">
              <Link to={`/offers/${offer.id}`} prefetch="viewport">
                Check Offer
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Price({ offer }: { offer: SingleOffer }) {
  const priceFmtd = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: offer.price?.price.currencyCode || 'USD',
  });

  const isFree = offer.price?.price.discountPrice === 0;

  if (!offer.price) {
    return <span className="text-xl font-bold text-green-400">Coming Soon</span>;
  }

  return (
    <div className="flex items-end justify-end space-x-4">
      {offer.price?.appliedRules.length > 0 && <SaleModule price={offer.price} />}
      <div className="flex flex-col gap-0">
        {offer.price?.price.originalPrice !== offer.price?.price.discountPrice && (
          <span className="line-through text-muted-foreground text-sm">
            {priceFmtd.format(offer.price?.price.originalPrice / 100)}
          </span>
        )}
        {isFree ? (
          <span className="text-xl font-bold text-green-400">Free</span>
        ) : (
          <span className="text-xl font-bold text-green-400">
            {priceFmtd.format(offer.price?.price.discountPrice / 100)}
          </span>
        )}
      </div>
    </div>
  );
}

function SaleModule({ price }: { price: OfferPrice }) {
  const selectedRule = price.appliedRules.sort(
    (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
  )[0];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground inline-flex items-center">
        until{' '}
        {new Date(selectedRule.endDate).toLocaleDateString('en-UK', {
          year: undefined,
          month: 'long',
          day: 'numeric',
        })}
      </span>
      <span className="text-lg inline-flex items-center bg-green-400 px-4 py-1 rounded-lg text-black font-extrabold">
        - {100 - selectedRule.discountSetting.discountPercentage}%
      </span>
    </div>
  );
}
