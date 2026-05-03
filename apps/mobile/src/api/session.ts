import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import type { QueryClient } from '@tanstack/react-query';

const TOKEN_KEY = 'mandalat.accessToken';
const USER_ID_KEY = 'mandalat.salesforceUserId';

// expo-secure-store only ships native modules for iOS/Android. On web (Expo
// dev) we fall back to localStorage so the app still works — production web
// security is out of scope until we actually target the web platform.
const storage =
  Platform.OS === 'web'
    ? {
        getItemAsync: async (key: string) =>
          typeof window !== 'undefined'
            ? window.localStorage.getItem(key)
            : null,
        setItemAsync: async (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value);
          }
        },
        deleteItemAsync: async (key: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
          }
        },
      }
    : SecureStore;

type SessionSnapshot = {
  salesforceUserId: string | null;
  isAuthenticated: boolean;
};

let inMemoryToken: string | null = null;
let inMemoryUserId: string | null = null;
let snapshot: SessionSnapshot = {
  salesforceUserId: null,
  isAuthenticated: false,
};
let queryClientRef: QueryClient | null = null;
const listeners = new Set<() => void>();

function refreshSnapshot() {
  snapshot = {
    salesforceUserId: inMemoryUserId,
    isAuthenticated: !!inMemoryToken,
  };
  for (const listener of listeners) listener();
}

export function getAccessToken(): string | null {
  return inMemoryToken;
}

export function getSalesforceUserId(): string | null {
  return inMemoryUserId;
}

export async function hydrateSession(): Promise<void> {
  const [token, userId] = await Promise.all([
    storage.getItemAsync(TOKEN_KEY),
    storage.getItemAsync(USER_ID_KEY),
  ]);
  inMemoryToken = token;
  inMemoryUserId = userId;
  refreshSnapshot();
}

export async function setSession(args: {
  accessToken: string;
  salesforceUserId: string;
}): Promise<void> {
  await Promise.all([
    storage.setItemAsync(TOKEN_KEY, args.accessToken),
    storage.setItemAsync(USER_ID_KEY, args.salesforceUserId),
  ]);
  inMemoryToken = args.accessToken;
  inMemoryUserId = args.salesforceUserId;
  refreshSnapshot();
}

export async function clearSession(): Promise<void> {
  // Guard against repeat calls (e.g. multiple in-flight 401s) so we don't loop
  // navigation or re-clear an already-empty store.
  if (!inMemoryToken && !inMemoryUserId) return;
  inMemoryToken = null;
  inMemoryUserId = null;
  await Promise.all([
    storage.deleteItemAsync(TOKEN_KEY).catch(() => undefined),
    storage.deleteItemAsync(USER_ID_KEY).catch(() => undefined),
  ]);
  queryClientRef?.clear();
  refreshSnapshot();
  router.replace('/login');
}

export function registerQueryClient(client: QueryClient): void {
  queryClientRef = client;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): SessionSnapshot {
  return snapshot;
}

export function useSession(): SessionSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
