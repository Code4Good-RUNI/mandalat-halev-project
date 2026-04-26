import { Controller, UnauthorizedException } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import {
  userContract,
  type LoginResponseDto,
} from '@mandalat-halev-project/api-interfaces';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TsRestHandler(userContract.auth.login)
  async executeLogin() {
    return tsRestHandler(userContract.auth.login, async ({ body }) => {

      if (body.phoneNumber === '0500000000') {
        throw new UnauthorizedException('Invalid phone number or ID number');
      }

      const result = await this.authService.login({
        salesforceUserId: '101', 
      });
      return { status: 200, body: result };
      },
    );
  }
}