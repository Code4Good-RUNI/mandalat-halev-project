import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { IPushTokenRepository, PushTokenRecord, NotificationPreferencesRecord } from './push-token.repository';

@Injectable()
export class FirestorePushTokenRepository implements IPushTokenRepository {
  
  private get collection() {
    return admin.firestore().collection('pushTokens');
  }

  async upsert(tokenData: Omit<PushTokenRecord, 'id' | 'updatedAt' | 'enabled' | 'preferences'>): Promise<PushTokenRecord> {
    const snapshot = await this.collection
      .where('salesforceUserId', '==', tokenData.salesforceUserId)
      .where('nativeToken', '==', tokenData.nativeToken)
      .limit(1)
      .get();

    const now = new Date();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        updatedAt: now,
        expoToken: tokenData.expoToken,
        enabled: true,
      });
      
      return { 
        id: doc.id, 
        ...doc.data(), 
        expoToken: tokenData.expoToken, 
        enabled: true, 
        updatedAt: now 
      } as PushTokenRecord;
    } else {
      const newRecord = {
        ...tokenData,
        enabled: true,
        preferences: {
          activityUpdates: true,
          activityReminders: true,
          orgMessages: true,
        },
        updatedAt: now,
      };
      const docRef = await this.collection.add(newRecord);
      return { id: docRef.id, ...newRecord } as PushTokenRecord;
    }
  }

  async unregister(salesforceUserId: string, nativeToken: string): Promise<void> {
    const snapshot = await this.collection
      .where('salesforceUserId', '==', salesforceUserId)
      .where('nativeToken', '==', nativeToken)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        enabled: false,
        updatedAt: new Date()
      });
    }
  }

  async updatePreferences(salesforceUserId: string, nativeToken: string, preferences: Partial<NotificationPreferencesRecord>): Promise<void> {
    const snapshot = await this.collection
      .where('salesforceUserId', '==', salesforceUserId)
      .where('nativeToken', '==', nativeToken)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const updates: Record<string, Date | boolean> = { updatedAt: new Date() };
      for (const [key, value] of Object.entries(preferences)) {
        if (value !== undefined) {
          updates[`preferences.${key}`] = value;
        }
      }
      await snapshot.docs[0].ref.update(updates);
    }
  }

  async deleteByToken(nativeToken: string): Promise<void> {
    const snapshot = await this.collection.where('nativeToken', '==', nativeToken).get();
    
    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  async getByUserId(salesforceUserId: string): Promise<PushTokenRecord[]> {
    const snapshot = await this.collection.where('salesforceUserId', '==', salesforceUserId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PushTokenRecord));
  }

  async getAll(): Promise<PushTokenRecord[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PushTokenRecord));
  }
}