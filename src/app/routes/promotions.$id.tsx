import { useLoaderData, type MetaFunction } from '@remix-run/react';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { Image } from '~/components/app/image';
import type { SingleOffer } from '~/types/single-offer';
import { GameCard, OfferCard } from '~/components/app/offer-card';
import { OfferListItem } from '~/components/app/game-card';
import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
import getPagingPage from '~/lib/get-paging-page';
import getCountryCode from '~/lib/get-country-code';
import { checkCountryCode } from '~/lib/check-country';
import cookie from 'cookie';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useCountry } from '~/hooks/use-country';
import { usePreferences } from '~/hooks/use-preferences';
import { cn } from '~/lib/utils';

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
  try {
    if (!data || !data.promotion) {
      return [{ title: 'Promotion not found' }];
    }

    const { title, count } = data.promotion;

    const coverImage =
      getImage(data.cover?.keyImages || [], [
        'OfferImageWide',
        'featuredMedia',
        'DieselGameBoxWide',
        'DieselStoreFrontWide',
      ])?.url ?? 'https://via.placeholder.com/1920x1080?text=No+Cover+Image';

    return [
      {
        title: `${title} - egdata.app`,
      },
      {
        name: 'description',
        content: `Checkout ${count} available offers for ${title} on egdata.app.`,
      },
      {
        name: 'og:title',
        content: `${title} - egdata.app`,
      },
      {
        name: 'og:description',
        content: `Checkout ${count} available offers for ${title} on egdata.app.`,
      },
      {
        name: 'twitter:title',
        content: `${title} - egdata.app`,
      },
      {
        name: 'twitter:description',
        content: `Checkout ${count} available offers for ${title} on egdata.app.`,
      },
      {
        name: 'og:image',
        content: coverImage,
      },
      {
        name: 'twitter:image',
        content: coverImage,
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'og:type',
        content: 'website',
      },
      {
        name: 'og:site_name',
        content: 'egdata.app',
      },
      {
        name: 'og:url',
        content: `https://egdata.app/promotions/${params.id}`,
      },
      {
        'script:ld+json': {
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: title,
          description: `Checkout ${count} available offers for ${title} on egdata.app.`,
          image: coverImage,
          url: `https://egdata.app/promotions/${params.id}`,
          location: {
            url: `https://egdata.app/promotions/${params.id}`,
            name: title,
            image: coverImage,
          },
          organizer: {
            '@type': 'Organization',
            name: 'Epic Games',
            url: 'https://store.epicgames.com',
          },
          startDate:
            data.promotion.elements
              .find((game) => game.price?.appliedRules.find((rule) => rule.startDate))
              ?.price?.appliedRules.find((rule) => rule.startDate)?.startDate ??
            new Date(Date.now() - 86400000).toISOString(),
          offers: {
            '@type': 'AggregateOffer',
            availability: 'https://schema.org/InStock',
            priceCurrency: data.promotion.elements[0]?.price?.price.currencyCode ?? 'USD',
            lowPrice:
              Math.min(
                ...data.promotion.elements.map((game) => game.price?.price.originalPrice ?? 0),
              ) / 100,
            highPrice:
              Math.max(
                ...data.promotion.elements.map((game) => game.price?.price.originalPrice ?? 0),
              ) / 100,
            offerCount: count,
            offers: data.promotion.elements.map((game) => ({
              '@type': 'Offer',
              url: `https://egdata.app/offers/${game.id}`,
            })),
          },
        },
      },
      {
        tagName: 'link',
        rel: 'canonical',
        href: `https://egdata.app/promotions/${params.id}`,
      },
    ];
  } catch (error) {
    console.error('Failed to generate meta tags', error);
    return [{ title: 'Promotion not found' }];
  }
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = params;
  const url = new URL(request.url);
  const page = getPagingPage(url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  // Check if the country is a valid ISO code using Intl API
  if (!checkCountryCode(country)) {
    console.warn(`Invalid country code: ${country}`);
    return redirect(`/promotions/${id}?country=US&limit=20&page=1`, 302);
  }

  const [promotionData, coverData] = await Promise.allSettled([
    client.get<{
      elements: SingleOffer[];
      title: string;
      limit: number;
      start: number;
      page: number;
      count: number;
    }>(`/promotions/${id}?country=${country}&page=${page}&limit=20`),
    client.get(`/promotions/${id}/cover`),
  ]);

  const promotion = promotionData.status === 'fulfilled' ? promotionData.value.data : null;
  const cover = coverData.status === 'fulfilled' ? coverData.value.data : null;

  return {
    promotion,
    cover,
    id,
  };
}

export default function Promotion() {
  const { country } = useCountry();
  const { view } = usePreferences();
  const { cover, promotion: promotionInitialData, id } = useLoaderData<typeof loader>();
  const [promotion, setPromotion] = useState<{
    elements: SingleOffer[];
    title: string;
    limit: number;
    start: number;
    page: number;
    count: number;
  } | null>(promotionInitialData);
  const [loading, setLoading] = useState(false);

  if (!promotion) {
    return null;
  }

  const handleLoadMore = async () => {
    setLoading(true);
    const { page } = promotion;
    const newPage = page + 1;
    const { data } = await client
      .get<{
        elements: SingleOffer[];
        page: number;
        total: number;
        limit: number;
      }>(`/promotions/${id}?country=${country}&page=${newPage}&limit=20`)
      .catch(() => ({
        data: {
          elements: [],
          page: 0,
          total: 0,
          limit: 0,
        },
      }));

    if (data.elements.length) {
      // @ts-expect-error
      setPromotion((prev) => ({
        ...prev,
        // @ts-expect-error
        elements: [...prev.elements, ...data.elements],
        page: newPage,
        limit: data.limit,
      }));
    }

    setLoading(false);
  };

  return (
    <main className="container mx-auto">
      <div className="relative h-96 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 flex flex-col justify-center items-start text-white p-8 bg-gradient-to-r from-black/80 to-black/30 z-10">
          <h1 className="text-5xl font-bold">{promotion?.title}</h1>
          <p className="mt-4 text-lg">{promotion?.count} offers available in this event</p>
        </div>
        {cover && (
          <Image
            src={
              getImage(cover.keyImages, [
                'OfferImageWide',
                'featuredMedia',
                'DieselGameBoxWide',
                'DieselStoreFrontWide',
              ]).url
            }
            alt={promotion?.title}
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <section
        className={cn(
          'mt-8 grid gap-4',
          view === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1',
        )}
      >
        {promotion.elements.map((game) => {
          if (view === 'list') {
            return <OfferListItem key={game.id} game={game} />;
          }

          return <OfferCard offer={game} key={game.id} size="md" />;
        })}
      </section>
      <div className="flex justify-center mt-8">
        <Button
          disabled={loading || promotion.limit * promotion.page >= promotion.count}
          onClick={handleLoadMore}
        >
          {loading && (
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          Load More
        </Button>
      </div>
    </main>
  );
}
