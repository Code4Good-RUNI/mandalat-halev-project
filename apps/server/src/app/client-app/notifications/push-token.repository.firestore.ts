import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { IPushTokenRepository, PushTokenRecord } from './push-token.repository';

@Injectable()
export class FirestorePushTokenRepository implements IPushTokenRepository {
  
  private get collection() {
    return admin.firestore().collection('pushTokens');
  }

  async upsert(tokenData: Omit<PushTokenRecord, 'id' | 'updatedAt'>): Promise<PushTokenRecord> {
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
      });
      return { id: doc.id, ...doc.data(), updatedAt: now } as PushTokenRecord;
    } else {
      const newRecord = {
        ...tokenData,
        updatedAt: now,
      };
      const docRef = await this.collection.add(newRecord);
      return { id: docRef.id, ...newRecord } as PushTokenRecord;
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