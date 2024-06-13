import Axios from 'axios';

const client = Axios.create({
  baseURL: import.meta.env.SSR
    ? process.env.SERVER_API_ENDPOINT ?? 'https://api.egdata.app'
    : 'https://api.egdata.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

export { client };
