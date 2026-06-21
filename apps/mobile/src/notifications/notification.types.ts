import type { NotificationPreferencesDto } from '@mandalat-halev-project/api-interfaces';

// The preference shape is owned by the shared contract (the server validates and
// persists it). Reuse it here rather than re-declaring the fields so the two
// stay in lock-step.
export type NotificationPreferences = NotificationPreferencesDto;

// A single togglable category — used by updateAndroidNotificationPreference.
export type NotificationPreferenceKey = keyof NotificationPreferences;

// Defaults mirror the server's defaults for a freshly registered device
// (push-token.repository.firestore.ts seeds every category as enabled).
export const DEFAULT_PREFERENCES: NotificationPreferences = {
  activityUpdates: true,
  activityReminders: true,
  orgMessages: true,
};
