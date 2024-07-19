import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';

export const useRegions = () => {
  const { data } = useQuery({
    queryKey: ['regions'],
    queryFn: () =>
      client
        .get<
          Record<
            string,
            {
              currencyCode: string;
              description: string;
              countries: string[];
            }
          >
        >('/regions')
        .then((res) => res.data),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    regions: data,
  };
};
