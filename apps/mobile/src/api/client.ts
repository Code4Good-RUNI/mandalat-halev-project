import { initClient, tsRestFetchApi } from '@ts-rest/core';
import { userContract } from '@mandalat-halev-project/api-interfaces';
import { clearSession, getAccessToken } from './session';

if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
}
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const sharedClientOptions = {
  baseUrl: BASE_URL,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  validateResponse: true,
};

// Public client — used only for endpoints that must not carry an auth header
// (currently auth.login). Plain default fetch implementation.
export const apiPublic = initClient(userContract, sharedClientOptions);

// Protected client — used for every endpoint the server guards with JwtAuthGuard.
// Reads the access token from the in-memory session cache on every request and
// attaches it as a Bearer header. On a 401, clears the session and bounces the
// user back to /login (centralized expiry handling).
export const api = initClient(userContract, {
  ...sharedClientOptions,
  api: async (args) => {
    const token = getAccessToken();
    const response = await tsRestFetchApi({
      ...args,
      headers: {
        ...args.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (response.status === 401) {
      void clearSession();
    }
    return response;
  },
});
