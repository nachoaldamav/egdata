import { useEffect, useLayoutEffect, useState } from 'react';
import { Root, Legend, Tooltip, Bullet, Circle } from '@amcharts/amcharts5';
import {
  XYChart,
  ValueAxis,
  AxisRendererX,
  DateAxis,
  SmoothedXLineSeries,
  XYCursor,
  AxisRendererY,
} from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';
import { client } from '~/lib/client';
import type { Price } from '~/types/single-offer';

type PriceHistory = Record<string, Price[]>;

async function loadHistoricalPricing(offerId: string) {
  return client.get<PriceHistory>(`/offers/${offerId}/price-history`);
}

export function PricingChart({ offerId }: { offerId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PriceHistory | null>(null);

  useEffect(() => {
    loadHistoricalPricing(offerId).then(({ data }) => {
      setData(data);
      setLoading(false);
    });
  }, [offerId]);

  useLayoutEffect(() => {
    if (!data) return;

    console.log('Fetched Data:', data);

    const root = Root.new('chartdiv');

    root.setThemes([am5themes_Animated.new(root), am5themes_Dark.new(root)]);

    const chart = root.container.children.push(
      XYChart.new(root, {
        panY: false,
        layout: root.verticalLayout,
      }),
    );

    // Create Y-axis
    const yAxis = chart.yAxes.push(
      ValueAxis.new(root, {
        renderer: AxisRendererY.new(root, {}),
      }),
    );

    // Create X-Axis
    const xAxis = chart.xAxes.push(
      DateAxis.new(root, {
        maxDeviation: 0.5,
        baseInterval: {
          timeUnit: 'day',
          count: 1,
        },
        renderer: AxisRendererX.new(root, {
          minGridDistance: 80,
          minorGridEnabled: true,
          pan: 'zoom',
        }),
        tooltip: Tooltip.new(root, {}),
      }),
    );

    const seriesData: Record<
      string,
      {
        date: Date;
        value: number;
      }[]
    > = {};

    Object.entries(data).forEach(([region, prices]) => {
      seriesData[region] = [
        {
          date: new Date('2024-06-13').getTime(),
          value: 0,
        },
      ];

      prices.forEach((price) => {
        if (!seriesData[region]) seriesData[region] = [];
        seriesData[region].push({
          date: new Date(price.date).getTime(),
          value: price.totalPrice.basePayoutPrice / 100,
        });
      });

      // Add today's price, which is the price 0
      seriesData[region].push({
        date: new Date('2024-06-20').getTime(),
        value: prices[0].totalPrice.basePayoutPrice / 100,
      });
    });

    console.log('Series Data:', seriesData);

    Object.keys(seriesData).forEach((region) => {
      const series = chart.series.push(
        SmoothedXLineSeries.new(root, {
          name: region,
          xAxis: xAxis,
          yAxis: yAxis,
          valueYField: 'value',
          valueXField: 'date',
          tooltip: Tooltip.new(root, {
            labelText: '{valueY}',
          }),
        }),
      );
      series.data.setAll(seriesData[region]);

      series.bullets.push(() => {
        return Bullet.new(root, {
          locationY: 0,
          sprite: Circle.new(root, {
            radius: 4,
            stroke: root.interfaceColors.get('background'),
            strokeWidth: 2,
            fill: series.get('fill'),
          }),
        });
      });
    });

    // Add legend
    const legend = chart.children.push(Legend.new(root, {}));
    legend.data.setAll(chart.series.values);

    // Add cursor
    chart.set('cursor', XYCursor.new(root, {}));

    return () => {
      root.dispose();
    };
  }, [data]);

  return <div id="chartdiv" style={{ width: '100%', height: '500px' }} />;
}

export default PricingChart;
