import { useLoaderData, type MetaFunction } from '@remix-run/react';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { Image } from '~/components/app/image';
import type { SingleOffer } from '~/components/modules/sales';
import { GameCard } from '~/components/app/offer-card';
import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
import getPagingPage from '~/lib/get-paging-page';
import getCountryCode from '~/lib/get-country-code';
import { checkCountryCode } from '~/lib/check-country';
import cookie from 'cookie';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useCountry } from '~/hooks/use-country';

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
  if (!data || !data.promotion) {
    return [{ title: 'Promotion not found' }];
  }

  const { title, count } = data.promotion;

  const coverImage =
    getImage(data.cover?.keyImages, [
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
        offers: {
          '@type': 'AggregateOffer',
          availability: 'https://schema.org/InStock',
          priceCurrency: data.promotion.elements[0].price?.currency ?? 'USD',
          lowPrice: Math.min(
            ...data.promotion.elements.map((game) => game.price?.totalPrice.originalPrice ?? 0),
          ),
          highPrice: Math.max(
            ...data.promotion.elements.map((game) => game.price?.totalPrice.originalPrice ?? 0),
          ),
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
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {promotion?.elements.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </section>
      <div className="flex justify-center mt-8">
        <Button
          disabled={loading || promotion.limit * promotion.page >= promotion.count}
          onClick={handleLoadMore}
        >
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
          Load More
        </Button>
      </div>
    </main>
  );
}
