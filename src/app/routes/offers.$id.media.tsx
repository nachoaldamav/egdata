import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { type ClientLoaderFunctionArgs, useLoaderData, useRouteError } from '@remix-run/react';
import { getQueryClient } from '~/lib/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import type { Media } from '~/types/media';
import { Suspense, useRef, useState } from 'react';
import * as Portal from '@radix-ui/react-portal';
import { Player } from '~/components/app/video-player.client';
import type { SingleOffer } from '~/types/single-offer';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import defaultPlayerTheme from '@vidstack/react/player/styles/default/theme.css?url';
import defaultAudioPlayer from '@vidstack/react/player/styles/default/layouts/audio.css?url';
import defaultVideoPlayer from '@vidstack/react/player/styles/default/layouts/video.css?url';
import { Skeleton } from '~/components/ui/skeleton';
import { XIcon } from '@primer/octicons-react';
import { useQueries } from '@tanstack/react-query';
import { Image } from '~/components/app/image';
import { httpClient } from '~/lib/http-client';
import { DownloadIcon } from 'lucide-react';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: defaultPlayerTheme },
  { rel: 'stylesheet', href: defaultAudioPlayer },
  { rel: 'stylesheet', href: defaultVideoPlayer },
];

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];

  const { media, offer } = data;
  const videos = media?.videos;

  const videosJsonLd =
    videos?.map((video) => {
      const outputs = video.outputs
        .filter((output) => output.contentType.startsWith('video/'))
        .sort((a, b) => (b.width as number) - (a.width as number));
      const posters = video.outputs.filter((output) => output.contentType.startsWith('image/'));

      return {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: `${offer?.title} - trailer`,
        description: offer?.description,
        uploadDate: offer?.creationDate,
        thumbnailUrl: posters[0]?.url ?? offer?.keyImages[0]?.url ?? '',
        contentUrl: outputs[0]?.url,
        embedUrl: outputs[0]?.url,
        width: outputs[0]?.width,
        height: outputs[0]?.height,
        encodingFormat: outputs[0]?.contentType?.split('/')[1],
        copyrightHolder: {
          '@type': 'Organization',
          name: `${offer?.seller.name}${offer?.publisherDisplayName ? ` - ${offer.publisherDisplayName}` : ''}`,
        },
      };
    }) ?? [];

  return videosJsonLd.map((video, index) => ({
    'script:ld+json': video,
  }));
};

export async function loader({ params }: LoaderFunctionArgs) {
  const queryClient = getQueryClient();

  const [mediaData, offerData] = await Promise.allSettled([
    queryClient.fetchQuery({
      queryKey: ['media', { id: params.id }],
      queryFn: () => httpClient.get<Media>(`/offers/${params.id}/media`),
    }),
    queryClient.fetchQuery({
      queryKey: ['offer', { id: params.id }],
      queryFn: () => httpClient.get<SingleOffer>(`/offers/${params.id}`),
    }),
  ]);

  const media = mediaData.status === 'fulfilled' ? mediaData.value : null;
  const offer = offerData.status === 'fulfilled' ? offerData.value : null;

  return {
    media,
    offer,
    id: params.id,
    serverTimestamp: Date.now(),
  };
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  return {
    media: null,
    offer: null,
    id: params.id,
    serverTimestamp: Date.now(),
  };
}

export function ErrorBoundary() {
  const error = useRouteError();
  // When NODE_ENV=production:
  // error.message = "Unexpected Server Error"
  // error.stack = undefined

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold">An error occurred</h2>
      <p>{error.message}</p>
    </div>
  );
}

export default function ItemsSection() {
  const {
    media: initialDataMedia,
    offer: initialDataOffer,
    id,
    serverTimestamp,
  } = useLoaderData<typeof loader | typeof clientLoader>();
  const [mediaQuery, offerQuery] = useQueries({
    queries: [
      {
        queryKey: ['media', { id }],
        queryFn: () => httpClient.get<Media>(`/offers/${id}/media`),
        initialData: initialDataMedia ?? undefined,
        staleTime: 1000,
        initialDataUpdatedAt: serverTimestamp,
        retry: false,
      },
      {
        queryKey: ['offer', { id }],
        queryFn: () => httpClient.get<SingleOffer>(`/offers/${id}`),
        initialData: initialDataOffer ?? undefined,
        staleTime: 1000,
        initialDataUpdatedAt: serverTimestamp,
      },
    ],
  });
  const [active, setActive] = useState<boolean | string>(false);

  const { data: media, isLoading: mediaLoading } = mediaQuery;
  const { data: offer, isLoading: offerLoading } = offerQuery;

  if ((mediaLoading && !media) || (offerLoading && !offer) || (!media && !offer)) {
    return (
      <div className="flex flex-col gap-4 mt-6">
        <h2 className="text-2xl font-bold">Media</h2>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="w-full h-72" />
          ))}
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">No media found</h2>
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
                {media.videos.map((video) => (
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
                <div key={cover.md5} className="flex flex-col items-center gap-2 relative">
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
                  <img key={cover.md5} src={cover.url} alt={`${offer.title} - ${cover.type}`} />
                  <span className="text-sm font-mono">{cover.type}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Portal.Root>
        {active && (
          <ImageModal images={media?.images} active={active} onClose={() => setActive(false)} />
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
  const sortedImages = [...images.slice(activeIndex), ...images.slice(0, activeIndex)];

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
      <span
        className="absolute top-4 right-4 cursor-pointer"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <XIcon className="w-6 h-6 text-white" />
      </span>
      <section className="flex items-center justify-center w-full h-full max-w-6xl">
        <Carousel aria-label="Images">
          <CarouselContent>
            {sortedImages.map((img) => (
              <CarouselItem key={img._id}>
                <img src={img.src} alt="" className="w-full h-auto cursor-default" />
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
