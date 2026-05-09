import { Controller, NotFoundException, UseGuards } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SalesforceUserService } from '../../salesforce/salesforce-user.service';

@Controller()
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(private readonly userService: SalesforceUserService) {}

  @TsRestHandler(userContract.user.profile)
  async getProfile(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.user.profile, async () => {
      const profile = await this.userService.getUserProfile(userId);

      if (!profile) {
        throw new NotFoundException('User not found in Salesforce');
      }

      return {
        status: 200,
        body: profile,
      };
    });
  }
}