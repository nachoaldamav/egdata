import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { client } from '~/lib/client';
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

export const meta: MetaFunction = () => {
  return [
    {
      tagName: 'link',
      rel: 'stylesheet',
      href: '/css/plyr.css',
    },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const media = await client
    .get<Media>(`/offers/${params.id}/media`)
    .then((res) => res.data)
    .catch((error) => {
      console.error(error);
      return null;
    });

  return {
    media,
  };
}

export default function ItemsSection() {
  const { media } = useLoaderData<typeof loader>();
  const [active, setActive] = useState<string | null>(null);

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
            <div className="grid grid-cols-2 gap-4">
              {media.videos.map((video) => (
                <Suspense key={video._id} fallback={<div>Loading...</div>}>
                  <Player video={video} />
                </Suspense>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Portal.Root>
        {active && (
          <ImageModal
            image={media.images.find((image) => image._id === active)}
            onClose={() => setActive(null)}
          />
        )}
      </Portal.Root>
    </div>
  );
}

function ImageModal({
  image,
  onClose,
}: {
  image: Media['images'][0] | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

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
      <img
        src={image?.src ?? 'https://via.placeholder.com/1920x1080'}
        alt=""
        className="max-w-6xl max-h-full cursor-default"
      />
    </div>
  );
}
