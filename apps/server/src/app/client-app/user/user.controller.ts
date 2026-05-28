import { Controller, NotFoundException, UseGuards } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract, ContactDto } from '@mandalat-halev-project/api-interfaces';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SalesforceUserService } from '../../salesforce/user/salesforce-user.service';

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

  @TsRestHandler(userContract.user.contacts)
  async getContacts(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.user.contacts, async () => {

      const mockContacts: ContactDto[] = [
        {
          salesforceUserId: 'sf-001',
          firstName: 'Ronen',
          lastName: 'Cohen',
          idNumber: '302145678',
          birthDate: '1985-05-15',
        },
        {
          salesforceUserId: 'sf-002',
          firstName: 'Yael',
          lastName: 'Levi',
          idNumber: '318965431',
          birthDate: '1992-11-20',
        }
      ];

      return {
        status: 200,
        body: mockContacts
      };
    });
  }
}