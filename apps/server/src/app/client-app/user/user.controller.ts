import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';

@Controller()
export class UserController {
  
  @TsRestHandler(userContract.user.profile)
  async getProfile() {
    return tsRestHandler(userContract.user.profile, async ({ params }) => {
      console.log(`Fetching profile for salesforceUserId: ${params.salesforceUserId}`);

      // 404 Error: Testing the consistent error structure
      if (params.salesforceUserId === 999) {
        return {
          status: 404,
          body: {
            status_code: 'NOT_FOUND',
            message: 'User not found in Salesforce',
          },
        };
      }

      // 200 Success: Return dummy user data

      return {
        status: 200,
        body: {
          salesforceUserId: params.salesforceUserId,
          firstName: 'Shira',
          lastName: 'Maor',
          email: 'shira.maor@example.com',
          phoneNumber: '050-1234567',
          idNumber: '123456789',
          address: '12 Herzl St',
          city: 'Tel Aviv',
          birthDate: '1998-01-01',
        },
      };
    });
  }
}