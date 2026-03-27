import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';

@Controller()
export class AuthController {
  
  @TsRestHandler(userContract.auth.login)
  async executeLogin() {
    return tsRestHandler(userContract.auth.login, async ({ body }) => {
      console.log(`Processing login for phone: ${body.phoneNumber}`);

      return {
        status: 200,
        body: {
          accessToken: 'mock-jwt-token-abcd-1234',
          salesforceUserId: 101,
        },
      };
    });
  }
}