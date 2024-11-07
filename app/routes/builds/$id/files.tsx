import { DynamicPagination } from '@/components/app/dynamic-pagination';
import { Separator } from '@/components/ui/separator';
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
import { calculateSize } from '@/lib/calculate-size';
import { fileTypes } from '@/lib/filetypes';
import { getHashType } from '@/lib/get-hash-type';
import { httpClient } from '@/lib/http-client';
import type { BuildFiles } from '@/types/builds';
import {
  dehydrate,
  HydrationBoundary,
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/builds/$id/files')({
  component: () => {
    const { dehydratedState } = Route.useLoaderData();
    return (
      <HydrationBoundary state={dehydratedState}>
        <FilesPage />
      </HydrationBoundary>
    );
  },

  loader: async ({ params, context }) => {
    const { id } = params;
    const { queryClient } = context;

    await queryClient.prefetchQuery({
      queryKey: ['build-files', { id, page: 1 }],
      queryFn: () =>
        httpClient.get<BuildFiles>(`/builds/${id}/files`, {
          params: {
            page: 1,
          },
        }),
    });

    return {
      id,
      dehydratedState: dehydrate(queryClient),
    };
  },
});

function FilesPage() {
  const { id } = Route.useLoaderData();
  const [page, setPage] = useState(1);
  const { data: files, isFetching } = useQuery({
    queryKey: ['build-files', { id, page }],
    queryFn: () =>
      httpClient.get<BuildFiles>(`/builds/${id}/files`, {
        params: {
          page,
        },
      }),
    placeholderData: keepPreviousData,
  });

  return (
    <TooltipProvider>
      <main className="flex flex-col items-start justify-start h-full gap-1 px-4 w-full">
        <p className="text-lg font-semibold">Files</p>
        <p className="text-sm text-gray-400">{files?.total} files found</p>
        <Separator orientation="horizontal" className="my-4" />
        <Table className="relative">
          {isFetching && (
            <div className="absolute inset-0 bg-opacity-50 bg-gray-900 z-10 w-full h-full flex items-center justify-center rounded-xl">
              <span className="flex flex-col items-center justify-center gap-2">
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-sm font-medium">Loading...</span>
                  <span className="text-xs text-gray-400">
                    Fetching latest data
                  </span>
                </div>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
            </div>
          )}
          <TableHeader>
            <TableRow>
              <TableHead className="w-[600px]">File Name</TableHead>
              <TableHead>Hash</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files?.files.map((file) => (
              <TableRow key={file._id}>
                <TableCell className="font-mono">{file.fileName}</TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TableCell className="text-left inline-flex items-center gap-1 font-mono cursor-help">
                      {`${file.fileHash.slice(0, 6)}...${file.fileHash.slice(-6)}`}
                      <span className="text-xs text-gray-400">
                        ({getHashType(file.fileHash)})
                      </span>
                    </TableCell>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{file.fileHash}</p>
                  </TooltipContent>
                </Tooltip>
                <TableCell>
                  {fileTypes[file.mimeType] ??
                    fileTypes[file.fileName.split('.').pop() as string] ??
                    file.fileName.split('.').pop()?.toUpperCase()}
                </TableCell>
                <TableCell className="text-right">
                  {calculateSize(file.fileSize)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {files && (
          <DynamicPagination
            currentPage={page}
            setPage={(page) => {
              setPage(page);
            }}
            totalPages={Math.ceil(files?.total / files?.limit)}
          />
        )}
      </main>
    </TooltipProvider>
  );
}
