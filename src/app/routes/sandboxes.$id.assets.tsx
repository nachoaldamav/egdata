import type { LoaderFunctionArgs } from '@remix-run/node';
import { type ClientLoaderFunctionArgs, useLoaderData } from '@remix-run/react';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '~/components/ui/table';
import { client } from '~/lib/client';
import type { Asset } from '~/types/asset';

export async function loader({ params }: LoaderFunctionArgs) {
  const [assetsData] = await Promise.allSettled([
    client.get<Asset[]>(`/sandboxes/${params.id}/assets`),
  ]);

  const assets = assetsData.status === 'fulfilled' ? assetsData.value.data : [];

  return { assets };
}

export async function clientLoader({ params }: ClientLoaderFunctionArgs) {
  const [assetsData] = await Promise.allSettled([
    client.get<Asset[]>(`/sandboxes/${params.id}/assets`),
  ]);

  const assets = assetsData.status === 'fulfilled' ? assetsData.value.data : [];

  return { assets };
}

export function HydrateFallback() {
  return (
    <section className="flex-1 p-4">
      <h1 className="text-2xl font-bold">Assets</h1>
      <div className="grid grid-cols-2 gap-4 mt-4 mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card className="w-full max-w-lg" key={i}>
            <CardHeader className="w-full">
              <Skeleton className="w-1/2" />
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      <Skeleton className="w-1/2" />
                    </TableHead>
                    <TableHead className="text-right">
                      <Skeleton className="w-1/4" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="w-1/2" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="w-1/4" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default function Index() {
  const { assets } = useLoaderData<typeof loader>();
  return (
    <section className="flex-1 p-4">
      <h1 className="text-2xl font-bold">Assets</h1>
      <div className="grid grid-cols-2 gap-4 mt-4 mx-auto">
        {assets
          .sort((a, b) => b.downloadSizeBytes - a.downloadSizeBytes)
          .map((asset) => (
            <Card className="w-full max-w-lg" key={asset.artifactId}>
              <CardHeader className="w-full">
                <h5 className="text-lg font-semibold font-mono text-center">{asset.artifactId}</h5>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Type</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Item</TableCell>
                      <TableCell className="text-right font-mono">{asset.itemId}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Download Size</TableCell>
                      <TableCell className="text-right">
                        {convertToMaxSize(asset.downloadSizeBytes)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Install Size</TableCell>
                      <TableCell className="text-right">
                        {convertToMaxSize(asset.installedSizeBytes)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Platform</TableCell>
                      <TableCell className="text-right">{asset.platform}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
      </div>
    </section>
  );
}

function convertToMaxSize(bytes: number) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  if (bytes === 0) return '0 Byte';

  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${Number.parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}
