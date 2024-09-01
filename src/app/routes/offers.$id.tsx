import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
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
import { dehydrate, HydrationBoundary, useQueries } from '@tanstack/react-query';
import cookie from 'cookie';
import { useEffect } from 'react';
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
  const [offerQuery, itemsQuery] = useQueries({
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

  return (
    <main className="flex flex-col items-start justify-start w-full min-h-screen gap-4">
      <header className="grid col-span-1 gap-4 md:grid-cols-2 w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold">{offerData.title}</h1>
          <h4
            className="text-lg font-semibold opacity-50 inline-flex items-center gap-1"
            aria-label={`Offered by ${offerData.seller.name}`}
          >
            {getSeller({
              developerDisplayName: offerData.developerDisplayName as string,
              publisherDisplayName: offerData.publisherDisplayName as string,
              seller: offerData.seller.name,
              customAttributes: offerData.customAttributes,
            })}
            {offerData.prePurchase && <Badge variant="outline">Pre-Purchase</Badge>}
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
            <Button
              onClick={() => {
                if (compare.includes(offerData.id)) {
                  removeFromCompare(offerData.id);
                } else {
                  addToCompare(offerData.id);
                }
              }}
              className="inline-flex items-center gap-1 bg-card text-white hover:bg-card-hover border"
            >
              {compare.includes(offerData.id) ? <RemoveIcon /> : <AddIcon />}
              <span>Compare</span>
            </Button>
          </div>
          <OfferHero offer={offerData} />
          <p className="px-1">{offerData.description}</p>
        </div>
      </header>

      {offerData.categories.findIndex((category) => category === 'collections') !== -1 && (
        <section className="w-full min-h-[50vh] flex flex-col gap-4">
          <CollectionOffers id={offerData.id} />
        </section>
      )}

      <section id="offer-information" className="w-full min-h-[50vh] flex flex-col gap-4">
        <SectionsNav
          links={[
            {
              id: 'price',
              label: 'Price',
              href: `/offers/${offerData.id}/price`,
            },
            {
              id: 'items',
              label: 'Items',
              href: `/offers/${offerData.id}/items`,
            },
            {
              id: 'achievements',
              label: 'Achievements',
              href: `/offers/${offerData.id}/achievements`,
            },
            {
              id: 'related',
              label: 'Related',
              href: `/offers/${offerData.id}/related`,
            },
            {
              id: 'metadata',
              label: 'Metadata',
              href: `/offers/${offerData.id}/metadata`,
            },
            {
              id: 'changelog',
              label: 'Changelog',
              href: `/offers/${offerData.id}/changelog`,
            },
            {
              id: 'media',
              label: 'Media',
              href: `/offers/${offerData.id}/media`,
            },
            {
              id: 'reviews',
              label: 'Reviews',
              href: `/offers/${offerData.id}/reviews`,
            },
          ]}
          activeSection={subPath ?? 'price'}
          onSectionChange={(id) => {
            navigate(`/offers/${offerData.id}/${id}`, { replace: false, preventScrollReset: true });
          }}
        />

        <Outlet
          context={{
            offer: offerData,
            items: items,
          }}
        />
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
