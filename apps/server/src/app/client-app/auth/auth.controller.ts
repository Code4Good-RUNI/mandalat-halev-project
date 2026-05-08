import { Controller, UnauthorizedException, Headers } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';
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

      await this.authService.createSession(token);
      
      return { status: 200, body: { ok: true } };
    });
  }
}

   