import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { client } from '~/lib/client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion';
import type { Media } from '~/types/media';

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
                <img key={image._id} src={image.src} alt="" />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="videos">
          <AccordionTrigger className="text-xl">Videos</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4">
              {media.videos.map((video) => (
                <video key={video._id} controls>
                  {video.outputs.map((output) => (
                    <source key={output._id} src={output.url} type={output.contentType} />
                  ))}
                </video>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
