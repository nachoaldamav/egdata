import { type MetaFunction, redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQueries } from '@tanstack/react-query';
import cookies from 'cookie';
import { useMemo } from 'react';
import { OfferCard } from '~/components/app/offer-card';
import { Skeleton } from '~/components/ui/skeleton';
import { useCountry } from '~/hooks/use-country';
import { client, getQueryClient } from '~/lib/client';
import getCountryCode from '~/lib/get-country-code';
import { getImage } from '~/lib/getImage';
import { getSeller } from '~/queries/seller';
import type { SingleOffer } from '~/types/single-offer';

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
  const { id } = params;

  if (!id || !data) {
    return [
      {
        title: 'Seller not found | egdata.app',
      },
    ];
  }

  const coverData = data.dehydratedState.queries.find((q) => q.queryKey[0] === 'seller')?.state
    .data as SingleOffer[];

  if (!coverData) {
    return [
      {
        title: 'Seller not found | egdata.app',
      },
    ];
  }

  const randomCoverIndex = Math.floor(Math.random() * 5);

  const cover = coverData[randomCoverIndex];

  return [
    {
      title: `${coverData[0].seller.name} | egdata.app`,
      description: `Offers from ${coverData[0].seller.name}`,
    },
    {
      name: 'og:title',
      content: `${coverData[0].seller.name} | egdata.app`,
    },
    {
      name: 'og:description',
      content: `Offers from ${coverData[0].seller.name}`,
    },
    {
      name: 'og:image',
      content: getImage(cover.keyImages, [
        'DieselGameBoxWide',
        'DieselStoreFrontWide',
        'OfferImageWide',
      ])?.url.replaceAll(' ', '%20'),
    },
    {
      name: 'twitter:title',
      content: `${coverData[0].seller.name} | egdata.app`,
    },
    {
      name: 'twitter:description',
      content: `Offers from ${coverData[0].seller.name}`,
    },
    {
      name: 'twitter:image',
      content: getImage(cover.keyImages, [
        'DieselGameBoxWide',
        'DieselStoreFrontWide',
        'OfferImageWide',
      ])?.url.replaceAll(' ', '%20'),
    },
  ];
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const queryClient = getQueryClient();
  const country = getCountryCode(url, cookies.parse(request.headers.get('Cookie') || ''));

  const { id } = params;

  if (!id) {
    return redirect('/');
  }

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['seller', { id, country }],
      queryFn: async () => getSeller(id, country),
    }),
    queryClient.prefetchQuery({
      queryKey: ['seller:cover', { id, country }],
      queryFn: async () =>
        client
          .get<SingleOffer[]>(`/sellers/${id}/cover`, { params: { country } })
          .then((res) => res.data),
    }),
  ]);

  return {
    id,
    dehydratedState: dehydrate(queryClient),
    country,
  };
}

export default function Index() {
  const { country } = useCountry();
  const { id, dehydratedState } = useLoaderData<typeof loader>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <SellerPage id={id} country={country} />
    </HydrationBoundary>
  );
}

function SellerPage({ id, country }: { id: string; country: string }) {
  const [sellerData, coverData] = useQueries({
    queries: [
      {
        queryKey: ['seller', { id, country }],
        queryFn: () => getSeller(id, country),
      },
      {
        queryKey: ['seller:cover', { id, country }],
        queryFn: () =>
          client
            .get<SingleOffer[]>(`/sellers/${id}/cover`, { params: { country } })
            .then((res) => res.data),
      },
    ],
  });
  const randomCoverIndex = useMemo(() => Math.floor(Math.random() * 5), []);

  const { data, isLoading } = sellerData;
  const { data: cover } = coverData;

  if (!data || isLoading) {
    return <SellerPageSkeleton />;
  }

  return (
    <div className="min-h-[85vh]">
      <h1 className="text-4xl font-bold text-left">{data[0].seller.name}</h1>
      {cover && (
        <section className="w-full bg-card rounded-xl mt-10 relative group min-h-[500px]">
          <div className="grid gap-8 md:grid-cols-2 lg:gap-16 py-24 px-10 z-10 relative rounded-xl">
            <span className="hidden md:block" />
            <div className="space-y-4">
              <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                Featured Game
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                {cover[randomCoverIndex].title}
              </h2>
              <p className="text-gray-300 md:text-xl">{cover[randomCoverIndex].description}</p>
            </div>
          </div>
          <div
            id="cover-bg-image"
            className="absolute top-0 left-0 w-full h-full bg-cover bg-center rounded-xl z-0"
            style={{
              backgroundImage: `url(${getImage(cover[randomCoverIndex].keyImages, [
                'DieselGameBoxWide',
                'DieselStoreFrontWide',
                'OfferImageWide',
              ])?.url.replaceAll(' ', '%20')})`,
            }}
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-card/65 to-card z-0 rounded-xl" />
        </section>
      )}

      <section className="mt-16">
        <h2 className="text-2xl font-bold">Offers</h2>
        <div className="grid grid-cols-1 gap-4 mt-8 md:grid-cols-2 lg:grid-cols-5">
          {data.map((offer) => (
            <OfferCard key={offer.id} offer={offer} size="md" />
          ))}
        </div>
      </section>
    </div>
  );
}

function SellerPageSkeleton() {
  return (
    <div className="min-h-[85vh]">
      <h1 className="text-4xl font-bold text-left">
        <Skeleton className=" w-[200px]" />
      </h1>
      <Skeleton className="w-full h-[500px] mt-10" />

      <section className="mt-16">
        <h2 className="text-2xl font-bold">Offers</h2>
        <div className="grid grid-cols-1 gap-4 mt-8 md:grid-cols-2 lg:grid-cols-5">
          <OfferCardSkeleton />
          <OfferCardSkeleton />
          <OfferCardSkeleton />
          <OfferCardSkeleton />
          <OfferCardSkeleton />
        </div>
      </section>
    </div>
  );
}

function OfferCardSkeleton() {
  return (
    <div className="bg-card rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div>
            <Skeleton className="w-[200px]" />
            <Skeleton className="w-[100px]" />
          </div>
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div>
            <Skeleton className="w-[200px]" />
            <Skeleton className="w-[100px]" />
          </div>
        </div>
        <Skeleton className="w-12 h-12 rounded-lg" />
      </div>
    </div>
  );
}
