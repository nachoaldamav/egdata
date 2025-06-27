import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';

interface Position {
  date: string;
  position: number;
  _id: string;
}

interface PerformancePositionsChartProps {
  positions: Position[];
  timeframe: { from: Date; to: Date };
}

const chartConfig: ChartConfig = {
  position: { label: 'Position', color: 'hsl(var(--chart-1))' },
};

export function PerformancePositionsChart({
  positions,
  timeframe,
}: PerformancePositionsChartProps) {
  // Prepare chart data: filter by timeframe, sort by date ascending
  const chartData = useMemo(() => {
    if (!positions?.length) return [];
    return positions
      .filter((pos) => {
        const date = new Date(pos.date);
        return date >= timeframe.from && date <= timeframe.to;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((pos) => ({
        ...pos,
        // Normalize 0 => 100 for 'out of top'
        position: pos.position === 0 ? 100 : pos.position,
        dateLabel: new Date(pos.date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        }),
      }));
  }, [positions, timeframe]);

  if (!chartData.length) return <div>No data for selected range</div>;

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <LineChart
        data={chartData}
        margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="dateLabel"
          tickMargin={6}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[1, 100]}
          reversed
          tickCount={10}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              className="w-[140px]"
              nameKey="dateLabel"
              labelFormatter={(label: string) => label}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="position"
          stroke="var(--color-position)"
          strokeWidth={2}
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
