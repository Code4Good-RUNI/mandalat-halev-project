import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  async createSession(firebaseToken: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const { uid } = decodedToken;

      const salesforceUserId = 'MOCK_SF_USER_123';

      await admin.auth().setCustomUserClaims(uid, { salesforceUserId });

      return { ok: true as const };
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}