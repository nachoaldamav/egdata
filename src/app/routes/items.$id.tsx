import { type LoaderFunctionArgs, redirect } from '@remix-run/node';
import {
  type ClientLoaderFunctionArgs,
  useLoaderData,
  redirect as clientRedirect,
  Link,
} from '@remix-run/react';
import { dehydrate, HydrationBoundary, useQuery } from '@tanstack/react-query';
import { Image } from '~/components/app/image';
import { client, getQueryClient } from '~/lib/client';
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

const getItem = async (id: string) => {
  return client.get<SingleItem>(`/items/${id}`).then((res) => res.data);
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

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const { id } = params;

  if (!id) {
    return clientRedirect('/');
  }

  return {
    id: id,
    dehydratedState: undefined,
  };
}

type loader = typeof loader | typeof clientLoader;

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
                    {/* {data.creationDate} */}
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
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex flex-col items-start justify-center gap-4">
          <Image
            src={getImage(data.keyImages, ['DieselGameBoxWide'])?.url ?? '/placeholder.webp'}
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
