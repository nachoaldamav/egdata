import { BaseGame } from '@/components/app/base-game';
import { OfferInBundle } from '@/components/app/bundle-game';
import { InternalBanner } from '@/components/app/internal-banner';
import { OfferHero } from '@/components/app/offer-hero';
import { SectionsNav } from '@/components/app/offer-sections';
import { OpenEgl } from '@/components/app/open-egl';
import { OpenEgs } from '@/components/app/open-egs';
import { OpenLauncher } from '@/components/app/open-launcher';
import { platformIcons } from '@/components/app/platform-icons';
import { Bundle } from '@/components/modules/bundle';
import { CollectionOffers } from '@/components/modules/collection-offers';
import { SellerOffers } from '@/components/modules/seller-offers';
import { SuggestedOffers } from '@/components/modules/suggested-offers';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCountry } from '@/hooks/use-country';
import { getQueryClient } from '@/lib/client';
import { generateOfferMeta } from '@/lib/generate-offer-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { getSeller } from '@/lib/get-seller';
import { httpClient } from '@/lib/http-client';
import { internalNamespaces } from '@/lib/internal-namespaces';
import { offersDictionary } from '@/lib/offers-dictionary';
import { compareDates, timeAgo } from '@/lib/time-ago';
import { cn } from '@/lib/utils';
import type { Price } from '@/types/price';
import type { SingleOffer } from '@/types/single-offer';
import {
  dehydrate,
  HydrationBoundary,
  useQueries,
} from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/offers/$id')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <OfferPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ params, context }) => {
    const { id } = params;
    const { country, queryClient } = context;

    return {
      id,
      dehydratedState: dehydrate(queryClient),
      country,
    };
  },

  beforeLoad: async (ctx) => {
    const { params, context, cause } = ctx;
    const { country, queryClient } = context;
    const { id } = params;

    const subPath = ctx.location.pathname
      .toString()
      .split(`/${params.id}/`)[1] as string | undefined;

    if (!subPath && cause !== 'preload') {
      throw redirect({
        to: `/offers/${params.id}/price`,
        replace: true,
        resetScroll: true,
      });
    }

    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['offer', { id: params.id }],
        queryFn: () => httpClient.get<SingleOffer>(`/offers/${params.id}`),
      }),
      queryClient.prefetchQuery({
        queryKey: ['price', { id: params.id, country }],
        queryFn: () =>
          httpClient.get<Price>(
            `/offers/${params.id}/price?country=${country || 'US'}`
          ),
      }),
    ]);

    return {
      state: dehydrate(queryClient),
      id,
    };
  },

  meta(ctx) {
    const { params } = ctx;
    const queryClient = getQueryClient();

    const offer = getFetchedQuery<SingleOffer>(
      queryClient,
      ctx.loaderData.dehydratedState,
      ['offer', { id: params.id }]
    );

    if (!offer) {
      return [
        {
          title: 'Offer not found',
          description: 'Offer not found',
        },
      ];
    }

    return generateOfferMeta(offer);
  },
});

function OfferPage() {
  const { id } = Route.useLoaderData();
  const { country } = useCountry();
  const navigate = useNavigate();
  const location = useLocation();
  const [offerQuery] = useQueries({
    queries: [
      {
        queryKey: ['offer', { id }],
        queryFn: () =>
          httpClient.get<SingleOffer>(`/offers/${id}`, {
            params: {
              country,
            },
          }),
      },
    ],
  });

  const { data: offer, isLoading: offerLoading } = offerQuery;

  const subPath = location.pathname.split(`/${id}/`)[1] ?? 'price';

  useEffect(() => {
    if (!subPath || subPath === '') {
      navigate({
        to: `/offers/${id}/price`,
        replace: true,
        resetScroll: true,
      });
    }
  }, [subPath, id, navigate]);

  if (offerLoading) {
    return <div>Loading...</div>;
  }

  if (!offer) {
    return <div>Offer not found</div>;
  }

  if (offer.title === 'Error') {
    return <div>{offer.description}</div>;
  }

  return (
    <main className="flex flex-col items-start justify-start w-full min-h-screen gap-4">
      <header className="grid col-span-1 gap-4 md:grid-cols-2 w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold">{offer.title}</h1>
          <h4
            className="text-lg font-semibold opacity-50 inline-flex items-center gap-2"
            aria-label={`Offered by ${offer.seller.name}`}
          >
            {getSeller({
              developerDisplayName: offer.developerDisplayName as string,
              publisherDisplayName: offer.publisherDisplayName as string,
              seller: offer.seller.name,
              customAttributes: offer.customAttributes,
            })}
            {offer.prePurchase && <Badge variant="outline">Pre-Purchase</Badge>}
            {offer.tags.find((tag) => tag.id === '1310') && (
              <Badge variant="outline">Early Access</Badge>
            )}
          </h4>

          <div className="rounded-xl border border-gray-300/10 mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Offer ID</TableHead>
                  <TableHead className="text-left font-mono border-l-gray-300/10 border-l">
                    {offer.id}
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
                    <Link to={`/sandboxes/${offer.namespace}/offers`}>
                      {internalNamespaces.includes(offer.namespace) ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>{offer.namespace}</TooltipTrigger>
                            <TooltipContent>
                              <p>Epic Games internal namespace</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        offer.namespace
                      )}
                    </Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">Offer Type</TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l">
                    {offersDictionary[offer.offerType] || offer.offerType}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Seller</TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l">
                    <Link
                      to={`/sellers/${offer.seller.id}`}
                      className="underline underline-offset-4"
                    >
                      {offer.seller.name}
                    </Link>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Developer</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {(offer.customAttributes?.developerName?.value === '{}'
                      ? undefined
                      : offer.customAttributes?.developerName?.value) ??
                      offer.developerDisplayName ??
                      offer.seller.name}
                    {offer.publisherDisplayName !==
                      offer.developerDisplayName && (
                      <span className="opacity-50">
                        ({offer.publisherDisplayName})
                      </span>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Supported Platforms
                  </TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l inline-flex items-center justify-start gap-1">
                    {offer.tags
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
                      releaseDate={offer.releaseDate}
                      pcReleaseDate={offer.pcReleaseDate}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Last Update</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {offer.lastModifiedDate
                      ? new Date(offer.lastModifiedDate).toLocaleDateString(
                          'en-UK',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          }
                        )
                      : 'Not available'}
                    {' (UTC) '}
                    <TimeAgo targetDate={offer.lastModifiedDate} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Creation Date</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {offer.creationDate
                      ? new Date(offer.creationDate).toLocaleDateString(
                          'en-UK',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          }
                        )
                      : 'Not available'}
                    {' (UTC) '}
                    <TimeAgo targetDate={offer.creationDate} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <InternalBanner title={offer.title} namespace={offer.namespace} />
          <BaseGame offer={offer} />
          <OfferInBundle offer={offer} />
        </div>
        <div className="flex justify-start items-start flex-col gap-4">
          <div className="inline-flex items-center gap-2 justify-end w-full h-8">
            <OpenEgs offer={offer} />
            <OpenEgl offer={offer} />
            <OpenLauncher id={offer.id} />
            {/* <Button
              onClick={() => {
                if (compare.includes(offer.id)) {
                  removeFromCompare(offer.id);
                } else {
                  addToCompare(offer.id);
                }
              }}
              className="inline-flex items-center gap-1 bg-card text-white hover:bg-card-hover border"
            >
              {compare.includes(offer.id) ? <RemoveIcon /> : <AddIcon />}
              <span>Compare</span>
            </Button> */}
          </div>
          <OfferHero offer={offer} />
          <p className="px-1">{offer.description}</p>
        </div>
      </header>

      {offer.categories.findIndex((category) => category === 'collections') !==
        -1 && (
        <section className="w-full min-h-[50vh] flex flex-col gap-4">
          <CollectionOffers id={offer.id} />
        </section>
      )}

      {offer.offerType === 'BUNDLE' || offer.offerType === 'Bundle' ? (
        <section className="w-full min-h-[50vh] flex flex-col gap-4">
          <hr className="my-4" />
          <Bundle id={offer.id} offer={offer} />
          <hr className="my-4" />
        </section>
      ) : null}

      <section
        id="offer-information"
        className="w-full min-h-[50vh] flex flex-col gap-4"
      >
        <SectionsNav
          links={[
            {
              id: 'price',
              label: 'Price',
              href: `/offers/${offer.id}/price`,
            },
            {
              id: 'items',
              label: 'Items',
              href: `/offers/${offer.id}/items`,
            },
            {
              id: 'achievements',
              label: 'Achievements',
              href: `/offers/${offer.id}/achievements`,
            },
            {
              id: 'related',
              label: 'Related',
              href: `/offers/${offer.id}/related`,
            },
            {
              id: 'metadata',
              label: 'Metadata',
              href: `/offers/${offer.id}/metadata`,
            },
            {
              id: 'changelog',
              label: 'Changelog',
              href: `/offers/${offer.id}/changelog`,
            },
            {
              id: 'media',
              label: 'Media',
              href: `/offers/${offer.id}/media`,
            },
            {
              id: 'reviews',
              label: 'Reviews',
              href: `/offers/${offer.id}/reviews`,
            },
          ]}
          activeSection={subPath ?? 'price'}
          onSectionChange={(id) => {
            navigate({
              to: `/offers/${offer.id}/${id}`,
              replace: false,
              resetScroll: false,
            });
          }}
        />

        <Outlet />
      </section>

      <SellerOffers
        id={offer.seller.id}
        name={offer.seller.name}
        currentOffer={offer.id}
      />
      <SuggestedOffers id={offer.id} />
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
                  'underline decoration-dotted underline-offset-4'
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
                <span>
                  {compareDates(new Date(pcReleaseDate), new Date(releaseDate))}
                </span>
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