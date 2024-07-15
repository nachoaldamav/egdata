import type { LoaderFunctionArgs } from '@remix-run/node';
import {
  Link,
  Outlet,
  useLoaderData,
  useNavigate,
  useNavigation,
  type MetaFunction,
} from '@remix-run/react';
import { Image } from '~/components/app/image';
import { client } from '~/lib/client';
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
import { useQuery } from '@tanstack/react-query';
import cookie from 'cookie';
import { useEffect, useRef, useState } from 'react';

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
  const url = new URL(request.url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  const [offerData, itemsData, priceData] = await Promise.allSettled([
    client
      .get<SingleOffer>(`/offers/${params.id}`)
      .then((response) => {
        return response.data;
      })
      .catch(
        () =>
          ({
            title: 'Error',
            description: 'Offer not found',
          }) as SingleOffer,
      ),
    client
      .get<Array<SingleItem>>(`/items-from-offer/${params.id}`)
      .then((response) => response.data)
      .catch(() => [] as SingleItem[]),
    client
      .get<Price>(`/offers/${params.id}/price?country=${country || 'US'}`)
      .then((response) => response.data),
  ]);

  const subPath = request.url.split(`/${params.id}/`)[1] as string | undefined;

  const offer = offerData.status === 'fulfilled' ? offerData.value : null;
  const items = itemsData.status === 'fulfilled' ? itemsData.value : null;
  const price = priceData.status === 'fulfilled' ? priceData.value : null;

  return {
    offer: offer as SingleOffer,
    items: (items ?? []) as SingleItem[],
    subPath,
    price: price as Price,
  };
}

export async function clientLoader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const country = getCountryCode(url, cookie.parse(request.headers.get('Cookie') || ''));

  const [offerData, itemsData, priceData] = await Promise.allSettled([
    client
      .get<SingleOffer>(`/offers/${params.id}`)
      .then((response) => {
        return response.data;
      })
      .catch(
        () =>
          ({
            title: 'Error',
            description: 'Offer not found',
          }) as SingleOffer,
      ),
    client
      .get<Array<SingleItem>>(`/items-from-offer/${params.id}`)
      .then((response) => response.data)
      .catch(() => [] as SingleItem[]),
    client
      .get<Price>(`/offers/${params.id}/price?country=${country || 'US'}`)
      .then((response) => response.data),
  ]);

  const offer = offerData.status === 'fulfilled' ? offerData.value : null;
  const items = itemsData.status === 'fulfilled' ? itemsData.value : null;
  const price = priceData.status === 'fulfilled' ? priceData.value : null;

  const subPath = request.url.split(`/${params.id}/`)[1] as string | undefined;

  return {
    offer: offer as SingleOffer,
    items: (items ?? []) as SingleItem[],
    subPath,
    price,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      {
        title: 'Offer not found',
        description: 'Offer not found',
      },
    ];
  }

  const { offer: offerData, price } = data;

  if (offerData.title === 'Error') {
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
        .concat(offerData.tags.map((tag) => tag.name))
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
        operatingSystem: supportedPlatforms(data.items).join(', '),
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
};

export default function Index() {
  const navigate = useNavigate();
  const navigation = useNavigation();
  const {
    offer: offerData,
    items,
    subPath: serverSubPath,
  } = useLoaderData<typeof loader | typeof clientLoader>();

  const subPath = serverSubPath ?? navigation.location?.pathname.split(`/${offerData.id}/`)[1];

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
                  <TableCell className={'text-left font-mono border-l-gray-300/10 border-l'}>
                    <Link to={`/sandboxes/${offerData.namespace}/offers`}>
                      {internalNamespaces.includes(offerData.namespace) ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="underline decoration-dotted underline-offset-4">
                              {offerData.namespace}
                            </TooltipTrigger>
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
                    {offerData.seller.name}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Developer</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {offerData.customAttributes?.developerName?.value ??
                      offerData.developerDisplayName ??
                      offerData.seller.name}
                    {offerData.publisherDisplayName !== offerData.developerDisplayName && (
                      <span className="opacity-50">({offerData.publisherDisplayName})</span>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Supported Platforms</TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l">
                    {supportedPlatforms(items).length > 0
                      ? supportedPlatforms(items).join(', ')
                      : 'Unknown'}
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

      <section id="offer-information" className="w-full">
        <Tabs
          defaultValue={subPath ?? 'price'}
          className="w-full min-h-96"
          onValueChange={(value: string) => {
            if (value === 'price') {
              navigate(`/offers/${offerData.id}`);
              return;
            }
            navigate(`/offers/${offerData.id}/${value}`);
          }}
          key={`subsection-${offerData.id}`}
        >
          <TabsList>
            <TabsTrigger value="price">Price</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="related">Related</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="changelog">Changelog</TabsTrigger>
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
        </Tabs>
      </section>
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
  });
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoUrl = media?.videos[0]?.outputs
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
          getImage(offer.keyImages, ['OfferImageWide', 'DieselGameBoxWide', 'TakeoverWide'])?.url
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
