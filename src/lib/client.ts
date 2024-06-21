import Axios from 'axios';

const client = Axios.create({
  baseURL: import.meta.env.SSR
    ? process.env.SERVER_API_ENDPOINT ?? 'https://api.egdata.app'
    : 'https://api.egdata.app',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': import.meta.env.SSR ? 'egdata.app/0.0.1 (https://egdata.app)' : undefined,
  },
});

export { client };
