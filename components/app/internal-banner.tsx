import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Link } from '@tanstack/react-router';
import { httpClient } from '@/lib/http-client';
import { internalNamespaces } from '@/lib/internal-namespaces';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import type { SingleOffer } from '@/types/single-offer';
import { useQuery } from '@tanstack/react-query';

export const InternalBanner: React.FC<{
  offer: SingleOffer;
}> = ({ offer }) => {
  const { namespace, title } = offer;

  const manualOfferId =
    offer.customAttributes?.['com.epicgames.app.offerId']?.value;

  if (!internalNamespaces.includes(namespace)) {
    return null;
  }

  const { data: results = [] } = useQuery({
    queryKey: ['autocomplete', title, manualOfferId],
    queryFn: async () => {
      if (manualOfferId) {
        return [{ id: manualOfferId, title }];
      }

      const response = await httpClient.get<{
        elements: Array<{
          _id: string;
          id: string;
          namespace: string;
          title: string;
          keyImages: Array<{
            type: string;
            url: string;
            md5: string;
          }>;
        }>;
        total: number;
      }>(`/autocomplete?query=${title}`);

      return response.elements
        .filter(({ namespace }) => !internalNamespaces.includes(namespace))
        .filter(({ title: t }) => {
          const similarity = compareTitleSimilarity(title, t);
          return similarity > 0.5;
        })
        .map((e) => {
          const similarity = compareTitleSimilarity(title, e.title);
          return {
            id: e.id,
            title: e.title,
            similarity,
          };
        })
        .sort((a, b) => b.similarity - a.similarity);
    },
    enabled: !!title,
  });

  return (
    <Alert variant="destructive" className="mt-1">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle className="font-bold">Epic Internal Offer</AlertTitle>
      <AlertDescription>
        This offer is an internal entry from Epic Games and may not be available
        to the general public.
      </AlertDescription>
      {results.length > 0 && (
        <Link
          to="/offers/$id"
          params={{ id: results[0].id }}
          className="underline"
        >
          Go to public offer
        </Link>
      )}
    </Alert>
  );
};

const compareTitleSimilarity = (a: string, b: string): number => {
  const aTitle = a.toLowerCase();
  const bTitle = b.toLowerCase();

  const aTitleWords = aTitle.split(' ');
  const bTitleWords = bTitle.split(' ');

  const intersection = aTitleWords.filter((word) => bTitleWords.includes(word));

  return intersection.length / Math.max(aTitleWords.length, bTitleWords.length);
};
