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

  console.log(data);

  const fmt = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: initialData[0]?.currency ?? 'USD',
  });

  useEffect(() => {
    if (!country) return;

    getRegion(country).then((response) => {
      setRegion(response.data);
    });

    loadHistoricalPricing(offerId, country).then((response) => {
      setData(response.data ?? []);
    });
  }, [country, offerId]);

  useEffect(() => {
    if (!chartRef.current) return;

    // Line chart with 3 series
    const chart = init(chartRef.current);

    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const price = params[0].data as number;
          return `
            <div class="p-2 bg-white rounded shadow">
              <div class="text-sm font-semibold text-gray-800">${new Date(
                data[params[0].dataIndex].date,
              ).toLocaleDateString()}</div>
              <div class="text-sm font-semibold text-gray-600">${fmt.format(price)}</div>
            </div>
          `;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      legend: {
        data: [region?.region.description ?? 'Price'],
      },
      toolbox: {},
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: [
          new Date().toISOString(),
          ...data.map((price) => price.date),
          new Date('2024-06-10').toISOString(),
        ],
        inverse: true,
        axisLabel: {
          formatter: (value) => new Date(value).toLocaleDateString(),
        },
      },
      yAxis: {
        type: 'value',
        min: 0,
        // max: (Math.max(...data.map((price) => price.totalPrice.discountPrice / 100)) + 10).toFixed(
        //   0,
        // ),
      },
      series: [
        {
          name: 'Price',
          type: 'line',
          data: [0, ...data.map((price) => price.totalPrice.discountPrice / 100), 69.99],
          smooth: true,
        },
      ],
    };

    chart.setOption(option);

    return () => {
      chart.dispose();
    };
  }, [data, fmt, region]);

  return <div ref={chartRef} className="w-full max-w-7xl h-[50vh] mx-auto px-4 sm:px-6 lg:px-8" />;
}
