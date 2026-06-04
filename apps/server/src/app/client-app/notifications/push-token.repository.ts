export const PUSH_TOKEN_REPOSITORY = 'PUSH_TOKEN_REPOSITORY';

export interface NotificationPreferencesRecord {
  activityUpdates: boolean;
  activityReminders: boolean;
  orgMessages: boolean;
}

export interface PushTokenRecord {
  id: string; // Firestore
  salesforceUserId: string;
  deviceOs: 'ios' | 'android';
  nativeToken: string;
  expoToken: string | null;
  enabled: boolean;
  preferences: NotificationPreferencesRecord;
  updatedAt: Date;
}

export interface IPushTokenRepository {
  upsert(tokenData: Omit<PushTokenRecord, 'id' | 'updatedAt' | 'enabled' | 'preferences'>): Promise<PushTokenRecord>;
  unregister(salesforceUserId: string, nativeToken: string): Promise<void>;
  updatePreferences(salesforceUserId: string, nativeToken: string, preferences: Partial<NotificationPreferencesRecord>): Promise<void>;
  deleteByToken(nativeToken: string): Promise<void>;
  getByUserId(salesforceUserId: string): Promise<PushTokenRecord[]>;
  getAll(): Promise<PushTokenRecord[]>;
}