export const PUSH_TOKEN_REPOSITORY = 'PUSH_TOKEN_REPOSITORY';

export interface PushTokenRecord {
  id: string; // Firestore
  salesforceUserId: string;
  deviceOs: 'ios' | 'android';
  nativeToken: string;
  expoToken: string | null;
  updatedAt: Date;
}

export interface IPushTokenRepository {
  
  upsert(tokenData: Omit<PushTokenRecord, 'id' | 'updatedAt'>): Promise<PushTokenRecord>;
  
  deleteByToken(nativeToken: string): Promise<void>;
  
  getByUserId(salesforceUserId: string): Promise<PushTokenRecord[]>;
  
  getAll(): Promise<PushTokenRecord[]>;
}