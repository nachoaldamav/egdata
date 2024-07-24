import { useOutletContext } from '@remix-run/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '~/components/ui/table';
import { client } from '~/lib/client';
import type { SingleOffer } from '~/types/single-offer';
import type { SingleSandbox } from '~/types/single-sandbox';

export default function ItemsSection() {
  const data = useOutletContext<SingleOffer>();
  const { data: sandboxData } = useQuery({
    queryKey: [
      'sandbox',
      {
        id: data.namespace,
      },
    ],
    queryFn: () =>
      client.get<SingleSandbox>(`/sandboxes/${data.namespace}`).then((res) => res.data),
  });

  if (!data) {
    return null;
  }

  return (
    <>
      <h2 className="text-2xl font-bold">Metadata</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Type</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(data.customAttributes).map(([key, item]) => (
            <TableRow key={key}>
              <TableCell>{key}</TableCell>
              <TableCell>{item.value}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>Countries Blacklist</TableCell>
            <TableCell>
              <Countries countries={data.countriesBlacklist} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Countries Whitelist</TableCell>
            <TableCell>
              <Countries countries={data.countriesWhitelist} />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Categories</TableCell>
            <TableCell>{data.categories.join(', ')}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Refund Type</TableCell>
            <TableCell>{data.refundType}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Tags</TableCell>
            <TableCell>
              {data.tags
                .filter((tag) => tag !== null)
                .map((tag) => tag.name)
                .join(', ')}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Age Ratings</TableCell>
            <TableCell>
              {/* @ts-ignore */}
              <AgeRatings ageRatings={sandboxData?.ageGatings ?? {}} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
}

function Countries({ countries }: { countries: string[] | null }) {
  const [active, setActive] = useState(false);

  if (!countries) {
    return null;
  }
  // If active, show the countries flags, otherwise show the list of countries
  return (
    <span
      onClick={() => setActive(!active)}
      onKeyDown={() => setActive(!active)}
      className="cursor-pointer inline-flex items-center justify-start gap-2 flex-wrap"
    >
      {active
        ? countries.map((country) => (
            <img
              key={country}
              src={`https://flagcdn.com/16x12/${country.toLowerCase()}.webp`}
              alt={country}
              style={{ width: '16px', height: '12px' }}
            />
          ))
        : countriesList(countries)}
    </span>
  );
}

/**
 * Converts the countries codes to the names in english
 * @param countries
 * @returns
 */
function countriesList(countries: string[] | null) {
  if (!countries) {
    return null;
  }

  const regionNameFmt = new Intl.DisplayNames(['en'], { type: 'region' });

  return countries
    .map((country) => {
      return regionNameFmt.of(country);
    })
    .join(', ');
}

function AgeRatings({ ageRatings }: { ageRatings: SingleSandbox['ageGatings'] }) {
  return (
    <div className="inline-flex flex-wrap gap-2">
      {Object.entries(ageRatings).map(([key, rating]) => (
        <div className="flex flex-col gap-1" key={key}>
          <img
            key={key}
            src={rating.ratingImage}
            alt={key}
            title={`${rating.title} - ${rating.gameRating}`}
            className="size-20 mx-auto"
          />
          <span className="text-xs text-center">{rating.ratingSystem}</span>
        </div>
      ))}
    </div>
  );
}
