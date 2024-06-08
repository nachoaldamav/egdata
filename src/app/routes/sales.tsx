import { useLoaderData, Link } from '@remix-run/react';
import cookie from 'cookie';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { Image } from '~/components/app/image';
import type { SingleOffer } from '~/types/single-offer';
import type { LoaderFunctionArgs } from '@remix-run/node';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get('Cookie');
  const cookies = cookie.parse(cookieHeader || '');
  const country = cookies.EGDATA_COUNTRY || 'US';

  const [latestGames] = await Promise.all([
    client.get<{
      elements: SingleOffer[];
    }>(`/sales?limit=30&country=${country}`),
  ]);

  const games = latestGames.data.elements || ([] as SingleOffer[]);

  return { games };
};

export default function Index() {
  const { games } = useLoaderData<typeof loader>();

  return (
    <main className="flex flex-col items-center justify-start h-full space-y-4 p-4">
      <section className="flex flex-col gap-4">
        <h4 className="text-2xl font-bold text-left">Current Sales</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </main>
  );
}

function GameCard({ game }: { game: SingleOffer }) {
  const fmt = Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: game.price.currency,
  });
  return (
    <Link to={`/offers/${game.id}`} prefetch="viewport">
      <Card className="rounded-xl shadow-lg h-full flex flex-col">
        <CardHeader className="p-0 rounded-t-xl">
          <Image
            src={getImage(game.keyImages, ['Thumbnail']).url}
            alt={game.title}
            width={400}
            height={500}
            className="object-contain rounded-t-xl"
            loading="lazy"
          />
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold max-w-xs truncate">
              {game.title}
            </h3>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2 h-full">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {game.seller.name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 line-through dark:text-gray-400">
                {fmt.format(game.price.totalPrice.originalPrice / 100)}
              </span>
              <span className="text-primary font-semibold">
                {fmt.format(game.price.totalPrice.discountPrice / 100)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
