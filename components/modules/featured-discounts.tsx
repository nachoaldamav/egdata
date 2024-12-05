import { useQuery } from '@tanstack/react-query';
import type { SingleOffer } from '@/types/single-offer';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/app/image';
import { getImage } from '@/lib/getImage';
import type { Media } from '@/types/media';
import { useEffect, useRef, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import buildImageUrl from '@/lib/build-image-url';
import { useCountry } from '@/hooks/use-country';
import { Skeleton } from '../ui/skeleton';
import { getFeaturedDiscounts } from '@/queries/featured-discounts';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import type { Price as OfferPrice } from '@/types/price';
import { httpClient } from '@/lib/http-client';
import { calculatePrice } from '@/lib/calculate-price';
import { Link } from '@tanstack/react-router';
import { useLocale } from '@/hooks/use-locale';

const SLIDE_DELAY = 15_000;

export function FeaturedDiscounts() {
  const { country } = useCountry();
  const {
    data: featuredDiscounts,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ['featuredDiscounts', { country }],
    queryFn: () => getFeaturedDiscounts({ country }),
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
    setProgress(
      Array.from(
        { length: (featuredDiscounts as SingleOffer[])?.length || 0 },
        () => 0,
      ),
    );

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
      setProgress(
        Array.from(
          { length: (featuredDiscounts as SingleOffer[])?.length || 0 },
          () => 0,
        ),
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
    <section id="featured-discounts" className="max-w-[95vw] h-full">
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
        className="mt-2 p-4 h-fit"
        setApi={setApi}
        plugins={[
          Autoplay({
            delay: SLIDE_DELAY,
            stopOnMouseEnter: true,
            stopOnInteraction: false,
          }),
        ]}
      >
        <CarouselContent>
          {featuredDiscounts.map((offer) => (
            <CarouselItem key={offer.id}>
              <FeaturedOffer offer={offer} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="md:flex space-x-2 mt-4 mx-auto w-full justify-center hidden">
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
          <Tooltip key={`tooltip-${offers[i]?.id}`} delayDuration={0}>
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
                    getImage(offers[i]?.keyImages ?? [], [
                      'DieselStoreFrontWide',
                      'Featured',
                      'OfferImageWide',
                    ])?.url ?? '/300x150-egdata-placeholder.png',
                    400,
                    'medium',
                  )}
                  alt={offers[i]?.title}
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
  const [image] = useState<string | null>(null);
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
    <div className="w-full mx-auto bg-background rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="relative"
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
              ref={videoRef}
            />
          )}
          <Image
            src={
              image ||
              getImage(offer.keyImages, [
                'OfferImageWide',
                'DieselStoreFrontWide',
                'Featured',
              ])?.url
            }
            alt={offer.title}
            width={500}
            height={300}
            className={cn(
              'w-full h-auto object-cover rounded-lg transition-opacity duration-700 ease-in-out',
              videoUrl && isHovered ? 'opacity-0' : 'opacity-100',
            )}
            unoptimized
          />
        </div>

        {/* Details Section */}
        <div className="flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold">{offer.title}</h3>
            <p className="text-muted-foreground text-sm mt-2">
              {offer.description?.replaceAll('\n', '')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {offer.tags.slice(0, 4).map((tag) => (
                <Link
                  key={tag.id}
                  to="/search"
                  search={{
                    tags: tag.id,
                  }}
                >
                  <Badge>{tag.name}</Badge>
                </Link>
              ))}
              {offer.tags.length > 4 && (
                <Badge>+{offer.tags.length - 4} more</Badge>
              )}
            </div>
          </div>
          <div className="mt-6">
            <Price offer={offer} />
            <Button asChild size="lg" className="w-full mt-4">
              <Link to={`/offers/${offer.id}`} preload="intent">
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
  const { locale } = useLocale();
  const priceFmtd = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: offer.price?.price.currencyCode || 'USD',
  });

  const isFree = offer.price?.price.discountPrice === 0;

  if (!offer.price) {
    return (
      <span className="text-xl font-bold text-green-400">Coming Soon</span>
    );
  }

  return (
    <div className="flex items-end justify-end space-x-4">
      {offer.price?.appliedRules.length > 0 && (
        <SaleModule price={offer.price} />
      )}
      <div className="flex flex-col gap-0">
        {offer.price?.price.originalPrice !==
          offer.price?.price.discountPrice && (
          <span className="line-through text-muted-foreground text-sm">
            {priceFmtd.format(
              calculatePrice(
                offer.price?.price.originalPrice,
                offer.price?.price.currencyCode,
              ),
            )}
          </span>
        )}
        {isFree ? (
          <span className="text-xl font-bold text-green-400">Free</span>
        ) : (
          <span className="text-xl font-bold text-green-400">
            {priceFmtd.format(
              calculatePrice(
                offer.price?.price.discountPrice,
                offer.price?.price.currencyCode,
              ),
            )}
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
      <span className="text-lg inline-flex items-center bg-badge px-4 py-1 rounded-lg text-black font-bold">
        - {100 - selectedRule.discountSetting.discountPercentage}%
      </span>
    </div>
  );
}
