import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import type { QueryClient } from '@tanstack/react-query';
import { auth } from '../firebase/config';

const TOKEN_KEY = 'mandalat.idToken';

// expo-secure-store ships native modules only. Persist on iOS/Android; on web
// (dev) the calls are skipped so the app still runs without a storage shim.
const canPersist = Platform.OS !== 'web';

let inMemoryToken: string | null = null;
let queryClientRef: QueryClient | null = null;

// The token persisted from the last session — used at startup to decide whether
// to route into the app. Within a running session the live token comes from
// getValidToken().
export function getStoredToken(): string | null {
  return inMemoryToken;
}

// Loads any persisted Firebase ID token on app startup.
export async function hydrateSession(): Promise<void> {
  if (canPersist) {
    inMemoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
  }
}

// Stores the Firebase ID token as the app session.
export async function setSession(idToken: string): Promise<void> {
  inMemoryToken = idToken;
  if (canPersist) {
    await SecureStore.setItemAsync(TOKEN_KEY, idToken);
  }
}

export async function clearSession(): Promise<void> {
  // Guard against repeat calls (e.g. several in-flight 401s at once).
  if (!inMemoryToken) return;
  inMemoryToken = null;
  if (canPersist) {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
  }
  queryClientRef?.clear();
  router.replace('/login');
}

export function registerQueryClient(client: QueryClient): void {
  queryClientRef = client;
}

// Returns a current Firebase ID token for protected API calls. Firebase
// refreshes the token automatically, so getIdToken() yields a valid one (pass
// forceRefresh on a 401); the result is mirrored into secure storage. Falls
// back to the last stored token when the Firebase user isn't in memory (e.g.
// just after a cold start, before re-authentication).
export async function getValidToken(
  forceRefresh = false,
): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return inMemoryToken;
  }
  const token = await user.getIdToken(forceRefresh);
  if (token !== inMemoryToken) {
    await setSession(token);
  }
  return token;
}
