import { createFileRoute } from '@tanstack/react-router';
import { httpClient } from '@/lib/http-client';
import type { Media } from '@/types/media';
import type { SingleOffer } from '@/types/single-offer';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { Suspense, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Image } from '@/components/app/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Player } from '@/components/app/video-player.client';
import { DownloadIcon, XIcon } from 'lucide-react';
import * as Portal from '@radix-ui/react-portal';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { getQueryClient } from '@/lib/client';
import { generateOfferMeta } from '@/lib/generate-offer-meta';

export const Route = createFileRoute('/offers/$id/media')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <MediaPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context, params }) => {
    const { queryClient } = context;
    const { id } = params;

    await queryClient.prefetchQuery({
      queryKey: ['media', { id: params.id }],
      queryFn: () => httpClient.get<Media>(`/offers/${params.id}/media`),
    });

    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      dehydrate(queryClient),
      ['offer', { id: params.id }],
    );

    return {
      dehydratedState: dehydrate(queryClient),
      id,
      offer,
    };
  },

  head: (ctx) => {
    const { params } = ctx;
    const queryClient = getQueryClient();

    if (!ctx.loaderData) {
      return {
        meta: [
          {
            title: 'Offer not found',
            description: 'Offer not found',
          },
        ],
      };
    }

    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      ctx.loaderData?.dehydratedState,
      ['offer', { id: params.id }],
    );

    if (!offer) {
      return {
        meta: [
          {
            title: 'Offer not found',
            description: 'Offer not found',
          },
        ],
      };
    }

    return {
      meta: generateOfferMeta(offer, 'Media'),
    };
  },
});

function MediaPage() {
  const params = Route.useParams();
  const { offer } = Route.useLoaderData();
  const { data: media, isLoading } = useQuery({
    queryKey: ['media', { id: params.id }],
    queryFn: () => httpClient.get<Media>(`/offers/${params.id}/media`),
  });

  const [active, setActive] = useState<boolean | string>(false);

  if (isLoading && !media) {
    return (
      <div className="flex flex-col gap-4 mt-6 max-w-4xl w-full mx-auto">
        <h4 className="text-xl">Images</h4>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="w-full h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="flex flex-col items-start gap-2">
        <h2 className="text-2xl font-bold">Media</h2>
        <p>No media found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Accordion
        type="single"
        collapsible
        className="w-full max-w-4xl mx-auto"
        defaultValue="images"
      >
        <AccordionItem value="images">
          <AccordionTrigger className="text-xl">Images</AccordionTrigger>
          <AccordionContent>
            {!media?.images.length && (
              <div className="text-center">
                <h2 className="text-2xl font-bold">No images found</h2>
              </div>
            )}
            {media?.images && media.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {media.images.map((image) => (
                  <Image
                    key={image._id}
                    src={image.src}
                    alt=""
                    onClick={() => setActive(image._id)}
                    className="cursor-pointer rounded-xl"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setActive(image._id);
                      }
                    }}
                    width={700}
                    height={400}
                  />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="videos">
          <AccordionTrigger className="text-xl">Videos</AccordionTrigger>
          <AccordionContent>
            {!media?.videos.length && (
              <div className="text-center">
                <h2 className="text-2xl font-bold">No videos found</h2>
              </div>
            )}
            {media?.videos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {media?.videos.map((video) => (
                  <Suspense key={video._id} fallback={<div>Loading...</div>}>
                    <Player video={video} offer={offer as SingleOffer} />
                  </Suspense>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="covers">
          <AccordionTrigger className="text-xl">Covers</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4">
              {offer?.keyImages.map((cover) => (
                <div
                  key={cover.md5}
                  className="flex flex-col items-center gap-2 relative"
                >
                  <span className="absolute top-2 right-2 text-xs font-mono">
                    <a
                      className="text-xs bg-card/15 p-2 rounded-md cursor-pointer inline-block"
                      href={cover.url}
                      download={`${offer.title}-${cover.type}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </a>
                  </span>
                  <img
                    key={cover.md5}
                    src={cover.url}
                    alt={`${offer.title} - ${cover.type}`}
                  />
                  <span className="text-sm font-mono">{cover.type}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Portal.Root>
        {active && (
          <ImageModal
            images={media?.images}
            active={active}
            onClose={() => setActive(false)}
          />
        )}
      </Portal.Root>
    </div>
  );
}

function ImageModal({
  images,
  active,
  onClose,
}: {
  images: Media['images'];
  active: boolean | string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const activeIndex = images.findIndex((img) => img._id === active);
  const sortedImages = [
    ...images.slice(activeIndex),
    ...images.slice(0, activeIndex),
  ];

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === ref.current) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
    >
      <button
        className="absolute top-4 right-4 cursor-pointer"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onClose();
          }
        }}
        type="button"
        tabIndex={0}
      >
        <XIcon className="w-6 h-6 text-white" />
      </button>
      <section className="flex items-center justify-center w-full h-full max-w-6xl">
        <Carousel aria-label="Images">
          <CarouselContent>
            {sortedImages.map((img) => (
              <CarouselItem key={img._id}>
                <img
                  src={img.src}
                  alt=""
                  className="w-full h-auto cursor-default"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext />
          <CarouselPrevious />
        </Carousel>
      </section>
    </div>
  );
}
