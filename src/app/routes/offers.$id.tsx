import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Image } from '~/components/app/image';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { getSeller } from '~/lib/get-seller';
import type { SingleItem } from '~/types/single-item';
import type { SingleOffer } from '~/types/single-offer';

export async function loader({ params }: LoaderFunctionArgs) {
  const offer = await client
    .get<SingleOffer>(`/offers/${params.id}`)
    .then((response) => response.data);

  const items = await client
    .get<{
      items: SingleItem[];
    }>(`/items-from-offer/${params.id}`)
    .then((response) => response.data)
    .catch(() => ({
      items: [],
    }));

  return {
    offer,
    items: items.items as SingleItem[],
  };
}

export default function Index() {
  const { offer: offerData, items } = useLoaderData<typeof loader>();

  if (!offerData) {
    return <div>Offer not found</div>;
  }

  if (offerData.title === 'Error') {
    return <div>{offerData.description}</div>;
  }

  return (
    <main className="flex flex-col items-start justify-start w-full min-h-screen">
      <header className="grid col-span-1 gap-4 md:grid-cols-2 w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{offerData.title}</h1>
          <h4
            className="text-lg font-semibold opacity-50"
            aria-label={`Offered by ${offerData.seller.name}`}
          >
            {getSeller({
              developerDisplayName: offerData.developerDisplayName as string,
              publisherDisplayName: offerData.publisherDisplayName as string,
              seller: offerData.seller.name,
            })}
          </h4>
          <p className="pt-2">{offerData.description}</p>
        </div>
        <div className="flex justify-center">
          <Image
            src={
              getImage(offerData.keyImages, [
                'OfferImageWide',
                'DieselGameBoxWide',
              ]).url
            }
            alt={offerData.title}
            width={1920}
            height={1080}
            className="rounded-xl shadow-lg"
          />
        </div>
      </header>
    </main>
  );
}
