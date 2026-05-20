import { Injectable, Inject, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PUSH_TOKEN_REPOSITORY } from './push-token.repository';
import type { IPushTokenRepository } from './push-token.repository';

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

  async sendToUser(salesforceUserId: string, payload: { title: string; body: string; data?: Record<string, string> }) {
    const tokens = await this.repository.getByUserId(salesforceUserId);
    if (tokens.length === 0) return;

    const nativeTokens = tokens.map(t => t.nativeToken);
    await this.sendToTokens(nativeTokens, payload);
  }

  async sendToAll(payload: { title: string; body: string; data?: Record<string, string> }) {
    const tokens = await this.repository.getAll();
    if (tokens.length === 0) return;

    const nativeTokens = tokens.map(t => t.nativeToken);
    await this.sendToTokens(nativeTokens, payload);
  }

  private async sendToTokens(tokens: string[], payload: { title: string; body: string; data?: Record<string, string> }) {
    const message: admin.messaging.MulticastMessage = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data, 
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (errorCode === 'messaging/invalid-registration-token' || errorCode === 'messaging/registration-token-not-registered') {
              failedTokens.push(tokens[idx]);
            } else {
              this.logger.error(`FCM Error for token ${tokens[idx]}: ${errorCode}`);
            }
          }
        });

        for (const token of failedTokens) {
          await this.repository.deleteByToken(token);
          this.logger.log(`Deleted invalid token: ${token}`);
        }
      }
    } catch (error) {
      this.logger.error('Error sending multicast message', error);
    }
  }
}