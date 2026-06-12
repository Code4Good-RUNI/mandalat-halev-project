import { Injectable, Inject, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PUSH_TOKEN_REPOSITORY } from './push-token.repository';
import type { IPushTokenRepository, PushTokenRecord, NotificationPreferencesRecord } from './push-token.repository';

export enum NotificationCategory {
  ACTIVITY_UPDATES = 'activityUpdates',
  ACTIVITY_REMINDERS = 'activityReminders',
  ORG_MESSAGES = 'orgMessages',
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(PUSH_TOKEN_REPOSITORY)
    private readonly repository: IPushTokenRepository,
  ) {}

  async register(salesforceUserId: string, deviceOs: 'ios' | 'android', nativeToken: string, expoToken?: string | null) {
    return this.repository.upsert({
      salesforceUserId,
      deviceOs,
      nativeToken,
      expoToken: expoToken || null,
    });
  }

  async unregister(salesforceUserId: string, nativeToken: string) {
    await this.repository.unregister(salesforceUserId, nativeToken);
  }

  async updatePreferences(salesforceUserId: string, nativeToken: string, preferences: Partial<NotificationPreferencesRecord>) {
    await this.repository.updatePreferences(salesforceUserId, nativeToken, preferences);
  }

  async sendToUser(
    salesforceUserId: string, 
    payload: { title: string; body: string; data?: Record<string, string> },
    category?: NotificationCategory
  ) {
    const tokens = await this.repository.getByUserId(salesforceUserId);
    const validTokens = this.filterValidTokens(tokens, category);
    
    if (validTokens.length === 0) return;
    await this.sendToTokens(validTokens, payload);
  }

  async sendToAll(
    payload: { title: string; body: string; data?: Record<string, string> },
    category?: NotificationCategory  
  ) {
    const tokens = await this.repository.getAll();
    const validTokens = this.filterValidTokens(tokens, category);

    if (validTokens.length === 0) return;
    await this.sendToTokens(validTokens, payload);
  }

  private filterValidTokens(tokens: PushTokenRecord[], category?: NotificationCategory): string[] {
    return tokens
      .filter(t => t.enabled !== false) // Default to true if missing (for legacy records)
      .filter(t => {
        if (!category) return true;
        return t.preferences?.[category] !== false; // Send unless explicitly opted out
      })
      .map(t => t.nativeToken);
  }

  private async sendToTokens(tokens: string[], payload: { title: string; body: string; data?: Record<string, string> }) {
    const chunkSize = 500;
    
    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize);
      
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data, 
        tokens: chunk,
      };

      try {
        const response = await admin.messaging().sendEachForMulticast(message);
        
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const errorCode = resp.error?.code;
              if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
                failedTokens.push(chunk[idx]);
              } else {
                this.logger.error(`FCM Error for token ${chunk[idx]}: ${errorCode}`);
              }
            }
          });

          for (const token of failedTokens) {
            await this.repository.deleteByToken(token);
            this.logger.log(`Deleted invalid token: ${token}`);
          }
        }
      } catch (error) {
        this.logger.error('Error sending multicast message chunk', error);
      }
    }
  }
  async sendToUsers(
    salesforceUserIds: string[],
    payload: { title: string; body: string; data?: Record<string, string> },
    category?: NotificationCategory
  ) {
    // 1. Fetch all tokens for all users concurrently
    const tokensPromises = salesforceUserIds.map(userId => this.repository.getByUserId(userId));
    const allTokensArrays = await Promise.all(tokensPromises);
    
    // 2. Flatten the arrays into a single list
    const allTokens = allTokensArrays.flat();

    // 3. Filter valid tokens based on enabled status and category preferences
    const validTokens = this.filterValidTokens(allTokens, category);

    // 4. Deduplicate by nativeToken (this fulfills the household requirement)
    const uniqueNativeTokens = Array.from(new Set(validTokens));

    if (uniqueNativeTokens.length === 0) return;
    
    // 5. Send using the existing chunking logic
    await this.sendToTokens(uniqueNativeTokens, payload);
  }
}    
   