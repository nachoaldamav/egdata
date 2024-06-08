import type { LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, type MetaFunction } from '@remix-run/react';
import { Image } from '~/components/app/image';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { getSeller } from '~/lib/get-seller';
import type { SingleOffer } from '~/types/single-offer';
import type { SingleItem } from '~/types/single-item';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { offersDictionary } from '~/lib/offers-dictionary';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';

export async function loader({ params }: LoaderFunctionArgs) {
  const [offer, items] = await Promise.all([
    client.get<SingleOffer>(`/offers/${params.id}`).then((response) => {
      if (response.status === 404) {
        return {
          title: 'Error',
          description: 'Offer not found',
        };
      }
      return response.data;
    }),
    client
      .get<Array<SingleItem>>(`/items-from-offer/${params.id}`)
      .then((response) => response.data)
      .catch(() => [] as SingleItem[]),
  ]);

  return {
    offer: offer as SingleOffer,
    items: (items ?? []) as SingleItem[],
  };
}

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
  if (!data) {
    return [
      {
        title: 'Offer not found',
        description: 'Offer not found',
      },
    ];
  }

  const { offer: offerData } = data;

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
      description: offerData.description,
      'script:ld+json': {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: offerData.title,
        applicationCategory: 'Game',
        description: offerData.description,
        softwareVersion: undefined,
        operatingSystem: supportedPlatforms(data.items).join(', '),
        datePublished: offerData.releaseDate,
        dateModified: offerData.lastModifiedDate,
        publisher: {
          '@type': 'Organization',
          name: offerData.seller.name,
        },
        // offers: {
        //   '@type': 'Offer',
        //   price: (offerData.price?.totalPrice.discountPrice || 0) / 100,
        //   priceCurrency: offerData.price?.currency,
        //   priceValidUntil: undefined,
        //   availability: 'https://schema.org/InStock',
        //   url: `https://store.epicgames.com/product/${
        //     offerData.productSlug ?? offerData.url ?? offerData.urlSlug
        //   }`,
        // },
        sameAs: `https://store.epicgames.com/product/${
          offerData.productSlug ?? offerData.url ?? offerData.urlSlug
        }`,
        image: getImage(offerData.keyImages, [
          'OfferImageWide',
          'DieselGameBoxWide',
          'TakeoverWide',
        ]).url,
      },
    },
    {
      'og:title': `${offerData.title} - egdata.app`,
      'og:description': offerData.description,
      'og:image': getImage(offerData.keyImages, [
        'OfferImageWide',
        'DieselGameBoxWide',
        'TakeoverWide',
      ]).url,
      'og:type': 'product',
      'og:url': `https://egdata.app/offers/${offerData.id}`,
    },
  ];
};

export default function Index() {
  const { offer: offerData, items } = useLoaderData<typeof loader>();

  if (!offerData) {
    return <div>Offer not found</div>;
  }

  if (offerData.title === 'Error') {
    return <div>{offerData.description}</div>;
  }

  return (
    <main className="flex flex-col items-start justify-start w-full min-h-screen">
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
            })}
          </h4>
          <div className="rounded-xl border border-gray-300/10">
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
                  <TableCell className="text-left font-mono border-l-gray-300/10 border-l">
                    {offerData.namespace}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Offer Type</TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l">
                    {offersDictionary[offerData.offerType]}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Seller</TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l">
                    {offerData.seller.name}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Supported Platforms
                  </TableCell>
                  <TableCell className="text-left border-l-gray-300/10 border-l">
                    {supportedPlatforms(items).length > 0
                      ? supportedPlatforms(items).join(', ')
                      : 'Unknown'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Developer</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {offerData.developerDisplayName ?? offerData.seller.name}
                    {offerData.publisherDisplayName !==
                      offerData.developerDisplayName && (
                      <span className="opacity-50">
                        ({offerData.publisherDisplayName})
                      </span>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Release Date</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {!offerData.releaseDate.includes('2099')
                      ? new Date(offerData.releaseDate).toLocaleDateString(
                          'en-UK',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )
                      : 'Not available'}
                    {!offerData.releaseDate.includes('2099') && (
                      <TimeAgo targetDate={offerData.releaseDate} />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Last Update</TableCell>
                  <TableCell className="text-left inline-flex items-center gap-1 border-l-gray-300/10 border-l">
                    {offerData.lastModifiedDate
                      ? new Date(offerData.lastModifiedDate).toLocaleDateString(
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
                    <TimeAgo targetDate={offerData.lastModifiedDate} />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <InternalBanner
            title={offerData.title}
            namespace={offerData.namespace}
          />
        </div>
        <div className="flex justify-center flex-col">
          <Image
            src={
              getImage(offerData.keyImages, [
                'OfferImageWide',
                'DieselGameBoxWide',
                'TakeoverWide',
              ]).url
            }
            alt={offerData.title}
            width={1920}
            height={1080}
            className="rounded-xl shadow-lg"
          />
          <p className="pt-2 px-1">{offerData.description}</p>
        </div>
      </header>
      <section id="items" className="w-full">
        <h2 className="text-2xl font-bold">Items</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Item ID</TableHead>
              <TableHead>Item Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.id}</TableCell>
                <TableCell className="text-left">{item.title}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}

const TimeAgo: React.FC<{
  targetDate: string;
}> = ({ targetDate }) => {
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const lastModified = new Date(date);
    const diffInMilliseconds = now.getTime() - lastModified.getTime();

    const seconds = Math.floor(diffInMilliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    let timeAgo: number;
    let unit: Intl.RelativeTimeFormatUnit;

    if (Math.abs(years) > 0) {
      timeAgo = years;
      unit = 'year';
    } else if (Math.abs(months) > 0) {
      timeAgo = months;
      unit = 'month';
    } else if (Math.abs(days) > 0) {
      timeAgo = days;
      unit = 'day';
    } else if (Math.abs(hours) > 0) {
      timeAgo = hours;
      unit = 'hour';
    } else if (Math.abs(minutes) > 0) {
      timeAgo = minutes;
      unit = 'minute';
    } else {
      timeAgo = seconds;
      unit = 'second';
    }

    return new Intl.RelativeTimeFormat('en', {
      localeMatcher: 'best fit',
      numeric: 'always',
      style: 'long',
    }).format(-timeAgo, unit);
  };

  return (
    <span className="opacity-50">
      ({targetDate ? getTimeAgo(targetDate) : 'Not available'})
    </span>
  );
};

const internalNamespaces = ['epic', 'SeaQA'];

const InternalBanner: React.FC<{
  title: string;
  namespace: string;
}> = ({ title, namespace }) => {
  if (!internalNamespaces.includes(namespace)) {
    return null;
  }
  const [results, setResults] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    client
      .get<{
        elements: Array<{
          _id: string;
          id: string;
          namespace: string;
          title: string;
          keyImages: Array<{
            type: string;
            url: string;
            md5: string;
          }>;
        }>;
        total: number;
      }>(`/autocomplete?query=${title}`)
      .then((response) => {
        setResults(
          response.data.elements.filter(
            ({ namespace }) => !internalNamespaces.includes(namespace)
          )
        );
      });
  }, [title]);

  return (
    <Alert variant="destructive" className="mt-1">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle className="font-bold">Epic Internal Offer</AlertTitle>
      <AlertDescription>
        This offer is an internal entry from Epic Games and may not be available
        to the general public.
      </AlertDescription>
      {results.length > 0 && (
        <Link to={`/offers/${results[0].id}`} className="underline">
          Go to public offer
        </Link>
      )}
    </Alert>
  );
};
