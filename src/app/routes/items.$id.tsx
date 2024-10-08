import { type LoaderFunctionArgs, type MetaFunction, redirect } from '@remix-run/node';
import { useLoaderData, redirect as clientRedirect, Link } from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { Image } from '~/components/app/image';
import { getQueryClient } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import type { SingleItem } from '~/types/single-item';
import { internalNamespaces } from '~/lib/internal-namespaces';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { Badge } from '~/components/ui/badge';
import { Skeleton } from '~/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '~/components/ui/card';
import { PlayIcon } from '@radix-ui/react-icons';
import type { KeyImage } from '~/types/single-offer';
import { cn } from '~/lib/utils';
import { buildGameLauncherURI } from '~/lib/build-game-launcher';
import { useEffect, useState } from 'react';
import { httpClient } from '~/lib/http-client';
import { getPlatformsArray, textPlatformIcons } from '~/components/app/platform-icons';

const getItem = async (id: string) => {
  return httpClient.get<SingleItem>(`/items/${id}`);
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    return redirect('/');
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: [
      'item',
      {
        id,
      },
    ],
    queryFn: () => getItem(id),
  });

  return {
    id,
    dehydratedState: dehydrate(queryClient),
  };
}

type loader = typeof loader;

export const meta: MetaFunction<loader> = ({ data }) => {
  if (!data) {
    return [
      {
        title: 'Item not found',
        description: 'Item not found',
      },
    ];
  }

  const item = data.dehydratedState.queries.find((query) => query.queryKey[0] === 'item');

  if (!item) {
    return [
      {
        title: 'Item not found',
        description: 'Item not found',
      },
    ];
  }

  const itemData = item.state.data as SingleItem;

  return [
    {
      title: `${itemData.title} - item`,
      description: itemData.description,
    },
    {
      name: 'description',
      content: itemData.description,
    },
    {
      property: 'og:title',
      content: `${itemData.title} - item`,
    },
    {
      property: 'og:description',
      content: itemData.description,
    },
    {
      property: 'og:image',
      content: getImage(itemData.keyImages, ['DieselGameBoxWide'])?.url ?? '/placeholder.webp',
    },
    {
      property: 'og:image:width',
      content: '1920',
    },
    {
      property: 'og:image:height',
      content: '1080',
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      property: 'og:url',
      content: `https://egdata.app/items/${itemData.id}`,
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:title',
      content: `${itemData.title} - item`,
    },
    {
      name: 'twitter:description',
      content: itemData.description,
    },
    {
      name: 'twitter:image',
      content:
        getImage(itemData.keyImages, ['DieselGameBoxWide', 'DieselGameBox'])?.url ??
        '/placeholder.webp',
    },
  ];
};

export default function Index() {
  const { dehydratedState, id } = useLoaderData<loader>();

  return (
    <HydrationBoundary state={dehydratedState}>
      <ItemsPage id={id} />
    </HydrationBoundary>
  );
}

function ItemsPage({ id }: { id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['item', { id }],
    queryFn: () => getItem(id),
  });

  if (isLoading) {
    return <ItemsPageSkeleton />;
  }

  if (!data) {
    clientRedirect('/');
    return <div>Item not found</div>;
  }

  return (
    <div className="flex flex-col items-center w-full min-h-[75vh]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{data.title}</h1>
            <Badge>Item</Badge>
          </div>
          <div className="rounded-xl border border-gray-300/10 mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Item ID</TableHead>
                  <TableHead className="border-l-gray-300/10 border-l">{data.id}</TableHead>
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
                    <Link to={`/sandboxes/${data.namespace}/items`}>
                      {internalNamespaces.includes(data.namespace) ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>{data.namespace}</TooltipTrigger>
                            <TooltipContent>
                              <p>Epic Games internal namespace</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        data.namespace
                      )}
                    </Link>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Developer</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l">{data.developer}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Entitlement type</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l">
                    {data.entitlementType}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l">{data.status}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Creation Date</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l">
                    {new Date(data.creationDate).toLocaleString('en-UK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Last Modified</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l">
                    {new Date(data.lastModifiedDate).toLocaleString('en-UK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Platforms</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l inline-flex items-center justify-start gap-1">
                    {getPlatformsArray(data.releaseInfo)
                      .filter((platform) => textPlatformIcons[platform])
                      .map((platform) => (
                        <span key={platform}>{textPlatformIcons[platform]}</span>
                      ))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex flex-col items-start justify-center gap-4">
          <Image
            src={
              getImage(data.keyImages, ['DieselGameBoxWide', 'DieselGameBox'])?.url ??
              '/placeholder.webp'
            }
            alt={data.title}
            width={1920}
            height={1080}
            className="rounded-lg"
          />
          <p className="text-sm px-1">{data.description}</p>
        </div>
      </div>
      <hr className="w-full border-t border-gray-300/10 my-4" />
      <section className="w-full mt-4">
        <h2 className="text-2xl font-bold">Metadata</h2>
        <div className="rounded-xl border border-gray-300/10 mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Key</TableHead>
                <TableHead className="border-l-gray-300/10 border-l">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data.customAttributes).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{key}</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l font-mono">
                    {value.value}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
      {data.entitlementType === 'EXECUTABLE' && (
        <section className="w-full mt-4 flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Covers</h2>
          <div className="flex flex-col gap-4 w-full">
            {data.keyImages.findIndex((image: KeyImage) => image.type === 'DieselGameBoxTall') !==
              -1 && (
              <VerticalLauncherCard
                image={getImage(data.keyImages, ['DieselGameBoxTall'])?.url ?? '/placeholder.webp'}
                title={data.title}
                item={data}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Skeleton loader for the items page (Skeleton does not have property 'width' or 'height')
 */
function ItemsPageSkeleton() {
  return (
    <div className="flex flex-col items-center w-full min-h-[75vh]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="flex flex-col gap-4 w-full">
          <Skeleton style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="flex flex-col items-start justify-center gap-4">
          <Skeleton className="rounded-lg" style={{ width: '100%', height: '350px' }} />
          <Skeleton style={{ width: '100%', height: '100px' }} />
        </div>
      </div>
      <hr className="w-full border-t border-gray-300/10 my-4" />
      <section className="w-full mt-4 gap-2 flex flex-col">
        <h2 className="text-2xl font-bold">Metadata</h2>
        <Skeleton style={{ width: '100%', height: '500px' }} />
      </section>
    </div>
  );
}

interface VerticalLauncherCardProps {
  image: string;
  title: string;
  item: SingleItem;
}

function VerticalLauncherCard({ image, title, item }: VerticalLauncherCardProps) {
  const hasAssets = item.releaseInfo.length > 0;
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(100);

  const handleClick = () => {
    if (hasAssets) {
      setLoading(true);
    }
  };

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            const uri = buildGameLauncherURI({
              namespace: item.namespace,
              asset: {
                assetId: item.releaseInfo[0].appId,
                itemId: item.id,
              },
            });
            open(uri, '_blank', 'noreferrer');
            setLoading(false);
            return 0;
          }
          return prev - 4; // Adjust this value for faster or slower loading
        });
      }, 50); // Adjust this value for smoother or more incremental loading

      return () => clearInterval(interval);
    }
  }, [loading, item]);

  return (
    <Card
      className={cn(
        'w-[250px] bg-transparent border-0 text-card-foreground cursor-not-allowed group',
        hasAssets && 'cursor-pointer',
      )}
      onClick={handleClick}
    >
      <CardContent className="p-0 relative">
        <div className="relative z-10">
          <Image
            src={image}
            alt={title}
            width={400}
            height={550}
            className="rounded"
            quality="high"
          />
        </div>
        {loading && progress > 0 && (
          <div
            className="absolute top-0 left-0 bg-white/5 transition-all duration-300 ease-in-out rounded"
            style={{
              width: `${100 - progress}%`,
              height: '100%',
              zIndex: 999,
            }}
          />
        )}
      </CardContent>
      <CardFooter className="px-1 py-2">
        <div className="space-y-1 w-full">
          <div className="flex items-center justify-between w-full">
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <span className="p-0 text-gray-400 group-hover:text-white inline-flex items-center justify-center gap-0 transition-all duration-300 ease-in-out">
            <PlayIcon className="mr-2 h-4 w-4" />
            Launch
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
