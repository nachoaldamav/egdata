import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Image } from '~/components/app/image';
import { client } from '~/lib/client';
import { getImage } from '~/lib/getImage';
import { getSeller } from '~/lib/get-seller';
import type { SingleOffer } from '~/types/single-offer';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';

export async function loader({ params }: LoaderFunctionArgs) {
  const offer = await client
    .get<SingleOffer>(`/offers/${params.id}`)
    .then((response) => response.data);

  return {
    offer,
  };
}

export default function Index() {
  const { offer: offerData } = useLoaderData<typeof loader>();

  if (!offerData) {
    return <div>Offer not found</div>;
  }

  if (offerData.title === 'Error') {
    return <div>{offerData.description}</div>;
  }

  return (
    <main className="flex flex-col items-start justify-start w-full min-h-screen">
      <header className="grid col-span-1 gap-4 md:grid-cols-2 w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold">{offerData.title}</h1>
          <h4
            className="text-lg font-semibold opacity-50"
            aria-label={`Offered by ${offerData.seller.name}`}
          >
            {getSeller({
              developerDisplayName: offerData.developerDisplayName as string,
              publisherDisplayName: offerData.publisherDisplayName as string,
              seller: offerData.seller.name,
            })}
          </h4>
          <Table className="rounded-xl">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Offer ID</TableHead>
                <TableHead className="text-left font-mono">
                  {offerData.id}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Namespace</TableCell>
                <TableCell className="text-left font-mono">
                  {offerData.namespace}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Offer Type</TableCell>
                <TableCell className="text-left">
                  {offerData.offerType}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Seller</TableCell>
                <TableCell className="text-left">
                  {offerData.seller.name}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Developer</TableCell>
                <TableCell className="text-left inline-flex items-center gap-1">
                  {offerData.developerDisplayName ?? offerData.seller.name}
                  {offerData.publisherDisplayName !==
                    offerData.developerDisplayName && (
                    <span className="opacity-50">
                      ({offerData.publisherDisplayName})
                    </span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Release Date</TableCell>
                <TableCell className="text-left inline-flex items-center gap-1">
                  {!offerData.releaseDate.includes('2099')
                    ? new Date(offerData.releaseDate).toLocaleDateString(
                        'en-UK',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }
                      )
                    : 'Not available'}
                  {!offerData.releaseDate.includes('2099') && (
                    <TimeAgo targetDate={offerData.releaseDate} />
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Last Update</TableCell>
                <TableCell className="text-left inline-flex items-center gap-1">
                  {offerData.lastModifiedDate
                    ? new Date(offerData.lastModifiedDate).toLocaleDateString(
                        'en-UK',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        }
                      )
                    : 'Not available'}
                  {' (UTC) '}
                  <TimeAgo targetDate={offerData.lastModifiedDate} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-center flex-col">
          <Image
            src={
              getImage(offerData.keyImages, [
                'OfferImageWide',
                'DieselGameBoxWide',
              ]).url
            }
            alt={offerData.title}
            width={1920}
            height={1080}
            className="rounded-xl shadow-lg"
          />
          <p className="pt-2 px-1">{offerData.description}</p>
        </div>
      </header>
    </main>
  );
}

const TimeAgo: React.FC<{
  targetDate: string;
}> = ({ targetDate }) => {
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const lastModified = new Date(date);
    const diffInMilliseconds = now.getTime() - lastModified.getTime();

    const seconds = Math.floor(diffInMilliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    let timeAgo: number;
    let unit: Intl.RelativeTimeFormatUnit;

    if (Math.abs(years) > 0) {
      timeAgo = years;
      unit = 'year';
    } else if (Math.abs(months) > 0) {
      timeAgo = months;
      unit = 'month';
    } else if (Math.abs(days) > 0) {
      timeAgo = days;
      unit = 'day';
    } else if (Math.abs(hours) > 0) {
      timeAgo = hours;
      unit = 'hour';
    } else if (Math.abs(minutes) > 0) {
      timeAgo = minutes;
      unit = 'minute';
    } else {
      timeAgo = seconds;
      unit = 'second';
    }

    return new Intl.RelativeTimeFormat('en', {
      localeMatcher: 'best fit',
      numeric: 'always',
      style: 'long',
    }).format(-timeAgo, unit);
  };

  return (
    <span className="opacity-50">
      ({targetDate ? getTimeAgo(targetDate) : 'Not available'})
    </span>
  );
};
