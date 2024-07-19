import { useQuery } from '@tanstack/react-query';
import { client } from '~/lib/client';
import type { Tag } from '~/types/tags';

export const useGenres = () => {
  const { data } = useQuery({
    queryKey: ['genres'],
    queryFn: () => client.get<Tag[]>('/tags?group=genre').then((res) => res.data),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    genres: data,
  };
};
