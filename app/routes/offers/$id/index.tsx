import type * as React from 'react';
import { useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import {
  dehydrate,
  HydrationBoundary,
  useQueries,
} from '@tanstack/react-query';
import { httpClient } from '@/lib/http-client';
import type { SingleOffer, Tag } from '@/types/single-offer';
import type { SingleSandbox } from '@/types/single-sandbox';
import type { AchievementSet } from '@/queries/offer-achievements';
import { useCountry } from '@/hooks/use-country';
import { calculatePrice } from '@/lib/calculate-price';
import type { Price } from '@/types/price';
import { cn } from '@/lib/utils';
import type { Hltb } from '@/types/hltb';

export const Route = createFileRoute('/offers/$id/')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <RouteComponent />
      </HydrationBoundary>
    );
  },

  loader: async ({ params, context }) => {
    const { id } = params;
    const { country, queryClient } = context;

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['offer', 'genres', { id }],
        queryFn: () => httpClient.get<Tag[]>(`/offers/${id}/genres`),
      }),
      queryClient.prefetchQuery({
        queryKey: ['price-stats', { id, country }],
        queryFn: () =>
          httpClient.get<{
            current: Price | null;
            lowest: Price | null;
            lastDiscount: Price | null;
          }>(`/offers/${id}/price-stats`, {
            params: { country },
          }),
      }),
      queryClient.prefetchQuery({
        queryKey: ['offer', 'age-rating', { id, country }],
        queryFn: () =>
          httpClient.get<SingleSandbox['ageGatings']>(
            `/offers/${id}/age-rating`,
            {
              params: { country, single: true },
            },
          ),
      }),
      queryClient.prefetchQuery({
        queryKey: ['offer', 'hltb', { id }],
        queryFn: () => httpClient.get<Hltb>(`/offers/${id}/hltb`),
      }),
      queryClient.prefetchQuery({
        queryKey: ['offer', 'giveaways', { id }],
        queryFn: () =>
          httpClient.get<
            {
              _id: string;
              id: string;
              namespace: string;
              startDate: string;
              endDate: string;
            }[]
          >(`/offers/${id}/giveaways`),
      }),
    ]);

    return {
      id,
      dehydratedState: dehydrate(queryClient),
      country,
    };
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { country } = useCountry();
  const [
    offerQuery,
    genresQuery,
    priceQuery,
    ageRatingQuery,
    achievementsQuery,
    giveawaysQuery,
    hltbQuery,
  ] = useQueries({
    queries: [
      {
        queryKey: ['offer', { id }],
        queryFn: () => httpClient.get<SingleOffer>(`/offers/${id}`),
      },
      {
        queryKey: ['offer', 'genres', { id }],
        queryFn: () => httpClient.get<Tag[]>(`/offers/${id}/genres`),
      },
      {
        queryKey: ['price-stats', { id, country }],
        queryFn: () =>
          httpClient.get<{
            current: Price | null;
            lowest: Price | null;
            lastDiscount: Price | null;
          }>(`/offers/${id}/price-stats`, {
            params: { country },
          }),
      },
      {
        queryKey: ['offer', 'age-rating', { id, country }],
        queryFn: () =>
          httpClient.get<SingleSandbox['ageGatings']>(
            `/offers/${id}/age-rating`,
            {
              params: { country, single: true },
            },
          ),
      },
      {
        queryKey: ['offer', 'achievements', { id }],
        queryFn: () =>
          httpClient.get<AchievementSet[]>(`/offers/${id}/achievements`),
      },
      {
        queryKey: ['offer', 'giveaways', { id }],
        queryFn: () =>
          httpClient.get<
            {
              _id: string;
              id: string;
              namespace: string;
              startDate: string;
              endDate: string;
            }[]
          >(`/offers/${id}/giveaways`),
      },
      {
        queryKey: ['offer', 'hltb', { id }],
        queryFn: () => httpClient.get<Hltb>(`/offers/${id}/hltb`),
      },
    ],
  });

  const { data: offer } = offerQuery;
  const { data: genres } = genresQuery;
  const { data: price } = priceQuery;
  const { data: ageRating } = ageRatingQuery;
  const { data: achievements } = achievementsQuery;
  const { data: giveaways } = giveawaysQuery;
  const { data: hltb } = hltbQuery;

  if (!offer) {
    return null;
  }

  return (
    <div className="flex flex-col items-start justify-start h-full gap-1 px-4 w-full">
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 mt-4 w-full">
        <OverviewColumn>
          <OverviewSection title="Genres">
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="flex flex-row items-center justify-center gap-4">
                  {genres?.map((genre) => (
                    <Link
                      key={genre.id}
                      className="inline-flex items-center gap-1 text-sm font-medium text-white bg-white/15 px-3 py-1 rounded-md hover:bg-white/5 transition-colors duration-200 ease-in-out"
                      to="/search"
                      search={{
                        tags: genre.id,
                      }}
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </OverviewSection>
          <OverviewSection title="Age Rating">
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="flex flex-row items-center justify-center gap-4">
                  <div className="bg-background rounded-lg p-4 w-fit max-w-72">
                    {Object.entries(ageRating || {}).map(([key, rating]) => (
                      <div className="flex flex-row gap-2" key={key}>
                        {rating.ratingImage && rating.ratingImage !== '' ? (
                          <img
                            key={key}
                            src={rating.ratingImage}
                            alt={key}
                            title={`${rating.title} - ${rating.gameRating}`}
                            className="size-14 mx-auto"
                          />
                        ) : (
                          <div className="size-20 mx-auto inline-flex items-center justify-center bg-gray-900 rounded-lg">
                            <span className="text-6xl font-bold">
                              {rating.ageControl}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <span className="text-base text-left font-bold">
                            {rating.ratingSystem} {rating.ageControl}
                          </span>
                          <span className="text-xs text-left text-gray-300">
                            {rating.descriptor?.split(',').join(', ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </OverviewSection>
          <OverviewSection title="Giveaways">
            <Card className="w-full">
              <CardContent className="p-9">
                <div className="flex flex-row items-center justify-center gap-4">
                  {giveaways?.length === 0 && (
                    <div className="text-center">No giveaways found</div>
                  )}
                  {giveaways?.map((giveaway) => (
                    <div key={giveaway._id} className="flex flex-row gap-2">
                      <span>
                        {new Date(giveaway.startDate).toLocaleDateString(
                          'en-UK',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </span>
                      <span>-</span>
                      <span>
                        {new Date(giveaway.endDate).toLocaleDateString(
                          'en-UK',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </OverviewSection>
        </OverviewColumn>
        <OverviewColumn>
          <OverviewSection title="Price">
            <Card className="w-full bg-card text-white p-4">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-start gap-2">
                    <span className="text-xl font-bold text-muted-foreground">
                      Current:
                    </span>
                    <PriceText price={price?.current} />
                  </div>
                  <div className="flex items-start justify-start gap-2">
                    <span className="text-xl font-bold flex flex-row gap-1 items-center justify-start text-muted-foreground">
                      Lowest:
                    </span>
                    <PriceText price={price?.lowest} showDate />
                  </div>
                  <div className="flex items-start justify-start gap-2">
                    <span className="text-xl font-bold flex flex-row gap-1 items-center justify-start text-muted-foreground">
                      Last Discount:
                    </span>
                    <PriceText price={price?.lastDiscount} showDate />
                  </div>
                </div>
              </CardContent>
            </Card>
          </OverviewSection>
          <OverviewSection title="How Long To Beat">
            <Card className="w-full">
              <CardContent className="p-6">
                <div className="flex flex-row items-center justify-center gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {hltb?.gameTimes.map((time) => (
                      <div key={time._id} className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {time.time}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {time.category}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </OverviewSection>
        </OverviewColumn>
      </div>
    </div>
  );
}

function OverviewColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4 w-full">{children}</div>;
}

function OverviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 w-full mt-2">
      <h6 className="text-2xl font-bold">{title}</h6>
      {children}
    </div>
  );
}

function PriceText({
  price,
  showDate,
}: { price: Price | null | undefined; showDate?: boolean }) {
  if (!price) {
    return null;
  }

  const fmtr = Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.price.currencyCode || 'USD',
  });

  const isDiscounted = useMemo(() => {
    return price.price.discount > 0;
  }, [price.price.discount]);

  const discountPercent = useMemo(() => {
    if (price.price.originalPrice === 0) {
      return 0;
    }

    const discount =
      ((price.price.originalPrice - price.price.discountPrice) /
        price.price.originalPrice) *
      100;

    return Math.round(discount);
  }, [price.price.discountPrice, price.price.originalPrice]);

  return (
    <span
      className={cn(
        'text-xl font-bold flex flex-row gap-2 items-center justify-start',
        isDiscounted && 'text-green-400',
      )}
    >
      {fmtr.format(
        calculatePrice(
          price.price.discountPrice ?? 0,
          price.price.currencyCode,
        ),
      )}
      {isDiscounted && (
        <span className="bg-badge text-black text-xs font-extrabold px-2 py-1 rounded-md">
          -{discountPercent}%
        </span>
      )}
      {showDate && (
        <span className="text-sm text-muted-foreground font-light">
          (
          {new Date(price.updatedAt).toLocaleDateString('en-UK', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
          )
        </span>
      )}
    </span>
  );
}