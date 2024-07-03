import type { MetaFunction } from '@remix-run/node';
import type { FullTag } from '~/types/tags';
import { Link, useLoaderData } from '@remix-run/react';
import { Image } from '~/components/app/image';
import { Card, CardContent } from '~/components/ui/card';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import type { SingleOffer } from '~/types/single-offer';
import { useEffect, useState } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { SalesModule } from '~/components/modules/sales';
import { ChangelistModule } from '~/components/modules/changelist';
import { FeaturedModule } from '~/components/modules/featured';

export interface Game {
  id: string;
  namespace: string;
  title: string;
  description: string;
  lastModifiedDate: string;
  effectiveDate: string;
  creationDate: string;
  keyImages: KeyImage[];
  productSlug: string | null;
  urlSlug: string;
  url: unknown;
  tags: string[];
  releaseDate: string;
  pcReleaseDate: string | null;
  prePurchase: boolean | null;
  developerDisplayName: string | null;
  publisherDisplayName: string | null;
  seller: string;
}

export interface KeyImage {
  type: string;
  url: string;
  md5: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: 'egdata.app' },
    {
      name: 'description',
      content:
        'Epic Games database with all the information you need about the games, items, and events.',
    },
    {
      name: 'keywords',
      content:
        'epic games, fortnite, database, api, epic games api, egdata, epic games store, egstore, epic online services, eos',
    },
  ];
};

export const loader = async () => {
  const [latestGames, featuredGames, eventsData] = await Promise.allSettled([
    client.get<Game[]>('/latest-games').catch((error) => {
      console.error('Failed to fetch latest games', error);
      return { data: [] as Game[] };
    }),
    client.get<SingleOffer[]>('/featured').catch((error) => {
      console.error('Failed to fetch featured game', error);
      return { data: null };
    }),
    client.get<FullTag[]>('/promotions').catch((error) => {
      console.error('Failed to fetch events', error);
      return { data: [] as FullTag[] };
    }),
  ]);

  const games = latestGames.status === 'fulfilled' ? latestGames.value.data : [];
  const featured = featuredGames.status === 'fulfilled' ? featuredGames.value.data : null;
  const events = eventsData.status === 'fulfilled' ? eventsData.value.data : [];

  return { games, featured, events };
};

export default function Index() {
  const { games, featured, events } = useLoaderData<typeof loader>();
  return (
    <main className="flex flex-col items-center justify-start h-full space-y-4 p-4">
      <FeaturedModule offers={featured} />
      <section className="w-full" id="latest-games">
        <h4 className="text-xl font-bold text-left">Latest Games</h4>
        <Carousel className="mt-2 h-full p-4">
          <CarouselPrevious />
          <CarouselContent>
            {games.map((game) => (
              <GameCard game={game} key={game.id} />
            ))}
          </CarouselContent>
          <CarouselNext />
        </Carousel>
      </section>
      <LastModifiedGames />
      <ChangelistModule />
      {events.map((event) => (
        <SalesModule key={event.id} event={event.name} eventId={event.id} />
      ))}
    </main>
  );
}

function GameSeller({
  developerDisplayName,
  publisherDisplayName,
  seller,
}: {
  developerDisplayName: string | undefined;
  publisherDisplayName: string | undefined;
  seller: string;
}) {
  if (!developerDisplayName && !publisherDisplayName) {
    return <p>{seller}</p>;
  }

  return (
    <>
      {developerDisplayName === publisherDisplayName ? (
        <p>{developerDisplayName}</p>
      ) : (
        <p>
          {developerDisplayName} - {publisherDisplayName}
        </p>
      )}
    </>
  );
}

function LastModifiedGames() {
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState<SingleOffer[]>([]);

  useEffect(() => {
    client
      .get<{
        elements: SingleOffer[];
      }>('/offers?limit=25')
      .then((response) => {
        setGames(response.data.elements);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <section className="w-full" id="last-modified-offers">
      <h4 className="text-xl font-bold text-left">Last Modified Offers</h4>
      <Carousel className="mt-2 p-4">
        <CarouselPrevious />
        <CarouselContent className="items-center">
          {loading &&
            games.length === 0 &&
            [...Array(25)].map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: This is a skeleton loader
              <CarouselItem key={index} className="basis-1/4">
                <Skeleton className="w-80 h-96" />
              </CarouselItem>
            ))}
          {games.map((game) => (
            <GameCard game={game} key={game.id} />
          ))}
        </CarouselContent>
        <CarouselNext />
      </Carousel>
    </section>
  );
}

function GameCard({
  game,
}: {
  game: Pick<
    Game,
    'id' | 'keyImages' | 'title' | 'seller' | 'developerDisplayName' | 'publisherDisplayName'
  >;
}) {
  return (
    <CarouselItem key={game.id} className="basis-1/1 lg:basis-1/4">
      <Link to={`/offers/${game.id}`} className="w-96 relative select-none" prefetch="viewport">
        <Card className="w-72 lg:max-w-sm rounded-lg overflow-hidden shadow-lg">
          <Image
            src={getImage(game.keyImages, ['Thumbnail'])?.url}
            alt={game.title}
            width={400}
            height={500}
            className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300"
          />
          <CardContent className="p-4 flex-grow flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold max-w-xs truncate">{game.title}</h3>
            </div>
            <div className="mt-2 flex items-end justify-between gap-2 h-full max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
              <GameSeller
                developerDisplayName={game.developerDisplayName as string}
                publisherDisplayName={game.publisherDisplayName as string}
                seller={typeof game.seller === 'string' ? game.seller : (game.seller as any).name}
              />
            </div>
          </CardContent>
        </Card>
      </Link>
    </CarouselItem>
  );
}
