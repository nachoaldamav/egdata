import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import type { ClientLoaderFunctionArgs } from '@remix-run/react';
import type { FullTag } from '~/types/tags';
import { Link, useLoaderData } from '@remix-run/react';
import { client, getQueryClient } from '~/lib/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import type { SingleOffer } from '~/types/single-offer';
import type { GiveawayOffer } from '~/types/giveaways';
import cookie from 'cookie';
import { Skeleton } from '~/components/ui/skeleton';
import { SalesModule } from '~/components/modules/sales';
import { ChangelistModule } from '~/components/modules/changelist';
import { FeaturedModule } from '~/components/modules/featured';
import { UpcomingOffers } from '~/components/modules/upcoming';
import { ArrowRightIcon } from '@radix-ui/react-icons';
import { StatsModule } from '~/components/modules/stats';
import { TopSection } from '~/components/modules/top-section';
import { FeaturedDiscounts } from '~/components/modules/featured-discounts';
import { OfferCard } from '~/components/app/offer-card';
import getCountryCode from '~/lib/get-country-code';
import { useCountry } from '~/hooks/use-country';
import { useQuery } from '@tanstack/react-query';
import { UpcomingCalendar } from '~/components/modules/upcoming-calendar';
import { GamesWithAchievements } from '~/components/modules/achievements-blade';
import { GiveawaysCarousel } from '~/components/modules/giveaways';

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const queryClient = getQueryClient();
  const url = new URL(request.url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  const [latestGames, featuredGames, eventsData, giveawaysData] = await Promise.allSettled([
    queryClient.fetchQuery({
      queryKey: ['latest-games'],
      queryFn: () =>
        client
          .get<SingleOffer[]>('/latest-games', {
            params: {
              country,
            },
          })
          .catch((error) => {
            console.error('Failed to fetch latest games', error);
            return { data: [] as SingleOffer[] };
          }),
    }),
    queryClient.fetchQuery({
      queryKey: ['featured'],
      queryFn: () =>
        client
          .get<SingleOffer[]>('/featured', {
            params: {
              country,
            },
          })
          .catch((error) => {
            console.error('Failed to fetch featured game', error);
            return { data: [] };
          }),
    }),
    queryClient.fetchQuery({
      queryKey: ['promotions'],
      queryFn: () =>
        client.get<FullTag[]>('/promotions').catch((error) => {
          console.error('Failed to fetch events', error);
          return { data: [] as FullTag[] };
        }),
    }),
    queryClient.fetchQuery({
      queryKey: ['giveaways'],
      queryFn: () =>
        client
          .get<GiveawayOffer[]>('/free-games', {
            params: {
              country,
            },
          })
          .then((res) => res.data)
          .catch((error) => {
            console.error('Failed to fetch giveaways', error);
            return [] as GiveawayOffer[];
          }),
    }),
  ]);

  const games = latestGames.status === 'fulfilled' ? latestGames.value.data : [];
  const featured = featuredGames.status === 'fulfilled' ? featuredGames.value.data : [];
  const events = eventsData.status === 'fulfilled' ? eventsData.value.data : [];
  const giveaways = giveawaysData.status === 'fulfilled' ? giveawaysData.value : [];

  return {
    games,
    featured,
    events,
    giveaways,
  };
};

export const clientLoader = async ({ request }: ClientLoaderFunctionArgs) => {
  const queryClient = getQueryClient();
  const url = new URL(request.url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  const [latestGames, featuredGames, eventsData, giveawaysData] = await Promise.allSettled([
    queryClient.fetchQuery({
      queryKey: ['latest-games'],
      queryFn: () =>
        client
          .get<SingleOffer[]>('/latest-games', {
            params: {
              country,
            },
          })
          .catch((error) => {
            console.error('Failed to fetch latest games', error);
            return { data: [] as SingleOffer[] };
          }),
    }),
    queryClient.fetchQuery({
      queryKey: ['featured'],
      queryFn: () =>
        client
          .get<SingleOffer[]>('/featured', {
            params: {
              country,
            },
          })
          .catch((error) => {
            console.error('Failed to fetch featured game', error);
            return { data: [] };
          }),
    }),
    queryClient.fetchQuery({
      queryKey: ['promotions'],
      queryFn: () =>
        client.get<FullTag[]>('/promotions').catch((error) => {
          console.error('Failed to fetch events', error);
          return { data: [] as FullTag[] };
        }),
    }),
    queryClient.fetchQuery({
      queryKey: ['giveaways'],
      queryFn: () =>
        client
          .get<GiveawayOffer[]>('/free-games', {
            params: {
              country,
            },
          })
          .then((res) => res.data)
          .catch((error) => {
            console.error('Failed to fetch giveaways', error);
            return [] as GiveawayOffer[];
          }),
    }),
  ]);

  const games = latestGames.status === 'fulfilled' ? latestGames.value.data : [];
  const featured = featuredGames.status === 'fulfilled' ? featuredGames.value.data : [];
  const events = eventsData.status === 'fulfilled' ? eventsData.value.data : [];
  const giveaways = giveawaysData.status === 'fulfilled' ? giveawaysData.value : [];

  return {
    games,
    featured,
    events,
    giveaways,
  };
};

type LoaderData = ReturnType<typeof loader | typeof clientLoader>;

export default function Index() {
  const { games, featured, events, giveaways } = useLoaderData<LoaderData>();
  return (
    <main className="flex flex-col items-center justify-start h-full space-y-4 p-4">
      <FeaturedModule offers={featured} />
      <GiveawaysCarousel initialData={giveaways} />
      <section className="w-full pt-4" id="latest-games">
        <h4 className="text-xl font-bold text-left">Latest Offers</h4>
        <Carousel className="mt-2 h-full p-4">
          <CarouselPrevious />
          <CarouselContent>
            {games.map((game) => (
              <CarouselItem key={game.id} className="basis-1/1 lg:basis-1/5">
                <OfferCard offer={game} key={game.id} size="md" />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselNext />
        </Carousel>
      </section>
      <FeaturedDiscounts />
      <LastModifiedGames />
      <UpcomingCalendar />
      <UpcomingOffers />
      <SalesModule event="Summer Sale" eventId="16979" />
      <section className="w-full flex flex-row justify-between gap-10">
        <StatsModule />
        <ChangelistModule />
      </section>
      <SalesModule event={events[0].name} eventId={events[0].id} />
      <TopSection slug="top-wishlisted" title="Most Anticipated" side="right" />
      <GamesWithAchievements />
      <SalesModule event={events[1].name} eventId={events[1].id} />
      <SalesModule event={events[2].name} eventId={events[2].id} />
    </main>
  );
}

function LastModifiedGames() {
  const { country } = useCountry();
  const { data: games, isLoading: loading } = useQuery({
    queryKey: ['last-modified-offers'],
    queryFn: () =>
      client
        .get<{ elements: SingleOffer[] }>('/offers?limit=25', {
          params: {
            country,
          },
        })
        .then((res) => res.data.elements),
  });

  return (
    <section className="w-full" id="last-modified-offers">
      <Link
        to="/search?hash=2e4d602536b02a6e8aeb7fde4e865606"
        className="text-xl font-bold text-left inline-flex group items-center gap-2"
      >
        Last Modified Offers
        <ArrowRightIcon className="w-6 h-6 inline-block group-hover:translate-x-1 transition-transform duration-300 ease-in-out" />
      </Link>
      <Carousel className="mt-2 p-4">
        <CarouselPrevious />
        <CarouselContent className="items-center">
          {(loading || !games) &&
            [...Array(25)].map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: This is a skeleton loader
              <CarouselItem key={index} className="basis-1/5">
                <Skeleton className="w-80 h-96" />
              </CarouselItem>
            ))}
          {!loading &&
            games &&
            games.map((game) => (
              <CarouselItem key={game.id} className="basis-1/1 lg:basis-1/5">
                <OfferCard offer={game} key={game.id} size="md" />
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselNext />
      </Carousel>
    </section>
  );
}
