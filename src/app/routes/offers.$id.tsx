import type { LoaderFunctionArgs } from '@remix-run/node';
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation,
  type MetaFunction,
} from '@remix-run/react';
import { Image } from '~/components/app/image';
import { client, getQueryClient } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { getSeller } from '~/lib/get-seller';
import type { SingleOffer } from '~/types/single-offer';
import type { SingleItem } from '~/types/single-item';
import type { Media } from '~/types/media';
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
import { GameFeatures } from '~/components/app/features';
import { cn } from '~/lib/utils';
import { OpenLauncher } from '~/components/app/open-launcher';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { RegionalPricing } from '~/components/app/regional-pricing';
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
  } catch (error) {
    return [];
  }
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const queryClient = getQueryClient();
  const url = new URL(request.url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['offer', { id: params.id }],
      queryFn: () =>
        client.get<SingleOffer>(`/offers/${params.id}`).then((response) => response.data),
    }),
    queryClient.prefetchQuery({
      queryKey: ['items', { id: params.id }],
      queryFn: () =>
        client
          .get<Array<SingleItem>>(`/offers/${params.id}/items`)
          .then((response) => response.data),
    }),
    queryClient.prefetchQuery({
      queryKey: ['price', { id: params.id, country }],
      queryFn: () =>
        client
          .get<Price>(`/offers/${params.id}/price?country=${country || 'US'}`)
          .then((response) => response.data),
    }),
  ]);

  const subPath = request.url.split(`/${params.id}/`)[1] as string | undefined;

  return {
    subPath,
    id: params.id,
    dehydratedState: dehydrate(queryClient),
  };
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
  } catch (error) {
    return [
      {
        title: 'Offer not found',
        description: 'Offer not found',
      },
    ];
  }
};

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
  const { subPath: serverSubPath, id } = useLoaderData<typeof loader>();
  const [offerQuery, itemsQuery] = useQueries({
    queries: [
      {
        queryKey: ['offer', { id }],
        queryFn: () => client.get<SingleOffer>(`/offers/${id}`).then((response) => response.data),
      },
      {
        queryKey: ['items', { id }],
        queryFn: () =>
          client.get<Array<SingleItem>>(`/offers/${id}/items`).then((response) => response.data),
      },
      {
        queryKey: ['price', { id, country }],
        queryFn: () =>
          client
            .get<Price>(`/offers/${id}/price`, {
              params: { country },
            })
            .then((response) => response.data),
      },
    ],
  });

  const { data: offerData, isLoading: offerLoading } = offerQuery;
  const { data: items } = itemsQuery;

  const subPath = serverSubPath ?? location.pathname.split(`/${id}/`)[1] ?? 'price';

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

  const handleTabChange = (value: string) => {
    if (value === 'price') {
      navigate(`/offers/${offerData.id}`, { replace: true, preventScrollReset: true });
    } else {
      navigate(`/offers/${offerData.id}/${value}`, { replace: true, preventScrollReset: true });
    }
  };

  return (
    <main className="flex flex-col items-start justify-start w-full min-h-screen gap-4">
      <header className="grid col-span-1 gap-4 md:grid-cols-2 w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold">{offerData.title}</h1>
          <h4
            className="text-lg font-semibold opacity-50"
            aria-label={`Offered by ${offerData.seller.name}`}
          >
            {getSeller({
              developerDisplayName: offerData.developerDisplayName as string,
              publisherDisplayName: offerData.publisherDisplayName as string,
              seller: offerData.seller.name,
              customAttributes: offerData.customAttributes,
            })}
          </h4>

          <div className="rounded-xl border border-gray-300/10 mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Offer ID</TableHead>
                  <TableHead className="text-left font-mono border-l-gray-300/10 border-l">
                    {offerData.id}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Namespace</TableCell>
                  <TableCell
                    className={
                      'text-left font-mono border-l-gray-300/10 border-l underline decoration-dotted decoration-slate-600 underline-offset-4'
                    }
                  >
                    <Link to={`/sandboxes/${offerData.namespace}/offers`}>
                      {internalNamespaces.includes(offerData.namespace) ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>{offerData.namespace}</TooltipTrigger>
                            <TooltipContent>
                              <p>Epic Games internal namespace</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        offerData.namespace
                      )}
                    </Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Offer Type</TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l">
                    {offersDictionary[offerData.offerType] || offerData.offerType}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Seller</TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l">
                    <Link
                      to={`/sellers/${offerData.seller.id}`}
                      className="underline underline-offset-4"
                    >
                      {offerData.seller.name}
                    </Link>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Developer</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {(offerData.customAttributes?.developerName?.value === '{}'
                      ? undefined
                      : offerData.customAttributes?.developerName?.value) ??
                      offerData.developerDisplayName ??
                      offerData.seller.name}
                    {offerData.publisherDisplayName !== offerData.developerDisplayName && (
                      <span className="opacity-50">({offerData.publisherDisplayName})</span>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Supported Platforms</TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l inline-flex items-center justify-start gap-1">
                    {offerData.tags
                      .filter((tag) => tag !== null)
                      .filter((tag) => platformIcons[tag.id])
                      .map((tag) => (
                        <span key={tag.id} className="text-xs">
                          {platformIcons[tag.id]}
                        </span>
                      ))}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Release Date</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    <ReleaseDate
                      releaseDate={offerData.releaseDate}
                      pcReleaseDate={offerData.pcReleaseDate}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Last Update</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {offerData.lastModifiedDate
                      ? new Date(offerData.lastModifiedDate).toLocaleDateString('en-UK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })
                      : 'Not available'}
                    {' (UTC) '}
                    <TimeAgo targetDate={offerData.lastModifiedDate} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Creation Date</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {offerData.creationDate
                      ? new Date(offerData.creationDate).toLocaleDateString('en-UK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })
                      : 'Not available'}
                    {' (UTC) '}
                    <TimeAgo targetDate={offerData.creationDate} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <InternalBanner title={offerData.title} namespace={offerData.namespace} />
          <BaseGame offer={offerData} />
        </div>
        <div className="flex justify-start items-start flex-col gap-4">
          <div className="inline-flex items-center gap-2 justify-end w-full h-8">
            <OpenEgs offer={offerData} />
            <OpenEgl offer={offerData} />
            <OpenLauncher id={offerData.id} />
          </div>
          <OfferHero offer={offerData} />
          <p className="px-1">{offerData.description}</p>
        </div>
      </header>

      <section id="offer-information" className="w-full min-h-[50vh]">
        <Tabs
          defaultValue={subPath}
          className="w-full"
          onValueChange={handleTabChange}
          key={`subsection-${offerData.id}`}
        >
          <TabsList>
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="related">Related</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="changelog">Changelog</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          <TabsContent value="price">
            <h2 className="text-2xl font-bold">Price</h2>
            <RegionalPricing id={offerData.id} />
          </TabsContent>
          <TabsContent value="items" className="w-full">
            <Outlet context={{ items }} />
          </TabsContent>
          <TabsContent value="achievements">
            <Outlet />
          </TabsContent>
          <TabsContent value="related">
            <Outlet />
          </TabsContent>
          <TabsContent value="metadata">
            <Outlet context={offerData} />
          </TabsContent>
          <TabsContent value="changelog">
            <Outlet />
          </TabsContent>
          <TabsContent value="media">
            <Outlet />
          </TabsContent>
        </Tabs>
      </section>
      <SellerOffers
        id={offerData.seller.id}
        name={offerData.seller.name}
        currentOffer={offerData.id}
      />
      <SuggestedOffers id={offerData.id} />
    </main>
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

function OfferHero({ offer }: { offer: SingleOffer }) {
  const { data: media } = useQuery({
    queryKey: ['media', { id: offer.id }],
    queryFn: () => client.get<Media>(`/offers/${offer.id}/media`).then((response) => response.data),
    retry: false,
  });
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoUrl = media?.videos?.[0]?.outputs
    .filter((output) => output.width !== undefined)
    .sort((a, b) => (b?.width ?? 0) - (a?.width ?? 0))[0]?.url;

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.src = videoUrl;
      videoRef.current.load();
    }
  }, [videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      if (!isHovered) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isHovered]);

  return (
    <div
      className="relative w-full h-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {videoUrl && (
        <video
          className={cn(
            'rounded-xl shadow-lg transition-opacity duration-700 absolute inset-0 ease-in-out',
            isHovered ? 'opacity-100' : 'opacity-0',
          )}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          width={'100%'}
          height={'auto'}
          src={videoUrl}
          ref={(element) => {
            videoRef.current = element;
          }}
        />
      )}
      <Image
        src={
          getImage(offer.keyImages, [
            'DieselStoreFrontWide',
            'OfferImageWide',
            'DieselGameBoxWide',
            'TakeoverWide',
          ])?.url
        }
        alt={offer.title}
        quality="original"
        width={1920}
        height={1080}
        className={cn(
          'rounded-xl shadow-lg transition-opacity duration-700 ease-in-out',
          videoUrl && isHovered ? 'opacity-0' : 'opacity-100',
        )}
      />
      <GameFeatures id={offer.id} />
    </div>
  );
}
