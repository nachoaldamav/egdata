import Axios from 'axios';

const url = 'http://localhost:4000';

const client = Axios.create({
  baseURL: import.meta.env.SSR ? process.env.SERVER_API_ENDPOINT ?? url : url,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': import.meta.env.SSR ? 'egdata.app/0.0.1 (https://egdata.app)' : undefined,
  },
});

export { client };
