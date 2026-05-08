import { Controller, UnauthorizedException, Headers } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';
import * as admin from 'firebase-admin';

@Controller()
export class AuthController {
  
  @TsRestHandler(userContract.auth.login)
  async executeLogin() {
    return tsRestHandler(userContract.auth.login, async ({ body }) => {

      if (body.phoneNumber === '0500000000') {
        throw new UnauthorizedException('Invalid phone number or ID number');
      }

      return { status: 200, body: { ok: true } };
    });
  }

  @TsRestHandler(userContract.auth.session)
  async executeSession(@Headers('authorization') authHeader: string) {
    return tsRestHandler(userContract.auth.session, async ({ body }) => {
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Missing or invalid Authorization header');
      }

      const token = authHeader.split(' ')[1];

      try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        if (body.phoneNumber === '0500000000') {
          throw new UnauthorizedException('Invalid phone number or ID number');
        }
  
        const salesforceUserId = '101'; 

        await admin.auth().setCustomUserClaims(decodedToken.uid, {
          salesforceUserId: salesforceUserId,
        });

        return { status: 200, body: { ok: true } };
      } catch {
        throw new UnauthorizedException('Invalid or expired Firebase token');
      }
    });
  }
}

   