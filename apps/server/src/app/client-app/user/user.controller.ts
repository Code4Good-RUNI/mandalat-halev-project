import { Controller, NotFoundException} from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract, UserProfileDto} from '@mandalat-halev-project/api-interfaces';

@Controller()
export class UserController {
  
  @TsRestHandler(userContract.user.profile)
  async getProfile() {
    return tsRestHandler(userContract.user.profile, async ({ params }) => {

      if (params.salesforceUserId === 999) {
        throw new NotFoundException('User not found in Salesforce');
      }

      const responseBody: UserProfileDto = {
        salesforceUserId: params.salesforceUserId,
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
}