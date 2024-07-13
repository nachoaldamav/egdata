import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Link } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { client } from '~/lib/client';
import { internalNamespaces } from '~/lib/internal-namespaces';
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
    client
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
          response.data.elements
            .filter(({ namespace }) => !internalNamespaces.includes(namespace))
            .sort((a, b) => a.title.localeCompare(b.title)),
        );
      });
  }, [title]);

  return (
    <Alert variant="destructive" className="mt-1">
      <ExclamationTriangleIcon className="h-4 w-4" />
      <AlertTitle className="font-bold">Epic Internal Offer</AlertTitle>
      <AlertDescription>
        This offer is an internal entry from Epic Games and may not be available to the general
        public.
      </AlertDescription>
      {results.length > 0 && (
        <Link to={`/offers/${results[0].id}`} className="underline">
          Go to public offer
        </Link>
      )}
    </Alert>
  );
};
