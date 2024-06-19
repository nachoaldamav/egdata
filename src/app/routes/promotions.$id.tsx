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

export const meta: MetaFunction = () => {
  return [
    {
      name: 'description',
      content: 'Promotions',
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
    return redirect('/sales?country=US', 302);
  }

  const [promotionData, coverData] = await Promise.allSettled([
    client.get<{
      elements: SingleOffer[];
      title: string;
      limit: number;
      start: number;
      page: number;
      count: number;
    }>(`/promotions/${id}?country=${country}&page=${page}&limit=32`),
    client.get(`/promotions/${id}/cover`),
  ]);

  const promotion = promotionData.status === 'fulfilled' ? promotionData.value.data : null;
  const cover = coverData.status === 'fulfilled' ? coverData.value.data : null;

  return {
    promotion,
    cover,
  };
}

export default function Promotion() {
  const { cover, promotion } = useLoaderData<typeof loader>();

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
    </main>
  );
}
