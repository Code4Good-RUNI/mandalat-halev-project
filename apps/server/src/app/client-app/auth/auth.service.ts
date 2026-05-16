import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { SalesforceUserService } from '../../salesforce/salesforce-user.service';

@Injectable()
export class AuthService {
  constructor(private readonly salesforceUserService: SalesforceUserService) {}

  async createSession(firebaseToken: string, idNumber: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const { uid } = decodedToken;

      const phoneNumber = decodedToken.phone_number || '';

      const salesforceUserId = await this.salesforceUserService.validateLogin({
        phoneNumber,
        idNumber,
      });

      if (!salesforceUserId) {
        throw new UnauthorizedException('User not found in Salesforce');
      }
      await admin.auth().setCustomUserClaims(uid, { salesforceUserId });

      return { ok: true as const };
    } catch {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}