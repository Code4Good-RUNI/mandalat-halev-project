import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  registerDevice,
  unregisterDevice,
  updatePreferences,
} from './notification.api';
import {
  clearNativeToken,
  getNativeToken,
  getPreferences,
  setNativeToken,
  setPreferences,
} from './notification.storage';
import { NotificationPreferenceKey } from './notification.types';

// Registers this Android device for push notifications: ensures the default
// notification channel exists, requests permission, reads the native FCM token
// and registers it with the server only when it differs from the stored one.
// If permission is denied, any previously registered token is unregistered.
// No-op on web/iOS. Not wired to any startup hook yet — callers come later.
export async function syncAndroidPushNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
  });

  const existing = await Notifications.getPermissionsAsync();
  const granted =
    existing.granted ||
    (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) {
    const storedToken = await getNativeToken();
    if (storedToken) {
      await unregisterDevice(storedToken);
    }
    await clearNativeToken();
    return;
  }

  const { data: nativeToken } = await Notifications.getDevicePushTokenAsync();
  const storedToken = await getNativeToken();
  if (nativeToken === storedToken) return;

  await registerDevice(nativeToken);
  await setNativeToken(nativeToken);
}

// Unregisters this Android device from push notifications and clears the locally
// stored token. No-op on web/iOS or when no token has been registered.
export async function unregisterAndroidPushNotifications(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const nativeToken = await getNativeToken();
  if (nativeToken) {
    await unregisterDevice(nativeToken);
  }
  await clearNativeToken();
}

// Toggles a single notification category for this Android device: persists the
// new value locally and pushes the partial change to the server. No-op on
// web/iOS or when no token has been registered.
export async function updateAndroidNotificationPreference(
  key: NotificationPreferenceKey,
  value: boolean,
): Promise<void> {
  if (Platform.OS !== 'android') return;

  const current = await getPreferences();
  const next = { ...current, [key]: value };
  await setPreferences(next);

  const nativeToken = await getNativeToken();
  if (nativeToken) {
    await updatePreferences(nativeToken, { [key]: value });
  }
}
