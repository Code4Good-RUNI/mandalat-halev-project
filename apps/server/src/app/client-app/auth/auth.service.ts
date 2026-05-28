import {
  Injectable,
  Logger,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { SalesforceUserService } from '../../salesforce/user/salesforce-user.service';

@Injectable()
export class AuthService {
  constructor(private readonly salesforceUserService: SalesforceUserService) {}

  async createSession(firebaseToken: string, idNumber: string) {
    let uid: string;
    try {
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const phoneNumber = decodedToken.phone_number || '';
      uid = decodedToken.uid;

      const salesforceUserId = await this.salesforceUserService.validateLogin({
        phoneNumber,
        idNumber,
      });

      if (!salesforceUserId) {
        throw new UnauthorizedException('User not found in Salesforce');
      }


      try {
        await admin
          .auth()
          .setCustomUserClaims(uid, { salesforceUserId });
        return { ok: true as const };
      } catch (err) {
        Logger.error('[auth/session] setCustomUserClaims failed', err);
        throw new InternalServerErrorException('Failed to finalize session');
      }


    } catch (err) {
      Logger.error('[auth/session] verifyIdToken failed', err);
      throw new UnauthorizedException('Invalid Firebase token');
    }
    }
}