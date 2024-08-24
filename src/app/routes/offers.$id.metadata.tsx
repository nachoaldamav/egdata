import { useOutletContext } from '@remix-run/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { platformIcons, textPlatformIcons } from '~/components/app/platform-icons';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '~/components/ui/table';
import { httpClient } from '~/lib/http-client';
import type { Asset } from '~/types/asset';
import type { SingleOffer } from '~/types/single-offer';
import type { SingleSandbox } from '~/types/single-sandbox';

export default function ItemsSection() {
  const data = useOutletContext<SingleOffer>();

  if (!data) {
    return null;
  }

  const { data: sandboxData } = useQuery({
    queryKey: [
      'sandbox',
      {
        id: data.namespace,
      },
    ],
    queryFn: () => httpClient.get<SingleSandbox>(`/sandboxes/${data.namespace}`),
  });
  const { data: assets } = useQuery({
    queryKey: [
      'assets',
      {
        id: data.id,
      },
    ],
    queryFn: () =>
      httpClient.get<
        {
          assets: Asset;
        }[]
      >(`/offers/${data.id}/assets`),
  });

  return (
    <div className="flex flex-col gap-2 w-full">
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
          {assets && assets?.length > 0 ? (
            <TableRow>
              <TableCell>Assets</TableCell>
              <TableCell>
                <Assets assets={assets} />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
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
    <div className="flex flex-col gap-2 items-start justify-start">
      {Object.entries(ageRatings).map(([key, rating]) => (
        <div className="flex flex-row gap-2" key={key}>
          {rating.ratingImage && rating.ratingImage !== '' ? (
            <img
              key={key}
              src={rating.ratingImage}
              alt={key}
              title={`${rating.title} - ${rating.gameRating}`}
              className="size-20 mx-auto"
            />
          ) : (
            <div className="size-20 mx-auto inline-flex items-center justify-center bg-gray-900 rounded-lg">
              <span className="text-6xl font-extrabold">{rating.ageControl}</span>
            </div>
          )}
          <div className="flex flex-col gap-1 py-2">
            <span className="text-xs text-left font-bold">{rating.ratingSystem}</span>
            <span className="text-xs text-left">{rating.element}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Assets({ assets }: { assets: { assets: Asset }[] }) {
  try {
    return (
      <div className="flex flex-col gap-2 items-start justify-start">
        {assets
          .filter(({ assets: asset }) => asset.platform)
          .map(({ assets: asset }) => (
            <div className="flex flex-row gap-2 items-center" key={asset._id}>
              {textPlatformIcons[asset.platform]}
              <span className="text-xs text-left">{asset.artifactId}</span>
              <span className="text-xs text-left">
                Download: {bytesToSize(asset.downloadSizeBytes)}
              </span>
              <span className="text-xs text-left">
                Install: {bytesToSize(asset.installedSizeBytes)}
              </span>
            </div>
          ))}
      </div>
    );
  } catch (error) {
    console.error(error);
    return null;
  }
}

const bytesToSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = Number.parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
};
