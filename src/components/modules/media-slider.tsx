import { useQuery } from '@tanstack/react-query';
import { httpClient } from '~/lib/http-client';
import type { Media } from '~/types/media';
import type { SingleOffer } from '~/types/single-offer';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { getImage } from '~/lib/getImage';
import useEmblaCarousel from 'embla-carousel-react';
import { Player } from '../app/video-player.client';
import { Image } from '../app/image';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, PlayIcon } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface SlideBase {
  id: string;
  thumbnail: string;
}

interface ImageSlide extends SlideBase {
  type: 'image';
  /**
   * Image URL
   */
  image: string;
}

interface VideoSlide extends SlideBase {
  type: 'video';
  /**
   * Dash URL
   */
  video: Media['videos'][0];
}

type Slide = ImageSlide | VideoSlide;

export function OfferMediaSlider({ offer }: { offer: SingleOffer }) {
  const { data } = useQuery({
    queryKey: ['media', { id: offer.id }],
    queryFn: () => httpClient.get<Media>(`/offers/${offer.id}/media`),
  });

  const [mainCarousel, mainApi] = useEmblaCarousel();
  const [thumbCarousel, thumbApi] = useEmblaCarousel({
    containScroll: 'keepSnaps',
    dragFree: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback(
    (index: number) => {
      if (mainApi && thumbApi) {
        mainApi.scrollTo(index);
        thumbApi.scrollTo(index);
        setSelectedIndex(index);
      }
    },
    [mainApi, thumbApi],
  );

  const handlePrevious = useCallback(() => {
    if (mainApi) mainApi.scrollPrev();
  }, [mainApi]);

  const handleNext = useCallback(() => {
    if (mainApi) mainApi.scrollNext();
  }, [mainApi]);

  useEffect(() => {
    if (!mainApi || !thumbApi) return;

    mainApi.on('select', () => {
      setSelectedIndex(mainApi.selectedScrollSnap());
      thumbApi.scrollTo(mainApi.selectedScrollSnap());
    });
  }, [mainApi, thumbApi]);

  // Videos first, then images, if no images, get cover image from offer data
  const slides = useMemo<Slide[]>(() => {
    const imageToUse =
      getImage(offer.keyImages, ['OfferImageWide', 'DieselStoreFrontWide', 'Featured'])?.url ??
      '/300x150-egdata-placeholder.png';

    if (!data) {
      return [
        {
          id: offer.id,
          type: 'image' as const,
          image: imageToUse,
          thumbnail: imageToUse,
        },
      ];
    }

    const images = data.images.map((image) => ({
      id: image._id,
      type: 'image' as const,
      image: image.src,
      thumbnail: image.src,
    }));

    const videos = data.videos.map((video) => ({
      id: video._id,
      type: 'video' as const,
      video: video,
      thumbnail: imageToUse,
    }));

    return [...videos, ...images];
  }, [data, offer]);

  return (
    <div key={`media-slider-${offer.id}`} className="flex flex-col gap-4 w-full">
      <div className="relative">
        <div ref={mainCarousel} className="overflow-hidden">
          <div className="flex">
            {slides.map((slide, index) => (
              <div key={`slide-${slide.id}`} className="flex-[0_0_100%] min-w-0">
                {slide.type === 'image' && (
                  <Image
                    src={slide.image}
                    alt={`Image ${index + 1}`}
                    width={1920}
                    height={1080}
                    quality="original"
                    className="w-full h-auto object-cover"
                  />
                )}
                {slide.type === 'video' && (
                  <SlideWithNoDrag>
                    <Suspense
                      fallback={
                        <div className="flex flex-col w-full h-full">
                          <Skeleton className="w-full h-full" />
                        </div>
                      }
                    >
                      <Player
                        video={slide.video}
                        offer={offer}
                        className="w-full h-full max-w-full"
                        thumbnail={slide.thumbnail}
                      />
                    </Suspense>
                  </SlideWithNoDrag>
                )}
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous slide</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next slide</span>
        </Button>
      </div>
      <div className="mt-4">
        <div ref={thumbCarousel} className="overflow-hidden">
          <div className="flex -mx-2">
            {slides.map((slide, index) => (
              <div key={`thumbnail-${slide.id}`} className="flex-[0_0_25%] min-w-0 px-2">
                <button
                  type="button"
                  className={cn(
                    'w-full p-1 border-2 border-transparent rounded-md relative',
                    index === selectedIndex ? 'border-primary' : '',
                  )}
                  onClick={() => scrollTo(index)}
                >
                  {slide.type === 'video' && (
                    // Show a play icon so the user knows it's a video
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white z-50 opacity-75">
                      <PlayIcon className="size-8" fill="white" />
                    </span>
                  )}
                  <Image
                    src={slide.thumbnail}
                    alt={`Thumbnail ${index + 1}`}
                    width={600}
                    height={350}
                    className="w-full h-auto object-cover rounded-md"
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideWithNoDrag({ children }: { children: React.ReactNode }) {
  const stopPropagation = (
    e: React.PointerEvent | React.TouchEvent | React.MouseEvent<HTMLDivElement>,
  ) => e.stopPropagation();
  return (
    <div
      onPointerDown={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerUp={stopPropagation}
      onTouchStart={stopPropagation}
      onTouchMove={stopPropagation}
      onTouchEnd={stopPropagation}
      onMouseDown={stopPropagation}
      onMouseMove={stopPropagation}
      onMouseUp={stopPropagation}
    >
      {children}
    </div>
  );
}
