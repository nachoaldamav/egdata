import { useLoaderData, redirect } from '@remix-run/react';
import { getQueryClient } from '~/lib/client';
import type { LoaderFunction } from '@remix-run/node';
import cookie from 'cookie';
import getCountryCode from '~/lib/get-country-code';
import { dehydrate, HydrationBoundary, useInfiniteQuery } from '@tanstack/react-query';
import { useCountry } from '~/hooks/use-country';
import { OfferCard } from '~/components/app/offer-card';
import { Button } from '~/components/ui/button';
import { getImage } from '~/lib/getImage';
import { getCollection, type Collections } from '~/queries/collection';

export const loader: LoaderFunction = async ({ params, request }) => {
  const queryClient = getQueryClient();
  const slug = params.slug;
  const url = new URL(request.url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  if (!slug) {
    return redirect('/');
  }

  await queryClient.prefetchInfiniteQuery({
    queryKey: [
      'collection',
      {
        slug,
        country,
        limit: 20,
      },
    ],
    queryFn: ({ pageParam }) =>
      getCollection({
        slug,
        limit: 20,
        page: pageParam as number,
        country,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: Collections, allPages: Collections[]) => {
      if (lastPage.page * lastPage.limit + 20 > lastPage.total) {
        return undefined;
      }

      return allPages?.length + 1;
    },
  });

  return {
    dehydratedState: dehydrate(queryClient),
    slug,
  };
};

export default function Index() {
  const { dehydratedState, slug } = useLoaderData<typeof loader>();
  return (
    <HydrationBoundary state={dehydratedState}>
      <Collection slug={slug} />
    </HydrationBoundary>
  );
}

function Collection({
  slug,
}: {
  slug: string;
}) {
  const { country } = useCountry();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['collection', { slug, country, limit: 20 }],
    queryFn: ({ pageParam }) =>
      getCollection({
        slug,
        limit: 20,
        page: pageParam as number,
        country,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: Collections, allPages: Collections[]) => {
      if (lastPage.page * lastPage.limit + 20 > lastPage.total) {
        return undefined;
      }

      return allPages?.length + 1;
    },
  });

  if (isLoading) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center gap-4 min-h-screen">
        <div className="relative h-96 overflow-hidden rounded-2xl flex items-center bg-cover bg-center w-full">
          <div className="h-full w-full flex flex-col justify-center items-start text-white p-8 bg-gradient-to-r from-black/80 to-black/30">
            <h1 className="text-5xl font-bold">Loading...</h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex flex-col items-center justify-center gap-4">
      <div
        className="relative h-96 overflow-hidden rounded-2xl flex items-center bg-cover bg-center w-full"
        style={{
          backgroundImage: `url(${
            getImage(data?.pages[0]?.elements[0]?.keyImages ?? [], [
              'OfferImageWide',
              'featuredMedia',
              'DieselGameBoxWide',
              'DieselStoreFrontWide',
            ])?.url ?? '/placeholder.webp'
          })`,
        }}
      >
        <div className="h-full w-full flex flex-col justify-center items-start text-white p-8 bg-gradient-to-r from-black/80 to-black/30">
          <h1 className="text-5xl font-bold">{data?.pages[0]?.title}</h1>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {data?.pages
          .flatMap((page) => page.elements)
          .map((game) => (
            <OfferCard offer={game} key={game.id} size="md" />
          ))}
      </div>
      <div className="flex justify-center mt-8">
        <Button disabled={!hasNextPage} onClick={() => fetchNextPage()}>
          {isFetchingNextPage && (
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          Load More
        </Button>
      </div>
    </main>
  );
}
