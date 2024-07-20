import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { fetchOfferPrice } from '~/queries/offer-price';
import { PriceChart } from './price-chart';
import { useEffect, useState } from 'react';
import { useCountry } from '~/hooks/use-country';
import { client, getQueryClient } from '~/lib/client';
import { Skeleton } from '../ui/skeleton';
import { useRegions } from '~/hooks/use-regions';

interface RegionData {
  region: Region;
}

interface Region {
  code: string;
  currencyCode: string;
  description: string;
  countries: string[];
}

export function RegionalPricing({ id }: { id: string }) {
  const queryClient = getQueryClient();
  const { country } = useCountry();
  const [selectedRegion, setSelectedRegion] = useState('EURO');
  const { regions } = useRegions();
  const { data, error, isLoading, isError } = useQuery({
    queryKey: ['price-history', { id }],
    queryFn: () => fetchOfferPrice({ id }),
    initialData: () => queryClient.getQueryData(['price-history', { id }]),
  });
  const { data: regionData } = useQuery({
    queryKey: ['region', { country }],
    queryFn: () =>
      client
        .get<RegionData>('/region', {
          params: {
            country,
          },
        })
        .then((response) => response.data),
  });

  useEffect(() => {
    if (regionData) {
      setSelectedRegion(regionData.region.code);
    }
  }, [regionData]);

  if (isLoading) {
    return (
      <div className="w-full mx-auto mt-2 flex flex-col gap-2">
        <Skeleton className="w-3/4 h-96 mx-auto" />
        <Skeleton className="w-3/4 h-[50vh] mx-auto" />
      </div>
    );
  }

  if (isError) {
    return <p>Error: {error.message}</p>;
  }

  const priceHistory = data;

  if (!priceHistory) {
    return null;
  }

  const scrollToChart = () => {
    const chart = document.getElementById('price-chart');
    if (chart) {
      chart.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full mx-auto mt-2">
      <PriceChart selectedRegion={selectedRegion} priceData={data} />
      <Table className="w-3/4 mx-auto mt-2">
        <TableCaption>Regional Pricing</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Region</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Max Price</TableHead>
            <TableHead>Min Price</TableHead>
            <TableHead className="text-right">USD</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(priceHistory)
            .sort()
            .map((key) => {
              const regionPricing = priceHistory[key];
              const lastPrice = regionPricing.sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
              )[0];
              const maxPrice = regionPricing.reduce(
                (acc, price) => (price.price.discountPrice > acc ? price.price.discountPrice : acc),
                0,
              );
              const minPrice = regionPricing.reduce(
                (acc, price) => (price.price.discountPrice < acc ? price.price.discountPrice : acc),
                maxPrice,
              );

              const currencyFormatter = new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: lastPrice.price.currencyCode,
              });
              const usdFormatter = new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: 'USD',
              });

              return (
                <TableRow
                  key={key}
                  onClick={() => {
                    setSelectedRegion(key);
                    scrollToChart();
                  }}
                  className="cursor-pointer"
                >
                  <TableCell>{regions?.[key]?.description || key}</TableCell>
                  <TableCell>
                    {currencyFormatter.format(lastPrice.price.discountPrice / 100)}
                  </TableCell>
                  <TableCell>{currencyFormatter.format(maxPrice / 100)}</TableCell>
                  <TableCell>{currencyFormatter.format(minPrice / 100)}</TableCell>
                  <TableCell className="text-right">
                    {usdFormatter.format(lastPrice.price.basePayoutPrice / 100)}
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
