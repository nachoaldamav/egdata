import type { LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { Image } from '~/components/app/image';
import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';

type SandboxOffer = Pick<
  SingleOffer,
  | 'id'
  | 'title'
  | 'description'
  | 'offerType'
  | 'effectiveDate'
  | 'creationDate'
  | 'lastModifiedDate'
  | 'keyImages'
  | 'productSlug'
  | 'releaseDate'
>;

export async function loader({ params }: LoaderFunctionArgs) {
  const [offersData] = await Promise.allSettled([
    client.get<SandboxOffer[]>(`/sandboxes/${params.id}/offers`),
  ]);

  const offers = offersData.status === 'fulfilled' ? offersData.value.data : [];

  return { offers, id: params.id };
}

export async function clientLoader({ params }: LoaderFunctionArgs) {
  const [offersData] = await Promise.allSettled([
    client.get<SandboxOffer[]>(`/sandboxes/${params.id}/offers`),
  ]);

  const offers = offersData.status === 'fulfilled' ? offersData.value.data : [];

  return { offers, id: params.id };
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Index() {
  const { offers } = useLoaderData<typeof loader>();

  return (
    <section className="flex-1 p-4">
      <h1 className="text-2xl font-bold">Offers</h1>
      <div className="grid grid-cols-1 gap-4 mt-4">
        {offers.map((offer) => (
          <Link key={offer.id} to={`/offers/${offer.id}`}>
            <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg">
                <Image
                  src={offer.keyImages[0]?.url}
                  alt={offer.title}
                  width={64}
                  height={64}
                  className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{offer.title}</h2>
                <p className="text-sm text-gray-500">{offer.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
