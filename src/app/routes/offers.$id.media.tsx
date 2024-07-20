import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { type ClientLoaderFunctionArgs, useLoaderData } from '@remix-run/react';
import { client, getQueryClient } from '~/lib/client';
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
        thumbnailUrl: posters[0].url,
        contentUrl: outputs[0].url,
        embedUrl: outputs[0].url,
        width: outputs[0].width,
        height: outputs[0].height,
        encodingFormat: outputs[0].contentType.split('/')[1],
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
  const [mediaData, offerData] = await Promise.allSettled([
    client.get<Media>(`/offers/${params.id}/media`).then((res) => res.data),
    client.get<SingleOffer>(`/offers/${params.id}`).then((res) => res.data),
  ]);

  const media = mediaData.status === 'fulfilled' ? mediaData.value : null;
  const offer = offerData.status === 'fulfilled' ? offerData.value : null;

  return {
    media,
    offer,
  };
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const queryClient = getQueryClient();

  const [mediaData, offerData] = await Promise.allSettled([
    queryClient.fetchQuery({
      queryKey: ['media', { id: params.id }],
      queryFn: () => client.get<Media>(`/offers/${params.id}/media`).then((res) => res.data),
    }),
    queryClient.fetchQuery({
      queryKey: ['offer', { id: params.id }],
      queryFn: () => client.get<SingleOffer>(`/offers/${params.id}`).then((res) => res.data),
    }),
  ]);

  const media = mediaData.status === 'fulfilled' ? mediaData.value : null;
  const offer = offerData.status === 'fulfilled' ? offerData.value : null;

  return {
    media,
    offer,
  };
}

export function HydrateFallback() {
  return (
    <div className="flex flex-col items-start gap-2">
      <Skeleton className="w-full h-96 mx-auto" />
      <Skeleton className="w-full h-[50vh] mx-auto" />
    </div>
  );
}

export default function ItemsSection() {
  const { media, offer } = useLoaderData<typeof loader>();
  const [active, setActive] = useState<boolean | string>(false);

  if (!media) {
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
            <div className="grid grid-cols-2 gap-4">
              {media.images.map((image) => (
                <img
                  key={image._id}
                  src={image.src}
                  alt=""
                  onClick={() => setActive(image._id)}
                  className="cursor-pointer"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setActive(image._id);
                    }
                  }}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="videos">
          <AccordionTrigger className="text-xl">Videos</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {media.videos.map((video) => (
                <Suspense key={video._id} fallback={<div>Loading...</div>}>
                  <Player video={video} offer={offer as SingleOffer} />
                </Suspense>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Portal.Root>
        {active && (
          <ImageModal images={media.images} active={active} onClose={() => setActive(false)} />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm cursor-pointer"
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
