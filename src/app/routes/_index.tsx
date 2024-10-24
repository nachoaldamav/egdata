import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import type { FullTag } from '~/types/tags';
import type { GiveawayOffer } from '~/types/giveaways';
import { useLoaderData } from '@remix-run/react';
import { getQueryClient } from '~/lib/client';
import cookie from 'cookie';
import { useCookies } from 'react-cookie';
import { SalesModule } from '~/components/modules/sales';
import { ChangelistModule } from '~/components/modules/changelist';
import { UpcomingOffers } from '~/components/modules/upcoming';
import { StatsModule } from '~/components/modules/stats';
import { TopSection } from '~/components/modules/top-section';
import { FeaturedDiscounts } from '~/components/modules/featured-discounts';
import getCountryCode from '~/lib/get-country-code';
import { UpcomingCalendar } from '~/components/modules/upcoming-calendar';
import { GamesWithAchievements } from '~/components/modules/achievements-blade';
import { GiveawaysCarousel } from '~/components/modules/giveaways';
import { LatestOffers } from '~/components/modules/latest-offers';
import { LastModifiedGames } from '~/components/modules/last-modified-offers';
import { useState } from 'react';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getFeaturedDiscounts } from '~/queries/featured-discounts';
import { getTopSection } from '~/queries/top-section';
import { getLastModified } from '~/queries/last-modified';
import { httpClient } from '~/lib/http-client';
import { getLatestOffers } from '~/queries/latest-offers';
import { getLatestReleased } from '~/queries/latest-released';
import { LatestReleased } from '~/components/modules/latest-released';

type preferencesCookie = {
  order: string[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const queryClient = getQueryClient();
  const url = new URL(request.url);
  let cookieHeader = request.headers.get('Cookie');
  if (typeof cookieHeader !== 'string') {
    cookieHeader = '';
  }
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));
  const userPrefsCookie = cookie.parse(cookieHeader as string).EGDATA_USER_PREFS as string;
  const userPrefs = JSON.parse(userPrefsCookie || '{}') as preferencesCookie;

  const [eventsData] = await Promise.allSettled([
    queryClient.fetchQuery({
      queryKey: ['promotions'],
      queryFn: () =>
        httpClient.get<FullTag[]>('/promotions').catch((error) => {
          console.error('Failed to fetch events', error);
          return { data: [] as FullTag[] };
        }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['giveaways'],
      queryFn: () =>
        httpClient.get<GiveawayOffer[]>('/free-games', {
          params: {
            country,
          },
        }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['featuredDiscounts', { country }],
      queryFn: () => getFeaturedDiscounts({ country }),
      staleTime: 6000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['top-section', { slug: 'top-wishlisted' }],
      queryFn: () => getTopSection('top-wishlisted'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['top-section', { slug: 'top-sellers' }],
      queryFn: () => getTopSection('top-sellers'),
    }),
    queryClient.prefetchQuery({
      queryKey: ['last-modified-offers', { country }],
      queryFn: () => getLastModified(country),
    }),
    queryClient.prefetchQuery({
      queryKey: ['latest-games'],
      queryFn: () => getLatestOffers(country),
    }),
    queryClient.prefetchQuery({
      queryKey: ['latest-released', { country }],
      queryFn: () => getLatestReleased({ country }),
    }),
  ]);

  const events = eventsData.status === 'fulfilled' ? eventsData.value : [];
  const dehydratedState = dehydrate(queryClient);

  return {
    events: events as FullTag[],
    userPrefs: userPrefs,
    dehydratedState: dehydratedState,
  };
};

type LoaderData = ReturnType<typeof loader>;

const defaultOrder = [
  'featuredDiscounts',
  'giveaways',
  'latest',
  'latestReleased',
  'upcomingCalendar',
  'upcomingOffers',
  'lastModified',
  'topWishlisted',
  'achievements',
  'topSeller',
  'event1',
  'event2',
  'event3',
  'statsCombined',
];

export default function Index() {
  const [, setCookies] = useCookies(['EGDATA_USER_PREFS']);
  const { events, userPrefs, dehydratedState } = useLoaderData<LoaderData>();
  const [order, setOrder] = useState(userPrefs.order || defaultOrder);

  const sections = [
    {
      key: 'giveaways',
      component: <GiveawaysCarousel key={'giveaways'} />,
    },
    { key: 'latest', component: <LatestOffers key={'latest'} /> },
    { key: 'featuredDiscounts', component: <FeaturedDiscounts key={'featuredDiscounts'} /> },
    { key: 'lastModified', component: <LastModifiedGames key={'lastModified'} /> },
    { key: 'upcomingCalendar', component: <UpcomingCalendar key={'upcomingCalendar'} /> },
    { key: 'upcomingOffers', component: <UpcomingOffers key={'upcomingOffers'} /> },
    { key: 'latestReleased', component: <LatestReleased key={'latestReleased'} /> },
    {
      key: 'summerSale',
      component: <SalesModule key={'summerSale'} event="Summer Sale" eventId="16979" />,
    },
    {
      key: 'topWishlisted',
      component: (
        <TopSection
          key={'topWishlisted'}
          slug="top-wishlisted"
          title="Most Anticipated"
          side="right"
        />
      ),
    },
    { key: 'achievements', component: <GamesWithAchievements key={'achievements'} /> },
    {
      key: 'event1',
      component: <SalesModule key={'event1'} event={events[0].name} eventId={events[0].id} />,
    },
    {
      key: 'topSeller',
      component: <TopSection key={'topSeller'} slug="top-sellers" title="Top Seller" side="left" />,
    },
    {
      key: 'event3',
      component: <SalesModule key={'event3'} event={events[2].name} eventId={events[2].id} />,
    },
    {
      key: 'statsCombined',
      component: (
        <section
          key={'statsCombined'}
          className="w-full flex md:flex-row justify-between gap-10 flex-col"
        >
          <StatsModule />
          <ChangelistModule />
        </section>
      ),
    },
  ];

  const orderedSections = defaultOrder.map((key) =>
    sections.find((section) => section.key === key),
  );

  const handleOrderChange = (newOrder: string[]) => {
    setOrder(newOrder);
    const newCookie = { order: newOrder };
    setCookies('EGDATA_USER_PREFS', JSON.stringify(newCookie), { maxAge: 31_536_000 });
  };

  return (
    <HydrationBoundary state={dehydratedState}>
      <main className="flex flex-col items-center justify-start h-full gap-5 p-4">
        {orderedSections.map((section) => section?.component)}
      </main>
    </HydrationBoundary>
  );
}
