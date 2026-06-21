import type { UpdateNotificationPreferencesDto } from '@mandalat-halev-project/api-interfaces';
import { api } from '../api/client';

// Thin wrappers over the protected ts-rest client. The notification endpoints
// are already defined in the shared contract (userContract.notifications), so
// these call the real server — the `api` client attaches the Firebase Bearer
// token automatically and handles 401 refresh.

// A partial set of preference flags, as accepted by PATCH /notifications/preferences.
type PreferencesPatch = UpdateNotificationPreferencesDto['preferences'];

// POST /notifications/register — Android only for now, so deviceOs is fixed.
// expoToken is null because we register the native FCM token directly.
export function registerDevice(nativeToken: string) {
  return api.notifications.register({
    body: { deviceOs: 'android', nativeToken, expoToken: null },
  });
}

// POST /notifications/unregister — disables notifications for this device token.
export function unregisterDevice(nativeToken: string) {
  return api.notifications.unregister({
    body: { nativeToken },
  });
}

// PATCH /notifications/preferences — updates a partial set of category flags
// for the given device token.
export function updatePreferences(
  nativeToken: string,
  preferences: PreferencesPatch,
) {
  return api.notifications.preferences({
    body: { nativeToken, preferences },
  });
}
