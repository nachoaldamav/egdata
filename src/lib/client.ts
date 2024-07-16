import { isServer, QueryClient } from '@tanstack/react-query';
import Axios from 'axios';

const url = 'https://api.egdata.app';

const client = Axios.create({
  baseURL: import.meta.env.SSR ? process.env.SERVER_API_ENDPOINT ?? url : url,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': import.meta.env.SSR ? 'egdata.app/0.0.1 (https://egdata.app)' : undefined,
  },
});

const queryClient = new QueryClient();

let browserQueryClient: QueryClient | undefined = undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  }

  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render. This may not be needed if we
  // have a suspense boundary BELOW the creation of the query client
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export { client, getQueryClient };
