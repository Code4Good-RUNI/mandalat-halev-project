import { initClient } from '@ts-rest/core';
import { userContract } from '@mandalat-halev-project/api-interfaces';

if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
}
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// initClient reads the contract and creates a typed object where every
// endpoint becomes a callable function.  For example:
//   api.auth.login({ body: { phoneNumber: '...', idNumber: '...' } })
// will make a request to <BASE_URL>/auth/login with the given body.
export const api = initClient(userContract, {
  baseUrl: BASE_URL,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  validateResponse: true,
});
