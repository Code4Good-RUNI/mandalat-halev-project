import { Injectable, Logger } from '@nestjs/common';
import { LoginRequestDto, UserProfileDto } from '@mandalat-halev-project/api-interfaces';
import { SalesforceCoreService } from './salesforce-core.service';

// Contact fields available in the External Customer App
const CONTACT_FIELDS = ['Id', 'Name', 'Email', 'Phone', 'MobilePhone', 'RegisteredID__c'];

@Injectable()
export class SalesforceUserService {
  private readonly logger = new Logger(SalesforceUserService.name);

  constructor(private readonly core: SalesforceCoreService) {}

  async validateLogin(credentials: LoginRequestDto): Promise<string | null> {
    const { phoneNumber, idNumber } = credentials;

    const contactObj = await this.core.sobject('Contact');
    const records = await contactObj
      .find({
        $or: [{ Phone: phoneNumber }, { MobilePhone: phoneNumber }],
        RegisteredID__c: idNumber,
      }, ['Id'])
      .limit(1)
      .execute();

    // login failed
    if (records.length === 0) {
      this.logger.warn(`Login attempt failed for ID: ${idNumber}`);
      return null;
    }

    return records[0].Id as string;
  }

  async getUserProfile(salesforceUserId: string): Promise<UserProfileDto | null> {
    try {
      const contactObj = await this.core.sobject('Contact');
      const records = await contactObj
        .find({ Id: salesforceUserId }, CONTACT_FIELDS)
        .limit(1)
        .execute();

      if (records.length === 0) {
        this.logger.warn(`Profile not found for Salesforce User ID: ${salesforceUserId}`);
        return null;
      }

      const raw = records[0];
      const fullName = (raw.Name as string) || '';
      const spaceIndex = fullName.indexOf(' ');

      return {
        salesforceUserId,
        firstName: spaceIndex > -1 ? fullName.substring(0, spaceIndex) : fullName,
        lastName: spaceIndex > -1 ? fullName.substring(spaceIndex + 1) : '',
        email: (raw.Email as string) || '',
        phoneNumber: (raw.Phone as string) || (raw.MobilePhone as string) || '',
        idNumber: (raw.RegisteredID__c as string) || '',
        address: '',
        city: '',
        birthDate: '',
      };
    } catch (error) {
      this.logger.error(`Error fetching profile for user ${salesforceUserId}`, error);
      throw error;
    }
  }
}
