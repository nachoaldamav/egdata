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
import { ArrowUpIcon } from '@radix-ui/react-icons';
import { cn } from '~/lib/utils';

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
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
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

  const sortedRegions = Object.keys(priceHistory).sort((a, b) => {
    const lastPriceA = priceHistory[a].sort(
      (x, y) => new Date(y.updatedAt).getTime() - new Date(x.updatedAt).getTime(),
    )[0].price.basePayoutPrice;
    const lastPriceB = priceHistory[b].sort(
      (x, y) => new Date(y.updatedAt).getTime() - new Date(x.updatedAt).getTime(),
    )[0].price.basePayoutPrice;

    return sortDirection === 'asc' ? lastPriceA - lastPriceB : lastPriceB - lastPriceA;
  });

  // Ensure the current region is always on top
  if (selectedRegion) {
    const index = sortedRegions.indexOf(selectedRegion);
    if (index > -1) {
      sortedRegions.splice(index, 1);
      sortedRegions.unshift(selectedRegion);
    }
  }

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
            <TableHead
              className="text-right inline-flex gap-1 items-center justify-end w-full cursor-pointer"
              onClick={() => {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
              }}
            >
              <span>USD</span>
              <ArrowUpIcon
                className={cn(
                  'transform transition-transform size-5',
                  sortDirection === 'asc' && 'rotate-180',
                )}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRegions.map((key) => {
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
                className={cn(
                  'cursor-pointer',
                  selectedRegion === key && 'bg-slate-800/25 text-white',
                )}
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
