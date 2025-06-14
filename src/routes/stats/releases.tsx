import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { httpClient } from '@/lib/http-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import {
  CartesianGrid,
  XAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getReleasesByMonth,
  ReleasesByMonth,
} from '@/components/charts/releases/montly';
import {
  getReleasesByYear,
  ReleasesByYear,
} from '@/components/charts/releases/yearly';

export const Route = createFileRoute('/stats/releases')({
  component: RouteComponent,

  loader: async ({ context }) => {
    const { queryClient } = context;

    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['releases-by-month'],
        queryFn: getReleasesByMonth,
      }),
      queryClient.prefetchQuery({
        queryKey: ['releases-by-year'],
        queryFn: getReleasesByYear,
      }),
    ]);
  },

  head: () => {
    return {
      meta: [
        {
          title: 'Releases stats - egdata.app',
        },
        {
          name: 'description',
          content:
            'Monthly and yearly cadence of new titles landing on the Epic Games Store.',
        },
      ],
    };
  },
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-8 min-h-[80vh]">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold">Epic Games Store release stats</h2>
        <p className="text-sm text-gray-500">
          Monthly and yearly cadence of new titles landing on the store.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Monthly releases</CardTitle>
        </CardHeader>
        <CardContent>
          <ReleasesByMonth />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yearly releases</CardTitle>
        </CardHeader>
        <CardContent>
          <ReleasesByYear />
        </CardContent>
      </Card>
    </div>
  );
}
