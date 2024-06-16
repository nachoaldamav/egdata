import type * as echarts from 'echarts';
import { init, type EChartsOption } from 'echarts';
import { useEffect, useRef, useState } from 'react';
import { useCountry } from '~/hooks/use-country';
import { client } from '~/lib/client';
import type { Price } from '~/types/single-offer';

type PriceHistory = Record<string, Price[]>;

async function loadHistoricalPricing(offerId: string, country: string) {
  return client.get<Price[]>(`/offers/${offerId}/price-history?country=${country}`);
}

async function getRegion(country: string) {
  return client.get<{
    region: {
      code: string;
      currencyCode: string;
      description: string;
      countries: Array<string>;
    };
  }>(`/region?country=${country}`);
}

export function Echarts({ offerId, initialData }: { offerId: string; initialData: Price[] }) {
  const { country } = useCountry();
  const [data, setData] = useState<Price[]>(initialData);
  const [region, setRegion] = useState<{
    region: {
      code: string;
      currencyCode: string;
      description: string;
      countries: Array<string>;
    };
  } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: initialData[0]?.currency ?? 'USD',
  });

  useEffect(() => {
    if (!country) return;

    getRegion(country).then((response) => {
      setRegion(response.data);
    });

    if (!data || data[0]?.currency === initialData[0]?.currency) return;

    loadHistoricalPricing(offerId, country).then((response) => {
      setData(response.data ?? []);
    });
  }, [country, offerId, data, initialData]);

  useEffect(() => {
    if (!chartRef.current) return;

    // Line chart with 3 series
    const chart = init(chartRef.current);

    const option: EChartsOption = {
      darkMode: true,
      tooltip: {
        trigger: 'axis',
        formatter: (params: echarts.TooltipComponentFormatterCallbackParams) => {
          if (Array.isArray(params)) {
            const date = new Date(params[0].axisValue as string).toLocaleDateString();
            return `
            <div class="p-2 bg-white rounded shadow">
              <div class="text-sm font-semibold text-gray-800">${date}</div>
              ${params
                .map((param) => {
                  return `
                  <div class="flex items center justify-between">
                    <div class="text-sm font-semibold text-gray-600">${fmt.format(param.data as number)}</div>
                  </div>`;
                })
                .join('')}
            </div>
          `;
          }

          return '';
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      toolbox: {},
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((price) => new Date(price.date).toISOString()),
        inverse: true,
        axisLabel: {
          formatter: (value) => new Date(value).toLocaleDateString(),
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
      },
      series: [
        {
          name: 'Price',
          type: 'line',
          data: data.map((price) => price.totalPrice.discountPrice / 100),
          smooth: true,
          areaStyle: {
            color: 'rgba(24, 144, 255, 0.2)',
          },
        },
      ],
    };

    console.log(option);

    chart.setOption(option);

    return () => {
      chart.dispose();
    };
  }, [data, fmt, region]);

  return <div ref={chartRef} className="w-full max-w-7xl h-[25vh] mx-auto px-4 sm:px-6 lg:px-8" />;
}
