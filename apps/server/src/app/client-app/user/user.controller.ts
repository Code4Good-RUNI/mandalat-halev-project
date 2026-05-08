import { Controller, NotFoundException, UseGuards } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract, UserProfileDto, ContactDto} from '@mandalat-halev-project/api-interfaces';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
@UseGuards(FirebaseAuthGuard)
export class UserController {

  @TsRestHandler(userContract.user.profile)
  async getProfile(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.user.profile, async () => {

      if (userId === '999') {
        throw new NotFoundException('User not found in Salesforce');
      }

      const responseBody: UserProfileDto = {
        salesforceUserId: userId,
        firstName: 'Shira',
        lastName: 'Maor',
        email: 'shira.maor@example.com',
        phoneNumber: '050-1234567',
        idNumber: '123456789',
        address: '12 Herzl St',
        city: 'Tel Aviv',
        birthDate: '1998-01-01',  
      };

      return {
        status: 200,
        body: responseBody,
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
        body: mockContacts,
      };
    });
  }
}