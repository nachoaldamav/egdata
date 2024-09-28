import type { QueryClient, DehydratedState, QueryKey } from '@tanstack/react-query';

export function getFetchedQuery<T>(
  queryClient: QueryClient,
  state: DehydratedState,
  queryKey: QueryKey,
): T | null {
  const query = queryClient.getQueryData<T>(queryKey);
  if (query) return query;

  const dehydratedQuery = state.queries.find(
    (query) => query.queryHash === JSON.stringify(queryKey),
  );
  if (!dehydratedQuery) return null;

  return dehydratedQuery.state.data as T;
}
