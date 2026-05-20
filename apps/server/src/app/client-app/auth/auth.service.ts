import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  async createSession(firebaseToken: string) {
    let uid: string;
    try {
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      uid = decodedToken.uid;
    } catch (err) {
      Logger.error('[auth/session] verifyIdToken failed', err);
      throw new UnauthorizedException('Invalid Firebase token');
    }

    try {
      await admin
        .auth()
        .setCustomUserClaims(uid, { salesforceUserId: 'MOCK_SF_USER_123' });
      return { ok: true as const };
    } catch (err) {
      Logger.error('[auth/session] setCustomUserClaims failed', err);
      throw new InternalServerErrorException('Failed to finalize session');
    }
  }
}
