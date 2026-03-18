import { initClient } from '@ts-rest/core';
import { userContract } from '@mandalat-halev-project/api-interfaces';

// The base URL of the backend server.
// TODO: move to an environment variable before deployment.
const BASE_URL = 'http://localhost:3000';

// initClient reads the contract and creates a typed object where every
// endpoint becomes a callable function.  For example:
//   api.auth.login({ body: { phoneNumber: '...', idNumber: '...' } })
// will make a POST to http://localhost:3000/auth/login with the given body.
export const api = initClient(userContract, {
  baseUrl: BASE_URL,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
});
