import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { httpClient } from '@/lib/http-client';
import { internalNamespaces } from '@/lib/internal-namespaces';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

export const InternalBanner: React.FC<{
  title: string;
  namespace: string;
}> = ({ title, namespace }) => {
  if (!internalNamespaces.includes(namespace)) {
    return null;
  }
  const [results, setResults] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    httpClient
      .get<{
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
      }>(`/autocomplete?query=${title}`)
      .then((response) => {
        setResults(
          response.elements
            .filter(({ namespace }) => !internalNamespaces.includes(namespace))
            .filter(({ title: t }) => {
              const similarity = compareTitleSimilarity(title, t);
              return similarity > 0.5;
            }),
        );
      });
  }, [title]);

  return (
    <Alert variant="destructive" className="mt-1">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle className="font-bold">Epic Internal Offer</AlertTitle>
      <AlertDescription>
        This offer is an internal entry from Epic Games and may not be available
        to the general public.
      </AlertDescription>
      {results.length > 0 && (
        <Link to={`/offers/${results[0].id}`} className="underline">
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
