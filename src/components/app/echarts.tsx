import { init, type EChartsOption } from 'echarts';
import { useEffect, useRef, useState } from 'react';
import { client } from '~/lib/client';
import type { Price } from '~/types/single-offer';

type PriceHistory = Record<string, Price[]>;

async function loadHistoricalPricing(offerId: string) {
  return client.get<PriceHistory>(`/offers/${offerId}/price-history`);
}

export function Echarts({ offerId, initialData }: { offerId: string; initialData: Price[] }) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Line chart with 3 series
    const chart = init(chartRef.current);

    const option: EChartsOption = {
      tooltip: {
        trigger: 'axis',
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
        data: initialData.map((price) => price.date),
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: (
          Math.max(...initialData.map((price) => price.totalPrice.discountPrice / 100)) + 10
        ).toFixed(0),
      },
      series: [
        {
          name: 'Price',
          type: 'line',
          data: initialData.map((price) => price.totalPrice.discountPrice / 100),
        },
      ],
    };

    chart.setOption(option);

    return () => {
      chart.dispose();
    };
  }, [initialData, offerId]);

  return <div ref={chartRef} className="w-full max-w-7xl h-[50vh] mx-auto px-4 sm:px-6 lg:px-8" />;
}
