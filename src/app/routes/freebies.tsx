import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { dehydrate, HydrationBoundary, keepPreviousData, useQuery } from '@tanstack/react-query';
import { getQueryClient } from '~/lib/client';
import getCountryCode from '~/lib/get-country-code';
import { httpClient } from '~/lib/http-client';
import cookie from 'cookie';
import type { SingleOffer } from '~/types/single-offer';
import { OfferCard } from '~/components/app/offer-card';
import { useCountry } from '~/hooks/use-country';
import { useState } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationPreviousButton,
  PaginationButton,
  PaginationNextButton,
} from '~/components/ui/pagination';
import { GiveawaysCarousel } from '~/components/modules/giveaways';
import { Separator } from '~/components/ui/separator';

export const meta: MetaFunction = () => {
  return [
    {
      title: 'Free Games - egdata.app',
    },
    {
      name: 'description',
      content: 'Checkout free games on egdata.app.',
    },
    {
      name: 'og:image',
      content: 'https://egdata.app/300x150-egdata-placeholder.png',
    },
    {
      name: 'twitter:image',
      content: 'https://egdata.app/300x150-egdata-placeholder.png',
    },
    {
      name: 'og:title',
      content: 'Free Games - egdata.app',
    },
    {
      name: 'og:description',
      content: 'Checkout free games on egdata.app.',
    },
    {
      name: 'twitter:title',
      content: 'Free Games - egdata.app',
    },
    {
      name: 'twitter:description',
      content: 'Checkout free games on egdata.app.',
    },
  ];
};

interface OfferWithGiveaway extends SingleOffer {
  giveaway: unknown;
}

const getHistoricalGiveaways = async (page: number, limit: number, country: string) => {
  const res = await httpClient.get<OfferWithGiveaway[]>('/free-games/history', {
    params: {
      country: country,
      page: page,
      limit: limit,
    },
  });

  return res;
};

export const loader: LoaderFunction = async ({ request }) => {
  const client = getQueryClient();
  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get('page') ?? '1');
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  await client.prefetchQuery({
    queryKey: ['giveaways-history', { page, limit: 25, country }],
    queryFn: () => getHistoricalGiveaways(page, 25, country),
  });

  return {
    dehydratedState: dehydrate(client),
    page,
  };
};

export default function Index() {
  const { dehydratedState } = useLoaderData<typeof loader>();
  return (
    <HydrationBoundary state={dehydratedState}>
      <FreeGames />
    </HydrationBoundary>
  );
}

function FreeGames() {
  const { page: serverPage } = useLoaderData<typeof loader>();
  const [page, setPage] = useState(serverPage);
  const { country } = useCountry();
  const { data, isLoading } = useQuery({
    queryKey: ['giveaways-history', { page, limit: 25, country }],
    queryFn: () => getHistoricalGiveaways(page, 25, country),
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!data) {
    return <p>No data</p>;
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update the URL with the new page number
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    window.history.pushState(null, '', url.href);
  };

  return (
    <div className="flex flex-col items-start justify-start h-full gap-4 p-4">
      <h1 className="text-2xl font-bold mb-4">Free Games</h1>
      <GiveawaysCarousel hideTitle={true} />
      <Separator orientation="horizontal" className="my-4" />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 mt-4">
        {data?.map((game) => (
          <OfferCard key={game.id} offer={game} size="md" />
        ))}
      </section>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPreviousButton
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            />
          </PaginationItem>
          {/** If not the first page, show the first page number */}
          {page > 1 && (
            <PaginationItem>
              <PaginationButton onClick={() => handlePageChange(1)}>1</PaginationButton>
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationLink to="#" isActive>
              {page}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNextButton onClick={() => handlePageChange(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
