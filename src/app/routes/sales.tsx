import { useLoaderData, Link } from '@remix-run/react';
import { redirect } from '@remix-run/node';
import cookie from 'cookie';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '~/components/ui/pagination';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { Image } from '~/components/app/image';
import type { SingleOffer } from '~/types/single-offer';
import type { LoaderFunctionArgs } from '@remix-run/node';
import type { SingleOfferWithPrice } from '~/types/single-offer-price';
import { useCountry } from '~/hooks/use-country';
import { useEffect, useState } from 'react';
import getPagingPage from '~/lib/get-paging-page';
import getCountryCode from '~/lib/get-country-code';

function checkCountryCode(country: string) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(country);
  } catch (e) {
    return false;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const page = getPagingPage(url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  // Check if the country is a valid ISO code using Intl API
  if (!checkCountryCode(country)) {
    console.warn(`Invalid country code: ${country}`);
    return redirect('/sales?country=US', 302);
  }

  const [latestGames] = await Promise.all([
    client.get<{
      elements: SingleOfferWithPrice[];
      page: number;
      total: number;
      limit: number;
    }>(`/sales?limit=32&country=${country}&page=${page}`),
  ]);

  const games = latestGames.data.elements || ([] as SingleOffer[]);

  return {
    games,
    meta: {
      page: latestGames.data.page,
      total: latestGames.data.total,
      limit: latestGames.data.limit,
    },
    country,
  };
};

export default function Index() {
  const { games, meta, country } = useLoaderData<typeof loader>();
  const [userSelectedCountry] = useState<string>(country);
  const { country: userCountry } = useCountry();
  const { page, total, limit } = meta;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    if (userSelectedCountry !== userCountry) {
      const url = new URL(window.location.href);

      url.searchParams.set('country', userCountry);

      window.location.href = url.href;
    }
  }, [userCountry, userSelectedCountry]);

  const getPaginationItems = () => {
    const items = [];
    const startPage = Math.max(page - 2, 1);
    const endPage = Math.min(page + 2, totalPages);

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink to={'?page=1'} prefetch="render">
            1
          </PaginationLink>
        </PaginationItem>,
      );
      if (startPage > 2) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          {i === page ? (
            <PaginationLink to={`?page=${i}`} isActive>
              {i}
            </PaginationLink>
          ) : (
            <PaginationLink to={`?page=${i}`} prefetch="render">
              {i}
            </PaginationLink>
          )}
        </PaginationItem>,
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink to={`?page=${totalPages}`} prefetch="render">
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <main className="flex flex-col items-center justify-start h-full space-y-4 p-4">
      <section className="flex flex-col gap-4">
        <h4 className="text-2xl font-bold text-left">Current Sales</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {games
            .filter((game) => game.id)
            .map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
        </div>
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious to={`?page=${page - 1}&country=${userCountry}`} />
              </PaginationItem>
            )}
            {getPaginationItems()}
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext to={`?page=${page + 1}&country=${userCountry}`} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </section>
    </main>
  );
}

function GameCard({ game }: { game: SingleOfferWithPrice }) {
  const fmt = Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: game.price.lastPrice.currencyCode,
  });

  return (
    <Link to={`/offers/${game.id}`} prefetch="viewport">
      <Card className="rounded-xl shadow-lg h-full flex flex-col">
        <CardHeader className="p-0 rounded-t-xl">
          <Image
            src={
              getImage(game.keyImages, ['OfferImageTall', 'Thumbnail'])?.url ||
              'https://via.placeholder.com/400x500'
            }
            alt={game.title}
            width={400}
            height={500}
            className="object-contain rounded-t-xl"
            loading="lazy"
          />
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold max-w-xs truncate">{game.title}</h3>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2 h-full">
            <span className="text-sm text-gray-600 dark:text-gray-400">{game.seller.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 line-through dark:text-gray-400">
                {fmt.format(game.price.lastPrice.originalPrice / 100)}
              </span>
              <span className="text-primary font-semibold">
                {fmt.format(game.price.lastPrice.discountPrice / 100)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
