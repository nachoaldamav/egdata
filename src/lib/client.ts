import Axios from 'axios';

const client = Axios.create({
  baseURL: 'https://api.egdata.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

export { client };
