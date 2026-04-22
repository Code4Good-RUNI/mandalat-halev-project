import { Controller, UnauthorizedException } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import {
  userContract,
  type LoginResponseDto,
} from '@mandalat-halev-project/api-interfaces';

@Controller()
export class AuthController {
  @TsRestHandler(userContract.auth.login)
  async executeLogin() {
    return tsRestHandler(userContract.auth.login, async ({ body }) => {

      if (body.phoneNumber === '0500000000') {
        throw new UnauthorizedException({
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid phone number or ID number',
        });
      }

      const successBody: LoginResponseDto = {
        accessToken: 'mock-jwt-token-abcd-1234',
        salesforceUserId: 101,
      };
      return { status: 200, body: successBody };
      },
    );
  }
}