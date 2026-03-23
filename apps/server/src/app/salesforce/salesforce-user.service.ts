import { Injectable, Logger, } from '@nestjs/common';
import { LoginRequestDto, UserProfileDto} from '@mandalat-halev-project/api-interfaces';
import { SalesforceCoreService } from './salesforce-core.service';
import { SalesforceMapper } from './salesforce.mapper';

@Injectable()
export class SalesforceUserService {
  private readonly logger = new Logger(SalesforceUserService.name);

  constructor(private readonly core: SalesforceCoreService) {}

  /**
   * Authenticate User
   * @param credentials - LoginRequestDto (phoneNumber, idNumber)
   * @returns User's ID or null if not exists
   */
  async validateLogin(credentials: LoginRequestDto): Promise<number | null> {
    const { phoneNumber, idNumber } = credentials;

    // sql query
    const soql = `
    SELECT External_ID__c 
    FROM Contact 
    WHERE (Phone = '${phoneNumber}' OR MobilePhone = '${phoneNumber}')
    AND RegisteredID__c = '${idNumber}' 
    LIMIT 1`;

    const records = await this.core.query<any>(soql);

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
  async getUserProfile(
    salesforceUserId: number,
  ): Promise<UserProfileDto | null> {
    // soql query
    const soql = `SELECT External_ID__c, FirstName, LastName, Email, Phone,
       RegisteredID__c, MailingStreet, CityName__c, Birthdate
    FROM Contact WHERE External_ID__c = '${salesforceUserId}' LIMIT 1`;

    try {
      const records = await this.core.query<any>(soql);

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

  /**
   * Gets internal contact ID in salesforce server
   */
  async getInternalContactId(salesforceUserId: number): Promise<string | null> {
    // gets user ID in salesforce server
    const contact = await this.core.query<any>(
      `SELECT Id FROM Contact WHERE External_ID__c = '${salesforceUserId}' LIMIT 1`,
    );

    if (contact.length === 0) {
      this.logger.warn(
        `User with External ID ${salesforceUserId} not found in Salesforce`,
      );
      return null;
    }
    return contact[0].Id;
  }
}
