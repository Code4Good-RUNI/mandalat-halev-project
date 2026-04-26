import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: { salesforceUserId: string }) {
    const payload = { sub: user.salesforceUserId };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      salesforceUserId: user.salesforceUserId,
    };
  }
}