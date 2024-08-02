import { redirect, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import cookies from 'cookie';
import { OfferCard } from '~/components/app/offer-card';
import { useCountry } from '~/hooks/use-country';
import { getQueryClient } from '~/lib/client';
import getCountryCode from '~/lib/get-country-code';
import { getImage } from '~/lib/getImage';
import { getSeller } from '~/queries/seller';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const queryClient = getQueryClient();
  const country = getCountryCode(url, cookies.parse(request.headers.get('Cookie') || ''));

  const { id } = params;

  if (!id) {
    return redirect('/');
  }

  await queryClient.prefetchQuery({
    queryKey: ['seller', { id, country }],
    queryFn: async () => getSeller(id, country),
  });

  return {
    id,
    dehydratedState: dehydrate(queryClient),
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
  const { data } = useQuery({
    queryKey: ['seller', { id, country }],
    queryFn: () => getSeller(id, country),
  });

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-[85vh]">
      <h1 className="text-4xl font-bold text-left">{data[0].seller.name}</h1>
      {/* <section className="w-full bg-muted py-16 px-10 rounded-lg mt-10">
        <div className="container grid gap-8 md:grid-cols-2 lg:gap-16">
          <img
            src={
              getImage(data[0].keyImages, [
                'DieselGameBoxWide',
                'DieselStoreFrontWide',
                'OfferImageWide',
              ])?.url
            }
            alt="Featured Game"
            width={800}
            height={450}
            className="rounded-lg object-cover aspect-[16/9]"
          />
          <div className="space-y-4">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
              Featured Game
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              {data[0].title}
            </h2>
            <p className="text-muted-foreground md:text-xl">{data[0].description}</p>
          </div>
        </div>
      </section> */}

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
