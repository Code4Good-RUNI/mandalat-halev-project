import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  DEFAULT_PREFERENCES,
  NotificationPreferences,
} from './notification.types';

const NATIVE_TOKEN_KEY = 'mandalat.push.nativeToken';
const PREFERENCES_KEY = 'mandalat.push.preferences';

// expo-secure-store ships native modules only. Persist on iOS/Android; on web
// (dev) the calls are skipped so the app still runs without a storage shim.
// Mirrors the gate in api/session.ts.
const canPersist = Platform.OS !== 'web';

// The native (FCM) device push token last registered with the server. Used to
// address the device on unregister / preference updates.
export async function getNativeToken(): Promise<string | null> {
  if (!canPersist) return null;
  return SecureStore.getItemAsync(NATIVE_TOKEN_KEY);
}

export async function setNativeToken(token: string): Promise<void> {
  if (!canPersist) return;
  await SecureStore.setItemAsync(NATIVE_TOKEN_KEY, token);
}

export async function clearNativeToken(): Promise<void> {
  if (!canPersist) return;
  await SecureStore.deleteItemAsync(NATIVE_TOKEN_KEY).catch(() => undefined);
}

// The locally cached copy of the per-device notification preferences. Falls back
// to DEFAULT_PREFERENCES when nothing is stored yet or the value can't be parsed.
export async function getPreferences(): Promise<NotificationPreferences> {
  if (!canPersist) return DEFAULT_PREFERENCES;
  const raw = await SecureStore.getItemAsync(PREFERENCES_KEY);
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function setPreferences(
  preferences: NotificationPreferences,
): Promise<void> {
  if (!canPersist) return;
  await SecureStore.setItemAsync(PREFERENCES_KEY, JSON.stringify(preferences));
}
