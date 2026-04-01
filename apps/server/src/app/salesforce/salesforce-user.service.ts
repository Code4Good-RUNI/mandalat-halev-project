import { Injectable, Logger, } from '@nestjs/common';
import { LoginRequestDto, UserProfileDto} from '@mandalat-halev-project/api-interfaces';
import { SalesforceCoreService } from './salesforce-core.service';
import { SalesforceMapper } from './salesforce.mapper';

@Injectable()
export class SalesforceUserService {
  private readonly logger = new Logger(SalesforceUserService.name);

  constructor(private readonly core: SalesforceCoreService) {}

  /**
   * Authenticate User using JSForce Query Builder
   * @param credentials - LoginRequestDto (phoneNumber, idNumber)
   * @returns User's ID or null if not exists
   */
  async validateLogin(credentials: LoginRequestDto): Promise<number | null> {
    const { phoneNumber, idNumber } = credentials;

    // using jsforce find to check if user exists
    const contactObj = await this.core.sobject('Contact');
    const records = await contactObj
      .find({
        $or: [{ Phone: phoneNumber }, { MobilePhone: phoneNumber }],
        RegisteredID__c: idNumber,
      })
      .limit(1)
      .execute();

    // login failed
    if (records.length === 0) {
      this.logger.warn(`Login attempt failed for ID: ${idNumber}`);
      return null;
    }
    return Number(records[0].External_ID__c);
  }

  /**
   * Get user's full profile by Salesforce user ID
   * @param salesforceUserId - Salesforce user ID received when logged in
   * @returns UserProfileDto or null if not found
   */
  async getUserProfile(salesforceUserId: number,): Promise<UserProfileDto | null> {
    try {

      // try to get user's profile using jsforce find
      const contactObj = await this.core.sobject('Contact');

      const fields = [
        'External_ID__c', 'FirstName', 'LastName', 'Email', 'Phone',
        'RegisteredID__c', 'MailingStreet', 'CityName__c', 'Birthdate',];

      const records = await contactObj
        .find({ External_ID__c: salesforceUserId }, fields)
        .limit(1)
        .execute();

      if (records.length === 0) {
        this.logger.warn(
          `Profile not found for Salesforce User ID: ${salesforceUserId}`,
        );
        return null;
      }

      const raw = records[0];

      // map to UserProfileDto
      return {
        salesforceUserId: Number(raw.External_ID__c),
        firstName: raw.FirstName || '',
        lastName: raw.LastName || '',
        email: raw.Email || '',
        phoneNumber: raw.Phone || '',
        idNumber: raw.RegisteredID__c || '',
        address: raw.MailingStreet || '',
        city: raw.CityName__c || '',
        birthDate: SalesforceMapper.formatDateToIsraeli(raw.Birthdate), // convert if needed
      };
    } catch (error) {
      this.logger.error(
        `Error fetching profile for user ${salesforceUserId}`,
        error,
      );
      throw error;
    }
  }
}
