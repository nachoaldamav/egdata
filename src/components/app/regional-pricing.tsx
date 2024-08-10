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
import type { Price } from '~/types/price';
import { httpClient } from '~/lib/http-client';

interface RegionData {
  region: Region;
}

interface Region {
  code: string;
  currencyCode: string;
  description: string;
  countries: string[];
}

interface RegionalPrice {
  [region: string]: {
    currentPrice: Price;
    maxPrice: number;
    minPrice: number;
  };
}

const getRegionalPricing = async ({ id }: { id: string }) => {
  const response = await httpClient.get<RegionalPrice>(`/offers/${id}/regional-price`);
  return response;
};

export function RegionalPricing({ id }: { id: string }) {
  const { country } = useCountry();
  const [selectedRegion, setSelectedRegion] = useState('EURO');
  const { regions } = useRegions();
  const {
    data: regionalPricing,
    error,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['regional-pricing', { id }],
    queryFn: () => getRegionalPricing({ id }),
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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

  if (!regionalPricing) {
    return null;
  }

  const scrollToChart = () => {
    const chart = document.getElementById('price-chart');
    if (chart) {
      chart.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sortedRegions = Object.keys(regionalPricing).sort((a, b) => {
    const lastPriceA = regionalPricing[a].currentPrice.price.basePayoutPrice;
    const lastPriceB = regionalPricing[b].currentPrice.price.basePayoutPrice;

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
      <PriceChart selectedRegion={selectedRegion} id={id} />
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
            const regionPricing = regionalPricing[key];
            const {
              currentPrice: lastPrice,
              maxPrice,
              minPrice,
            } = regionPricing || {
              currentPrice: {
                price: { currencyCode: 'USD', basePayoutPrice: 0, discountPrice: 0 },
              },
              maxPrice: 0,
              minPrice: 0,
            };

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
