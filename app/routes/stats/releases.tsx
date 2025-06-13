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
import { CartesianGrid, XAxis, LineChart, Line, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyRelease {
  releases: number;
  year: number;
  month: number;
}

interface YearlyRelease {
  releases: number;
  year: number;
}

const getReleasesByMonth = async () =>
  httpClient.get<MonthlyRelease[]>('/stats/releases/monthly');

const getReleasesByYear = async () =>
  httpClient.get<YearlyRelease[]>('/stats/releases/yearly');

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

function linearRegression(x: number[], y: number[]) {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0 };

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, v, i) => acc + v * y[i], 0);
  const sumXX = x.reduce((acc, v) => acc + v * v, 0);

  const denom = n * sumXX - sumX * sumX;
  if (!denom) return { slope: 0, intercept: sumY / n };

  return {
    slope: (n * sumXY - sumX * sumY) / denom,
    intercept: (sumY - (sumX * (n * sumXY - sumX * sumY)) / denom) / n,
  };
}

interface MonthlyChartPoint {
  date: string;
  releases?: number;
  ongoing?: number;
  prediction?: number;
}

const monthlyChartConfig: ChartConfig = {
  releases: { label: 'Releases', color: 'hsl(var(--chart-1))' },
  ongoing: { label: 'Ongoing', color: 'oklch(0.6 0.118 184.704)' },
  prediction: { label: 'Prediction', color: 'var(--chart-3)' },
} as const;

const toMonthlyBase = (data: MonthlyRelease[]) =>
  data.map(({ year, month, releases }) => ({
    date: new Date(year, month - 1, 1).toISOString(),
    releases,
  }));

function ReleasesByMonth() {
  const { data, isLoading } = useQuery({
    queryKey: ['releases-by-month'],
    queryFn: getReleasesByMonth,
    placeholderData: keepPreviousData,
  });

  const chartData = useMemo<MonthlyChartPoint[]>(() => {
    if (!data?.length) return [];

    const base = toMonthlyBase(data);
    const lastIdx = base.length - 1;
    const lastDate = new Date(base[lastIdx].date);
    const now = new Date();

    const isOngoingMonth =
      lastDate.getFullYear() === now.getFullYear() &&
      lastDate.getMonth() === now.getMonth();

    const regressionRows = isOngoingMonth ? base.slice(0, -1) : base;
    const x = regressionRows.map((_, i) => i);
    const y = regressionRows.map((d) => d.releases);
    const { slope, intercept } = linearRegression(x, y);

    const predictedOngoing = Math.max(
      0,
      Math.round(slope * regressionRows.length + intercept),
    );
    const predictedNext = Math.max(
      0,
      Math.round(slope * (regressionRows.length + 1) + intercept),
    );

    const prevIdxs = [lastIdx - 2, lastIdx - 1].filter((idx) => idx >= 0);

    const points: MonthlyChartPoint[] = base.map((row, i) => {
      const isOngoing =
        isOngoingMonth && (prevIdxs.includes(i) || i === lastIdx);
      return {
        date: row.date,
        releases:
          !isOngoingMonth || i < base.length - 1 ? row.releases : undefined,
        ongoing: isOngoing ? row.releases : undefined,
        prediction: i === regressionRows.length - 1 ? row.releases : undefined,
      };
    });

    if (isOngoingMonth) {
      points[points.length - 1].prediction = predictedOngoing;
    }

    const nextMonth = new Date(base[base.length - 1].date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    points.push({
      date: nextMonth.toISOString(),
      prediction: predictedNext,
    });

    return points;
  }, [data]);

  if (isLoading && !data) return <div>Loading…</div>;
  if (!chartData.length) return null;

  return (
    <ChartContainer
      config={monthlyChartConfig}
      className="aspect-auto h-[250px] w-full"
    >
      <LineChart
        accessibilityLayer
        data={chartData}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickMargin={8}
          minTickGap={32}
          tickLine={false}
          axisLine={false}
          tickFormatter={(iso: string) =>
            new Date(iso).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })
          }
        />

        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[150px]"
              nameKey="date"
              labelFormatter={(iso: string) =>
                new Date(iso).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })
              }
            />
          }
        />

        <Line
          dataKey="releases"
          type="monotone"
          stroke="var(--color-releases)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="ongoing"
          type="monotone"
          stroke="var(--color-releases)"
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="prediction"
          type="monotone"
          stroke="var(--color-prediction)"
          strokeWidth={1.5}
          strokeDasharray="6 6"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}

interface YearlyChartPoint {
  year: number;
  releases?: number;
  ongoing?: number;
  prediction?: number;
}

const yearlyChartConfig: ChartConfig = {
  releases: { label: 'Releases', color: 'hsl(var(--chart-1))' },
  ongoing: { label: 'YTD', color: 'oklch(0.6 0.118 184.704)' },
  prediction: { label: 'Prediction', color: 'oklch(0.398 0.07 227.392)' },
} as const;

function ReleasesByYear() {
  const { data, isLoading } = useQuery({
    queryKey: ['releases-by-year'],
    queryFn: getReleasesByYear,
    placeholderData: keepPreviousData,
  });

  const chartData = useMemo<YearlyChartPoint[]>(() => {
    if (!data?.length) return [];

    const base = data.map(({ year, releases }) => ({ year, releases }));
    const lastIdx = base.length - 1;
    const lastYear = base[lastIdx].year;
    const currentYear = new Date().getFullYear();
    const isCurrentYearOngoing = lastYear === currentYear;

    const regressionRows = isCurrentYearOngoing ? base.slice(0, -1) : base;
    const x = regressionRows.map((_, i) => i);
    const y = regressionRows.map((d) => d.releases);
    const { slope, intercept } = linearRegression(x, y);

    const forecastCurrentTotal = isCurrentYearOngoing
      ? Math.max(0, Math.round(slope * regressionRows.length + intercept))
      : undefined;
    const forecastNextYearTotal = Math.max(
      0,
      Math.round(slope * (regressionRows.length + 1) + intercept),
    );

    const points: YearlyChartPoint[] = base.map((row, i) => {
      if (isCurrentYearOngoing && i === lastIdx) {
        const ongoing = row.releases;
        const remainderPrediction = Math.max(
          0,
          (forecastCurrentTotal ?? 0) - ongoing,
        );
        return {
          year: row.year,
          releases: 0,
          ongoing,
          prediction: remainderPrediction,
        };
      }

      return {
        year: row.year,
        releases: row.releases,
        ongoing: 0,
        prediction: 0,
      };
    });

    points.push({
      year: lastYear + 1,
      releases: 0,
      ongoing: 0,
      prediction: forecastNextYearTotal,
    });

    return points;
  }, [data]);

  if (isLoading && !data) return <div>Loading…</div>;
  if (!chartData.length) return null;

  return (
    <ChartContainer
      config={yearlyChartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{ left: 12, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="year"
          tickMargin={6}
          tickLine={false}
          axisLine={false}
        />

        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[140px]"
              nameKey="year"
              labelFormatter={(year: number) => year.toString()}
            />
          }
        />

        <Bar
          dataKey="releases"
          fill="var(--color-releases)"
          isAnimationActive={false}
          stackId="releases"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="ongoing"
          fill="var(--color-ongoing)"
          isAnimationActive={false}
          stackId="releases"
        />
        <Bar
          dataKey="prediction"
          fill="var(--color-prediction)"
          fillOpacity={0.6}
          isAnimationActive={false}
          stackId="releases"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
