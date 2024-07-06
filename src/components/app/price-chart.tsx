import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import type { Price } from '~/types/price';
import { Checkbox } from '~/components/ui/checkbox';

const chartConfig = {
  price: {
    label: 'Region',
    color: 'hsl(var(--chart-1))',
  },
  usd: {
    label: 'US Price',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

interface PriceChartProps {
  selectedRegion: string;
  priceData: Record<string, Price[]>;
}

export function PriceChart({ selectedRegion, priceData }: PriceChartProps) {
  const [timeRange, setTimeRange] = React.useState('1y');
  const [compareUSD, setCompareUSD] = React.useState(false);
  const regionPricing = priceData[selectedRegion];
  const usdPricing = priceData.US;

  const filteredData = regionPricing
    .map((item, index) => {
      const date = new Date(item.updatedAt);
      const isComparison = compareUSD;

      if (isComparison) {
        return {
          date: date.toISOString(),
          price: item.price.basePayoutPrice / 100,
          usd: usdPricing[index]?.price.discountPrice / 100,
        };
      }

      return {
        date: date.toISOString(),
        price: item.price.discountPrice / 100,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter((item) => {
      const date = new Date(item.date);

      const now = new Date();
      let daysToSubtract = 365;
      if (timeRange === 'all') return true;
      if (timeRange === '3y') {
        daysToSubtract = 1095; // 3 years
      } else if (timeRange === '1y') {
        daysToSubtract = 365; // 1 year
      }
      now.setDate(now.getDate() - daysToSubtract);
      return date >= now;
    });

  return (
    <Card className="w-3/4 mx-auto" id="price-chart">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Region Price chart</CardTitle>
          <CardDescription>Price chart for {selectedRegion} region</CardDescription>
        </div>
        <div className="items-center flex space-x-2">
          <Checkbox
            id="compare"
            checked={compareUSD}
            onCheckedChange={(value) => setCompareUSD(Boolean(value))}
            disabled={selectedRegion === 'US'}
          />
          <label
            htmlFor="compare"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Compare with USD
          </label>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">
              All
            </SelectItem>
            <SelectItem value="3y" className="rounded-lg">
              Last 3 years
            </SelectItem>
            <SelectItem value="1y" className="rounded-lg">
              Last 1 year
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillUSD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-usd)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-usd)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const formatter = new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: compareUSD ? 'USD' : regionPricing[0].price.currencyCode,
                });

                return formatter.format(value);
              }}
            />
            <ChartTooltip
              cursor={true}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                  formatter={(value, key) => {
                    const formatter = new Intl.NumberFormat(undefined, {
                      style: 'currency',
                      currency: compareUSD ? 'USD' : regionPricing[0].price.currencyCode,
                    });

                    return (
                      <span className="inline-flex items-center justify-start gap-1">
                        <span
                          className="h-2 w-2 shrink-0 rounded-[2px]"
                          style={{ backgroundColor: chartConfig[key as 'price' | 'usd'].color }}
                        />
                        <span>
                          {chartConfig[key as 'price' | 'usd'].label === 'Region'
                            ? selectedRegion
                            : 'US'}
                          :
                        </span>
                        {formatter.format(value as number)}
                      </span>
                    );
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="price"
              type="step"
              fill="url(#fillPrice)"
              stroke="var(--color-price)"
              stackId="a"
            />
            {compareUSD && (
              <Area
                dataKey="usd"
                type="step"
                fill="url(#fillUSD)"
                stroke="var(--color-usd)"
                stackId="b"
              />
            )}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
