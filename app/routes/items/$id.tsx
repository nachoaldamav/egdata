import { httpClient } from '@/lib/http-client';
import type { SingleItem } from '@/types/single-item';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@/components/ui/table';
import { Image } from '@/components/app/image';
import { getImage } from '@/lib/getImage';
import {
  getPlatformsArray,
  textPlatformIcons,
} from '@/components/app/platform-icons';
import { Link } from '@tanstack/react-router';
import { internalNamespaces } from '@/lib/internal-namespaces';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { KeyImage } from '@/types/single-offer';
import { useEffect, useState } from 'react';
import { buildGameLauncherURI } from '@/lib/build-game-launcher';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PlayIcon } from 'lucide-react';
import { SectionsNav } from '@/components/app/offer-sections';
import { generateItemMeta } from '@/lib/generate-item-meta';
import { getFetchedQuery } from '@/lib/get-fetched-query';
import { getQueryClient } from '@/lib/client';

export const Route = createFileRoute('/items/$id')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();

    return (
      <HydrationBoundary state={dehydratedState}>
        <ItemPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ context, params }) => {
    const { id } = params;
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['item', { id }],
      queryFn: () => httpClient.get<SingleItem>(`/items/${id}`),
    });

    return {
      id,
      dehydratedState: dehydrate(queryClient),
    };
  },

  meta({ params, loaderData }) {
    const queryClient = getQueryClient();
    const { dehydratedState } = loaderData;
    const { id } = params;

    const item = getFetchedQuery<SingleItem>(queryClient, dehydratedState, [
      'item',
      { id },
    ]);

    if (!item) {
      return [
        {
          title: 'Item not found',
          description: 'Item not found',
        },
      ];
    }

    return generateItemMeta(item);
  },
});

function ItemPage() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();
  const subPath = useLocation().pathname.split(`/${id}/`)[1];
  const { data: item } = useQuery({
    queryKey: ['item', { id }],
    queryFn: () => httpClient.get<SingleItem>(`/items/${id}`),
  });

  if (!item) {
    return null;
  }

  return (
    <div className="flex flex-col items-center w-full min-h-[75vh]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{item.title}</h1>
            <Badge>Item</Badge>
          </div>
          <div className="rounded-xl border border-gray-300/10 mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Item ID</TableHead>
                  <TableHead className="border-l-gray-300/10 border-l">
                    {item.id}
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
                    <Link to={`/sandboxes/${item.namespace}/items`}>
                      {internalNamespaces.includes(item.namespace) ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>{item.namespace}</TooltipTrigger>
                            <TooltipContent>
                              <p>Epic Games internal namespace</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        item.namespace
                      )}
                    </Link>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Developer</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l">
                    {item.developer}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Entitlement type
                  </TableCell>
                  <TableCell className="border-l-gray-300/10 border-l">
                    {item.entitlementType}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l">
                    {item.status}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Creation Date</TableCell>
                  <TableCell className="border-l-gray-300/10 border-l">
                    {new Date(item.creationDate).toLocaleString('en-UK', {
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
                    {new Date(item.lastModifiedDate).toLocaleString('en-UK', {
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
                    {getPlatformsArray(item.releaseInfo)
                      .filter((platform) => textPlatformIcons[platform])
                      .map((platform) => (
                        <span key={platform}>
                          {textPlatformIcons[platform]}
                        </span>
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
              getImage(item.keyImages, ['DieselGameBoxWide', 'DieselGameBox'])
                ?.url ?? '/placeholder.webp'
            }
            alt={item.title}
            width={1920}
            height={1080}
            className="rounded-lg"
          />
          <p className="text-sm px-1">{item.description}</p>
        </div>
      </div>
      <hr className="w-full border-t border-gray-300/10 my-4" />

      <div className="flex flex-row items-start justify-start h-full gap-4 w-full min-h-[75vh]">
        <aside>
          <SectionsNav
            links={[
              {
                id: '',
                label: (
                  <span className="inline-flex items-center gap-2">
                    <span>Item</span>
                  </span>
                ),
                href: `/items/${id}`,
              },
              {
                id: 'assets',
                label: (
                  <span className="inline-flex items-center gap-2">
                    <span>Assets</span>
                  </span>
                ),
                href: `/items/${id}/assets`,
              },
              {
                id: 'images',
                label: (
                  <span className="inline-flex items-center gap-2">
                    <span>Images</span>
                  </span>
                ),
                href: `/items/${id}/images`,
              },
              {
                id: 'builds',
                label: (
                  <span className="inline-flex items-center gap-2">
                    <span>Builds</span>
                  </span>
                ),
                href: `/items/${id}/builds`,
              },
            ]}
            activeSection={subPath ?? ''}
            onSectionChange={(location) => {
              navigate({
                to: `/items/${id}/${location}`,
                replace: false,
                resetScroll: false,
              });
            }}
            orientation="vertical"
          />
        </aside>
        <Outlet />
      </div>
    </div>
  );
}

interface VerticalLauncherCardProps {
  image: string;
  title: string;
  item: SingleItem;
}

function VerticalLauncherCard({
  image,
  title,
  item,
}: VerticalLauncherCardProps) {
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
          return prev - 4;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [loading, item]);

  return (
    <Card
      className={cn(
        'w-[250px] bg-transparent border-0 text-card-foreground cursor-not-allowed group',
        hasAssets && 'cursor-pointer'
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
