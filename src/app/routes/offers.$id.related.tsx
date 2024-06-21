import type { LoaderFunctionArgs } from '@remix-run/node';
import { type ClientLoaderFunctionArgs, Link, useLoaderData } from '@remix-run/react';
import { Image } from '~/components/app/image';
import { Card, CardHeader, CardContent } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { offersDictionary } from '~/lib/offers-dictionary';
import type { SingleOffer } from '~/types/single-offer';

type RelatedOffer = Pick<
  SingleOffer,
  | 'id'
  | 'title'
  | 'namespace'
  | 'effectiveDate'
  | 'creationDate'
  | 'lastModifiedDate'
  | 'viewableDate'
  | 'keyImages'
  | 'offerType'
>;

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const data = await client
    .get<RelatedOffer[]>(`/offers/${params.id}/related`)
    .then((res) => res.data);

  return {
    data,
  };
};

export const clientLoader = async ({ params }: ClientLoaderFunctionArgs) => {
  const data = await client
    .get<RelatedOffer[]>(`/offers/${params.id}/related`)
    .then((res) => res.data);

  return {
    data,
  };
};

export function HydrateFallback() {
  return (
    <div className="flex flex-col gap-4 mt-6">
      <h2 className="text-2xl font-bold">Related Offers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: This is a fallback component
          <Skeleton key={index} className="w-full h-72" />
        ))}
      </div>
    </div>
  );
}

export default function RelatedOffers() {
  const { data } = useLoaderData<typeof loader | typeof clientLoader>();
  return (
    <section className="flex flex-col gap-4 mt-6">
      <div className="inline-flex justify-between items-center">
        <h2 className="text-2xl font-bold">Related Offers</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data
          .sort(
            (a, b) =>
              new Date(b.lastModifiedDate).getTime() - new Date(a.lastModifiedDate).getTime(),
          )
          .map((offer) => (
            <OfferCardNoPrice key={offer.id} offer={offer} />
          ))}
      </div>
    </section>
  );
}

export function OfferCardNoPrice({ offer }: { offer: RelatedOffer }) {
  return (
    <Link to={`/offers/${offer.id}`} prefetch="viewport">
      <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg">
        <CardHeader className="p-0 rounded-t-xl">
          <Image
            src={
              getImage(offer.keyImages, [
                'OfferImageWide',
                'DieselGameBoxWide',
                'DieselStoreFrontWide',
                'Featured',
                'horizontal',
              ])?.url
            }
            alt={offer.title}
            width={400}
            height={200}
            className="w-full h-72 object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col justify-between">
          <div className="mt-2 flex items-end justify-between gap-2 h-full">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {offersDictionary[offer.offerType]}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(offer.lastModifiedDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold max-w-xs truncate">{offer.title}</h3>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
