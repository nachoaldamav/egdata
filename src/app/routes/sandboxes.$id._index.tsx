import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import cookie from 'cookie';
import { useCountry } from '~/hooks/use-country';
import { getQueryClient } from '~/lib/client';
import getCountryCode from '~/lib/get-country-code';
import { getImage } from '~/lib/getImage';
import { httpClient } from '~/lib/http-client';
import type { SingleOffer } from '~/types/single-offer';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const queryClient = getQueryClient();
  const url = new URL(request.url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  await queryClient.prefetchQuery({
    queryKey: ['sandbox:base', { id: params.id, country }],
    queryFn: () =>
      httpClient.get<SingleOffer>(`/sandboxes/${params.id}/base-game`, {
        params: {
          country,
        },
      }),
  });

  return {
    dehydratedState: dehydrate(queryClient),
    id: params.id,
  };
}

export async function clientLoader({ params }: LoaderFunctionArgs) {
  return {
    dehydratedState: dehydrate(getQueryClient()),
    id: params.id,
  };
}

export default function Index() {
  const { dehydratedState } = useLoaderData<typeof loader | typeof clientLoader>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <SandboxPage />
    </HydrationBoundary>
  );
}

function SandboxPage() {
  const { id } = useLoaderData<typeof loader | typeof clientLoader>();
  const { country } = useCountry();
  const { data: offer, isLoading } = useQuery({
    queryKey: ['sandbox:base', { id, country }],
    queryFn: () =>
      httpClient.get<SingleOffer>(`/sandboxes/${id}/base-game`, {
        params: {
          country,
        },
      }),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!offer) {
    return <div>Sandbox not found</div>;
  }

  return (
    <section
      className="relative w-full h-fit px-3 py-20 mx-4 rounded-xl"
      style={{
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundImage: `url(${
          getImage(offer.keyImages, [
            'DieselStoreFrontWide',
            'OfferImageWide',
            'DieselGameBoxWide',
            'TakeoverWide',
          ])?.url ?? '/placeholder.webp'
        })`,
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-[1.5px] rounded-xl" />
      <div className="relative container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white">
              {offer.title}
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl">{offer.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
