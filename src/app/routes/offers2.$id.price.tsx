import { LinksFunction, type LoaderFunctionArgs, redirect } from '@remix-run/node';
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  type MetaFunction,
} from '@remix-run/react';
import { getQueryClient } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { getSeller } from '~/lib/get-seller';
import type { SingleOffer } from '~/types/single-offer';
import type { SingleItem } from '~/types/single-item';
import type { Price } from '~/types/price';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { offersDictionary } from '~/lib/offers-dictionary';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { compareDates, timeAgo } from '~/lib/time-ago';
import { internalNamespaces } from '~/lib/internal-namespaces';
import { cn } from '~/lib/utils';
import { OpenLauncher } from '~/components/app/open-launcher';
import getCountryCode from '~/lib/get-country-code';
import { OpenEgs } from '~/components/app/open-egs';
import { OpenEgl } from '~/components/app/open-egl';
import { BaseGame } from '~/components/app/base-game';
import { InternalBanner } from '~/components/app/internal-banner';
import { dehydrate, HydrationBoundary, useQueries, useQuery } from '@tanstack/react-query';
import cookie from 'cookie';
import { useEffect, useRef, useState } from 'react';
import { SuggestedOffers } from '~/components/modules/suggested-offers';
import { platformIcons } from '~/components/app/platform-icons';
import { SellerOffers } from '~/components/modules/seller-offers';
import { useCountry } from '~/hooks/use-country';
import { httpClient } from '~/lib/http-client';
import { Button } from '~/components/ui/button';
import { useCompare } from '~/hooks/use-compare';
import { RemoveIcon } from '~/components/icons/remove';
import { AddIcon } from '~/components/icons/add';
import { Badge } from '~/components/ui/badge';
import { OfferHero } from '~/components/app/offer-hero';
import { SectionsNav } from '~/components/app/offer-sections';
import { CollectionOffers } from '~/components/modules/collection-offers';
import { Bundle } from '~/components/modules/bundle';
import { OfferInBundle } from '~/components/app/bundle-game';
import { Separator } from '~/components/ui/separator';
import { GameFeatures, GameFeaturesV2 } from '~/components/app/features';
import { Image } from '~/components/app/image';
import { calculatePrice } from '~/lib/calculate-price';
import { ArrowDown, ChevronDown } from 'lucide-react';
import { Portal } from '@radix-ui/react-portal';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import type { Media } from '~/types/media';
import { OfferMediaSlider } from '~/components/modules/media-slider';
import defaultPlayerTheme from '@vidstack/react/player/styles/default/theme.css?url';
import defaultAudioPlayer from '@vidstack/react/player/styles/default/layouts/audio.css?url';
import defaultVideoPlayer from '@vidstack/react/player/styles/default/layouts/video.css?url';
import Markdown from 'react-markdown';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: defaultPlayerTheme },
  { rel: 'stylesheet', href: defaultAudioPlayer },
  { rel: 'stylesheet', href: defaultVideoPlayer },
];

function supportedPlatforms(items: SingleItem[]): string[] {
  try {
    if (items.length === 0) {
      return [];
    }
    const platforms = items
      .flatMap((item) => item.releaseInfo)
      .map((releaseInfo) => releaseInfo.platform)
      .filter((platform) => platform !== null)
      .flat();

    const platformSet = new Set(platforms);
    return Array.from(platformSet);
  } catch {
    return [];
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  try {
    if (!data) {
      return [
        {
          title: 'Offer not found',
          description: 'Offer not found',
        },
      ];
    }

    const { dehydratedState } = data;

    const offerData = dehydratedState.queries.find((query) => query.queryKey[0] === 'offer')?.state
      .data as SingleOffer | undefined;
    const price = dehydratedState.queries.find((query) => query.queryKey[0] === 'price')?.state
      .data as Price | undefined;
    const items = dehydratedState.queries.find((query) => query.queryKey[0] === 'items')?.state
      .data as SingleItem[] | undefined;

    if (!offerData || offerData.title === 'Error') {
      return [
        {
          title: 'Offer not found',
          description: 'Offer not found',
        },
      ];
    }

    return [
      {
        title: `${offerData.title} - egdata.app`,
      },
      {
        name: 'description',
        content: offerData.description,
      },
      {
        name: 'keywords',
        content: [
          'Epic Games',
          'Epic Games Store',
          'Offer',
          'Game',
          'Epic Games DB',
          'Epic DB',
          'Database',
          'Epic Database',
        ]
          .concat(offerData.tags.filter((tag) => tag !== null)?.map((tag) => tag?.name))
          .join(', '),
      },
      {
        name: 'author',
        content: offerData.seller.name,
      },
      {
        name: 'robots',
        content: 'index, follow',
      },
      {
        property: 'og:title',
        content: `${offerData.title} - egdata.app`,
      },
      {
        property: 'og:description',
        content: offerData.description,
      },
      {
        property: 'og:image',
        content:
          getImage(offerData.keyImages, ['OfferImageWide', 'DieselGameBoxWide', 'TakeoverWide'])
            ?.url || 'https://via.placeholder.com/1920x1080',
      },
      {
        property: 'og:url',
        content: `https://egdata.app/offers/${offerData.id}`,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:site_name',
        content: 'egdata.app',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:site',
        content: '@egdataapp',
      },
      {
        name: 'twitter:title',
        content: `${offerData.title} - egdata.app`,
      },
      {
        name: 'twitter:description',
        content: offerData.description,
      },
      {
        name: 'twitter:image',
        content:
          getImage(offerData.keyImages, ['OfferImageWide', 'DieselGameBoxWide', 'TakeoverWide'])
            ?.url || 'https://via.placeholder.com/1920x1080',
      },
      {
        'script:ld+json': {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: offerData.title,
          applicationCategory: 'Game',
          description: offerData.description,
          operatingSystem: supportedPlatforms(items as SingleItem[]).join(', '),
          datePublished: offerData.releaseDate,
          dateModified: offerData.lastModifiedDate,
          mainEntityOfPage: offerData.offerType === 'BASE_GAME' ? true : undefined,
          publisher: {
            '@type': 'Organization',
            name: offerData.publisherDisplayName ?? offerData.seller.name,
          },
          copyrightHolder: {
            '@type': 'Organization',
            name: offerData.publisherDisplayName ?? offerData.seller.name,
          },
          creator: {
            '@type': 'Organization',
            name:
              offerData.developerDisplayName ??
              offerData.publisherDisplayName ??
              offerData.seller.name,
          },
          offers: [
            price && {
              '@type': 'Offer',
              category: 'VideoGame',
              itemCondition: 'https://schema.org/NewCondition',
              availability: offerData.prePurchase
                ? 'https://schema.org/PreOrder'
                : 'https://schema.org/OnlineOnly',
              url: offerData.productSlug
                ? `https://store.epicgames.com/product/${offerData.productSlug}`
                : `https://egdata.app/offers/${offerData.id}`,
              offeredBy: {
                '@type': 'Organization',
                name: offerData.seller.name,
              },
              seller: {
                '@type': 'Organization',
                name: offerData.seller.name,
              },
              author: {
                '@type': 'Organization',
                name:
                  offerData.developerDisplayName ??
                  offerData.publisherDisplayName ??
                  offerData.seller.name,
              },
              priceSpecification: {
                '@type': 'PriceSpecification',
                price: price.price.discountPrice / 100,
                priceCurrency: price.price.currencyCode ?? 'USD',
                validFrom: new Date(price.updatedAt).toISOString(),
              },
            },
          ],
          sameAs: offerData.productSlug
            ? `https://store.epicgames.com/product/${offerData.productSlug}`
            : undefined,
          image:
            getImage(offerData.keyImages, ['OfferImageWide', 'DieselGameBoxWide', 'TakeoverWide'])
              ?.url || 'https://via.placeholder.com/1920x1080',
        },
      },
      {
        rel: 'canonical',
        href: `https://egdata.app/offers/${offerData.id}`,
      },
      {
        rel: 'prefetch',
        href: `https://api.egdata.app/base-game/${offerData.namespace}`,
      },
    ];
  } catch {
    return [
      {
        title: 'Offer not found',
        description: 'Offer not found',
      },
    ];
  }
};

export async function loader({ params, request }: LoaderFunctionArgs) {
  const queryClient = getQueryClient();
  const url = new URL(request.url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['offer', { id: params.id }],
      queryFn: () => httpClient.get<SingleOffer>(`/offers/${params.id}`),
    }),
    queryClient.prefetchQuery({
      queryKey: ['items', { id: params.id }],
      queryFn: () => httpClient.get<Array<SingleItem>>(`/offers/${params.id}/items`),
    }),
    queryClient.prefetchQuery({
      queryKey: ['price', { id: params.id, country }],
      queryFn: () => httpClient.get<Price>(`/offers/${params.id}/price?country=${country || 'US'}`),
    }),
    queryClient.prefetchQuery({
      queryKey: ['hltb', { id: params.id }],
      queryFn: () =>
        httpClient.get<HowLongToBeat | null>(`/offers/${params.id}/hltb`, {
          retries: 1,
        }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['offer-features', { id: params.id }],
      queryFn: () => httpClient.get(`/offers/${params.id}/features`),
    }),
    queryClient.prefetchQuery({
      queryKey: [
        'in-bundles',
        {
          id: params.id,
          country,
        },
      ],
      queryFn: () =>
        httpClient.get<SingleOffer[]>(`/offers/${params.id}/in-bundle`, {
          params: {
            country,
          },
        }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['collection-offers', { id: params.id, country }],
      queryFn: () =>
        httpClient.get<SingleOffer[]>(`/offers/${params.id}/collection`, {
          params: { country },
          retries: 1,
        }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['media', { id: params.id }],
      queryFn: () => httpClient.get<Media>(`/offers/${params.id}/media`),
    }),
  ]);

  const subPath = request.url.split(`/${params.id}/`)[1] as string | undefined;

  if (!subPath) {
    return redirect(`/offers/${params.id}/price`);
  }

  return {
    subPath,
    id: params.id,
    dehydratedState: dehydrate(queryClient),
  };
}

export default function Index() {
  const { dehydratedState } = useLoaderData<typeof loader>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <OfferPage />
    </HydrationBoundary>
  );
}

function OfferPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { country } = useCountry();
  const { addToCompare, removeFromCompare, compare } = useCompare();
  const { id } = useLoaderData<typeof loader>();
  const [offerQuery, itemsQuery, priceQuery] = useQueries({
    queries: [
      {
        queryKey: ['offer', { id }],
        queryFn: () => httpClient.get<SingleOffer>(`/offers/${id}`),
      },
      {
        queryKey: ['items', { id }],
        queryFn: () => httpClient.get<Array<SingleItem>>(`/offers/${id}/items`),
      },
      {
        queryKey: ['price', { id, country }],
        queryFn: () =>
          httpClient.get<Price>(`/offers/${id}/price`, {
            params: { country },
          }),
      },
    ],
  });

  const { data: offerData, isLoading: offerLoading } = offerQuery;
  const { data: items } = itemsQuery;
  const { data: price } = priceQuery;

  const subPath = location.pathname.split(`/${id}/`)[1] ?? 'price';

  useEffect(() => {
    if (!subPath || subPath === '') {
      navigate(`/offers/${id}/price`, { replace: true });
    }
  }, [subPath, id, navigate]);

  if (offerLoading) {
    return <div>Loading...</div>;
  }

  if (!offerData) {
    return <div>Offer not found</div>;
  }

  if (offerData.title === 'Error') {
    return <div>{offerData.description}</div>;
  }

  console.log(offerData.longDescription);

  return (
    <main className="flex flex-row gap-4 w-full">
      <section id="main-content" className="flex flex-col gap-4 w-full">
        <OfferMediaSlider offer={offerData} />
        <h1 className="text-2xl font-bold">{offerData.title}</h1>
        <h2 className="text-lg font-semibold">{offerData.description}</h2>
        <hr className="my-4" />
        {offerData.longDescription && (
          <section className="mb-4 prose prose-lg prose-neutral dark:prose-invert max-w-none">
            <Markdown>{offerData.longDescription}</Markdown>
          </section>
        )}
      </section>
      <aside className="flex flex-col gap-2 w-full md:w-1/2 lg:w-2/5 bg-card rounded-xl p-4 h-fit">
        <h4
          className="text-md font-semibold opacity-50 inline-flex items-center gap-2"
          aria-label={`Offered by ${offerData.seller.name}`}
        >
          {getSeller({
            developerDisplayName: offerData.developerDisplayName as string,
            publisherDisplayName: offerData.publisherDisplayName as string,
            seller: offerData.seller.name,
            customAttributes: offerData.customAttributes,
          })}

          {offerData.prePurchase && <Badge variant="outline">Pre-Purchase</Badge>}
          {offerData.tags.find((tag) => tag.id === '1310') && (
            <Badge variant="outline">Early Access</Badge>
          )}
        </h4>
        <h1 className="text-2xl font-bold">{offerData.title}</h1>
        <Link to={`/search?offer_type=${offerData.offerType}`} className="text-sm text-blue-200">
          {offersDictionary[offerData.offerType] || offerData.offerType}
        </Link>
        <Separator orientation="horizontal" className="my-4" />
        <OfferPrice offer={offerData} />
        <h2 className="text-lg font-semibold">Features</h2>
        <div className="flex flex-col gap-2 relative">
          <GameFeaturesV2 id={offerData.id} />
        </div>
        <Separator orientation="horizontal" className="my-4" />
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="grid grid-cols-2 gap-2">
          <span className="text-sm text-gray-100/50">Release Date</span>
          <span className="text-sm">
            {new Date(offerData.releaseDate).toLocaleDateString('en-UK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>

          <span className="text-sm text-gray-100/50">Last Update</span>
          <span className="text-sm">
            {new Date(offerData.lastModifiedDate).toLocaleDateString('en-UK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>

          <span className="text-sm text-gray-100/50">Creation Date</span>
          <span className="text-sm">
            {new Date(offerData.creationDate).toLocaleDateString('en-UK', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>

          <span className="text-sm text-gray-100/50">Developer</span>
          <span className="text-sm">{offerData.developerDisplayName}</span>

          <span className="text-sm text-gray-100/50">Publisher</span>
          <span className="text-sm">{offerData.publisherDisplayName}</span>

          <span className="text-sm text-gray-100/50">Supported Platforms</span>
          <span className="text-sm flex flex-row gap-2">
            {offerData.tags
              .filter((tag) => tag !== null && platformIcons[tag.id])
              .map((tag) => (
                <span key={tag.id} className="text-xs">
                  {platformIcons[tag.id]}
                </span>
              ))}
          </span>
        </div>
        <Separator orientation="horizontal" className="my-4" />
        <HowLongToBeat />
      </aside>
    </main>
  );
}

interface HowLongToBeat {
  gameTimes?: {
    category: string;
    time: string;
  }[];
}

function HowLongToBeat() {
  const { id } = useLoaderData<typeof loader>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['hltb', { id }],
    queryFn: () =>
      httpClient.get<HowLongToBeat | null>(`/offers/${id}/hltb`, {
        retries: 1,
      }),
  });

  if (isLoading) {
    return null;
  }

  if (isError) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">HowLongToBeat</h2>
      <div className="flex flex-row flex-wrap justify-between gap-2 mt-2">
        {data.gameTimes?.map((gameTime) => (
          <div key={gameTime.category} className="flex flex-col gap-1 items-center justify-center">
            <span className="text-sm font-thing">{gameTime.category}</span>
            <Separator orientation="horizontal" className="max-w-20" />
            <span className="text-sm font-semibold">{gameTime.time}</span>
          </div>
        ))}
      </div>
      <Separator orientation="horizontal" className="my-4" />
    </div>
  );
}

function OfferPrice({ offer }: { offer: SingleOffer }) {
  const { id } = useLoaderData<typeof loader>();
  const { country } = useCountry();
  const [showPopover, setShowPopover] = useState(false);
  const queries = useQueries({
    queries: [
      {
        queryKey: ['price', { id, country }],
        queryFn: () =>
          httpClient.get<Price>(`/offers/${id}/price`, {
            params: { country },
          }),
      },
      {
        queryKey: [
          'in-bundles',
          {
            id,
            country,
          },
        ],
        queryFn: () =>
          httpClient.get<SingleOffer[]>(`/offers/${id}/in-bundle`, {
            params: {
              country,
            },
          }),
      },
      {
        queryKey: ['collection-offers', { id, country }],
        queryFn: () =>
          httpClient.get<SingleOffer[]>(`/offers/${id}/collection`, {
            params: { country },
            retries: 1,
          }),
      },
    ],
  });

  const [priceQuery, inBundlesQuery, collectionOffersQuery] = queries;

  if (priceQuery.isLoading) {
    return null;
  }

  if (priceQuery.isError) {
    return null;
  }

  const price = priceQuery.data;
  const inBundles = inBundlesQuery.data;
  const collectionOffers = collectionOffersQuery.data;

  if (!price) {
    return null;
  }

  return (
    <>
      <h2 className="text-lg font-semibold">Price</h2>
      <div className="flex flex-col gap-2">
        <Popover
          onOpenChange={(open) => {
            setShowPopover(open);
          }}
        >
          <div className="bg-gray-500/10 rounded-xl px-4 py-5 flex flex-row gap-2 border-gray-300/10 border">
            <span className="text-xl font-extrabold">
              {Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: price.price.currencyCode,
              }).format(price.price.discountPrice / 100)}
            </span>
            {price.price.discount > 0 && (
              <span className="text-xl text-gray-100/50 line-through">
                {Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: price.price.currencyCode,
                }).format(price.price.discount / 100)}
              </span>
            )}
            {(inBundles && inBundles.length > 0) ||
            (collectionOffers && collectionOffers.length > 0) ? (
              <div className="w-full flex flex-col gap-1 text-right justify-center items-end">
                <PopoverTrigger>
                  <ChevronDown
                    className={cn(
                      'size-6 transition-transform duration-300 ease-in-out',
                      showPopover ? 'rotate-180' : '',
                    )}
                  />
                </PopoverTrigger>
              </div>
            ) : null}
          </div>
          <PopoverContent
            sideOffset={30}
            alignOffset={-17}
            align="end"
            className="bg-card rounded-xl p-0 border-0 w-[355px]"
          >
            <div className="bg-gray-500/10 rounded-xl p-2 flex flex-col gap-0 border-gray-300/10 border">
              <OfferInBundle offer={offer} />
            </div>
          </PopoverContent>
        </Popover>
        <div className="inline-flex items-center gap-2 justify-between">
          <Button asChild className="bg-blue-400 hover:bg-blue-600 text-black font-medium w-full">
            <Link to={`/offers/${offer.id}/price`}>Buy Now</Link>
          </Button>
          <OpenEgs offer={offer} />
          <OpenEgl offer={offer} />
        </div>
      </div>
      <Separator orientation="horizontal" className="my-4" />
    </>
  );
}

const TimeAgo: React.FC<{
  targetDate: string;
}> = ({ targetDate }) => {
  return (
    <span className="opacity-50">
      ({targetDate ? timeAgo(new Date(targetDate)) : 'Not available'})
    </span>
  );
};

const ReleaseDate: React.FC<{
  releaseDate: string | null;
  pcReleaseDate: string | null;
}> = ({ releaseDate, pcReleaseDate }) => {
  if (!releaseDate || releaseDate.includes('2099')) {
    return <span>Not available</span>;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip open={!pcReleaseDate ? false : undefined}>
          <TooltipTrigger className="flex items-center gap-1 cursor-default">
            <span
              className={cn(
                pcReleaseDate &&
                  releaseDate !== pcReleaseDate &&
                  'underline decoration-dotted underline-offset-4',
              )}
            >
              {new Date(releaseDate).toLocaleDateString('en-UK', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timeZoneName: 'short',
              })}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {!pcReleaseDate || releaseDate === pcReleaseDate ? (
              'Released on Epic the same day as PC'
            ) : (
              <span>
                <span>Released on PC </span>
                <span>{compareDates(new Date(pcReleaseDate), new Date(releaseDate))}</span>
                <span> the EGS</span>
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TimeAgo targetDate={releaseDate} />
    </>
  );
};
