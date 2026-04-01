import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';

@Controller()
export class AuthController {
  
  @TsRestHandler(userContract.auth.login)
  async executeLogin() {
    return tsRestHandler(userContract.auth.login, async ({ body }) => {
      console.log(`Processing login for phone: ${body.phoneNumber}`);

      // 401 Error: Testing invalid credentials
      if (body.phoneNumber === '0500000000') {
        return {
          status: 401,
          body: {
            status_code: 'UNAUTHORIZED',
            message: 'Invalid phone number or ID number',
          },
        };
      }
      // 200 Success: Return dummy token
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