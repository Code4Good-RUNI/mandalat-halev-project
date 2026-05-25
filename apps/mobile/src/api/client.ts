import { initClient, tsRestFetchApi } from '@ts-rest/core';
import { userContract } from '@mandalat-halev-project/api-interfaces';
import { clearSession, getValidToken } from './session';

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

const withAuth = (headers: Record<string, string>, token: string | null) => ({
  ...headers,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

// Protected client — used for every endpoint the server guards. Each request
// carries a current Firebase ID token (getValidToken). A 401 usually means the
// token expired, so we force-refresh it once and retry; if it still fails we
// clear the session and bounce the user back to /login.
export const api = initClient(userContract, {
  ...sharedClientOptions,
  api: async (args) => {
    const token = await getValidToken();
    let response = await tsRestFetchApi({
      ...args,
      headers: withAuth(args.headers, token),
    });

    if (response.status === 401) {
      const refreshed = await getValidToken(true);
      if (refreshed && refreshed !== token) {
        response = await tsRestFetchApi({
          ...args,
          headers: withAuth(args.headers, refreshed),
        });
      }
      if (response.status === 401) {
        void clearSession();
      }
    }

    return response;
  },
});
