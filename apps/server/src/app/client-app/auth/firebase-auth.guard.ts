import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      const salesforceUserId = decodedToken.salesforceUserId;

      if (!salesforceUserId) {
         throw new UnauthorizedException('Token verified but missing Salesforce user mapping');
      }

      request['user'] = {
        ...decodedToken,
        sub: salesforceUserId,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}