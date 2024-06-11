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

export interface Game {
  id: string;
  namespace: string;
  title: string;
  description: string;
  lastModifiedDate: string;
  effectiveDate: string;
  creationDate: string;
  keyImages: KeyImage[];
  productSlug?: string;
  urlSlug: string;
  url: unknown;
  tags: string[];
  releaseDate: string;
  pcReleaseDate?: string;
  prePurchase?: boolean;
  developerDisplayName?: string;
  publisherDisplayName?: string;
  seller: string;
}

interface FeaturedGame {
  id: string;
  namespace: string;
  title: string;
  description: string;
  lastModifiedDate: string;
  effectiveDate: string;
  creationDate: string;
  keyImages: KeyImage[];
  productSlug: string | null;
  urlSlug: string | null;
  url: string | null;
  tags: {
    id: string;
    name: string;
  }[];
  releaseDate: string;
  pcReleaseDate?: string;
  prePurchase?: boolean;
  developerDisplayName?: string;
  publisherDisplayName?: string;
  seller: {
    id: string;
    name: string;
  };
}

export interface KeyImage {
  type: string;
  url: string;
  md5: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: 'EGData' },
    { name: 'description', content: 'Epic Games database' },
  ];
};

export const loader = async () => {
  const [latestGames, featuredGame, eventsData] = await Promise.all([
    client.get<Game[]>('/latest-games'),
    client.get<FeaturedGame>('/featured'),
    client.get<FullTag[]>('/promotions'),
  ]);

  const games = latestGames.data;
  const featured = featuredGame.data;
  const events = eventsData.data;

  return { games, featured, events };
};

export default function Index() {
  const { games, featured, events } = useLoaderData<typeof loader>();
  return (
    <main className="flex flex-col items-center justify-start h-full space-y-4 p-4">
      <FeaturedGame game={featured} />
      <section className="w-full" id="latest-games">
        <h4 className="text-xl font-bold text-left">Latest Games</h4>
        <Carousel className="mt-2 h-full p-4">
          <CarouselPrevious />
          <CarouselContent>
            {games.map((game) => (
              <CarouselItem key={game.id} className="basis-1/4">
                <Link
                  to={`/offers/${game.id}`}
                  className="h-auto w-80 relative select-none"
                  prefetch="viewport"
                >
                  <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={getImage(game.keyImages, ['Thumbnail']).url}
                      alt={game.title}
                      width={400}
                      height={500}
                      className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">{game.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          <GameSeller
                            developerDisplayName={game.developerDisplayName}
                            publisherDisplayName={game.publisherDisplayName}
                            seller={game.seller}
                          />
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext />
        </Carousel>
      </section>
      <LastModifiedGames />
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

function FeaturedGame({ game }: { game: FeaturedGame }) {
  return (
    <section
      id="featured-game"
      className="shadow-md rounded px-3 pt-6 pb-8 mb-4 w-full"
    >
      <h2 className="text-xl font-bold mb-4">Featured Game</h2>
      <div className="flex flex-row gap-10">
        <div className="flex flex-col w-2/3 relative">
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="flex flex-row gap-2 absolute top-4 left-4">
              {game.tags
                .filter((tag) => tag !== null)
                .slice(0, 3)
                .map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-gray-800 bg-opacity-50 text-white px-2 py-1 rounded-md backdrop-blur"
                  >
                    {tag.name}
                  </span>
                ))}
            </div>
          </div>
          <Image
            src={
              getImage(game.keyImages, [
                'OfferImageWide',
                'DieselStoreFrontWide',
                'featuredMedia',
              ]).url
            }
            alt={game.title}
            width={1920}
            height={1080}
            quality={75}
            className="w-full h-[450px] object-cover rounded-xl"
          />
        </div>
        <div className="flex flex-col w-1/3 justify-between">
          <div className="flex flex-col gap-2">
            <div className="inline-block">
              <h3 className="text-2xl font-bold">{game.title}</h3>
              <span className="text-sm text-gray-500">
                {game.seller.name || ''}
              </span>
            </div>
            <p className="text-sm">{game.description}</p>
          </div>
          <div className="flex flex-col gap-2 font-extrabold">
            <Link
              to={`/offers/${game.id}`}
              prefetch="intent"
              className="hover:bg-transparent border border-gray-800 bg-gray-800 inline-block px-4 py-2 rounded-md text-center transition-all duration-300 ease-in-out text-white"
            >
              View Game
            </Link>
          </div>
        </div>
      </div>
    </section>
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
    <section className="w-full h-full" id="last-modified-offers">
      <h4 className="text-xl font-bold text-left">Last Modified Offers</h4>
      <Carousel className="mt-2 h-full p-4">
        <CarouselPrevious />
        <CarouselContent>
          {loading &&
            games.length === 0 &&
            [...Array(25)].map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: This is a skeleton loader
              <CarouselItem key={index} className="basis-1/4">
                <Skeleton className="w-80 h-96" />
              </CarouselItem>
            ))}
          {games.map((game) => (
            <CarouselItem key={game.id} className="basis-1/4">
              <Link
                to={`/offers/${game.id}`}
                className="h-auto w-80 relative select-none"
                prefetch="viewport"
              >
                <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={
                      getImage(game.keyImages, ['Thumbnail'])?.url ||
                      'https://via.placeholder.com/400x500'
                    }
                    alt={game.title}
                    width={400}
                    height={500}
                    className="w-full h-96 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{game.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        <GameSeller
                          developerDisplayName={
                            game.developerDisplayName as string
                          }
                          publisherDisplayName={
                            game.publisherDisplayName as string
                          }
                          seller={game.seller.name}
                        />
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNext />
      </Carousel>
    </section>
  );
}
