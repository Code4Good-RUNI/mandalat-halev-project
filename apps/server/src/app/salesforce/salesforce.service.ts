import {Injectable, Logger, InternalServerErrorException} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';
import {
  LoginRequestDto,
  UserProfileDto,
  GetFutureCampaignDto,
} from '@mandalat-halev-project/api-interfaces';

@Injectable()
export class SalesforceService {
  private readonly logger = new Logger(SalesforceService.name);
  private accessToken: string | undefined = undefined;
  private instanceUrl: string | undefined = undefined;

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    // ---------------------- test auth ----------------
    //this.authenticate().catch(err => {//
    //});
  }

  // Private method to authenticate to Salesforce's server (Server-to-Server)
  private async authenticate(): Promise<void> {
    this.logger.log('Initiating Salesforce authentication...');

    const host = this.configService.get<string>('SF_HOST');
    const clientId = this.configService.get<string>('SF_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SF_CLIENT_SECRET');

    if (!clientId || !clientSecret || !host) {
      this.logger.error('Missing Salesforce configuration in .env');
      throw new InternalServerErrorException('Salesforce configuration error');
    }

    const url = `${host}/services/oauth2/token`;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      this.accessToken = data.access_token;
      this.instanceUrl = data.instance_url;
      this.logger.log('Salesforce authentication successful.');
    } catch (error) {
      // HTTP error
      if (isAxiosError(error)) {
        const errorData = error.response?.data;
        this.logger.error('Failed to authenticate with Salesforce', errorData);
      } else {
        // General error
        this.logger.error('An unexpected error occurred', error);
      }
      throw new InternalServerErrorException('Salesforce connection failed');
    }
  }

  // Generic SOQL query to server, includes renew token if expired
  async query<T>(soql: string): Promise<T[]> {
    if (!this.accessToken || !this.instanceUrl) {
      await this.authenticate();
    }

    const url = `${this.instanceUrl}/services/data/v60.0/query`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          params: { q: soql },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }),
      );

      // Salesforce's results
      return data.records as T[];
    } catch (error) {
      // When token expired - error 401
      if (isAxiosError(error) && error.response?.status === 401) {
        this.logger.warn('Salesforce token expired during query. Retrying...');
        await this.authenticate();
        return this.query<T>(soql);
      }

      // Other errors
      if (isAxiosError(error)) {
        this.logger.error(`SOQL Query failed: ${soql}`, error.response?.data);
      } else {
        this.logger.error('Unexpected error during Salesforce query', error);
      }
      throw new InternalServerErrorException(
        'Failed to fetch data from Salesforce',
      );
    }
  }

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

    const records = await this.query<any>(soql);

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
      const records = await this.query<any>(soql);

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
        birthDate: this.formatDateToIsraeli(raw.Birthdate), // convert if needed
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
   * Convert date to Israeli format if needed
   */
  private formatDateToIsraeli(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Get user's future campaigns
   * @param salesforceUserId - Salesforce user ID received when logged in
   * @returns UserProfileDto or null if not found
   */
  async getFutureCampaigns(salesforceUserId: number,): Promise<GetFutureCampaignDto[]> {
    // gets user ID in salesforce server
    const contact = await this.query<any>(
      `SELECT Id FROM Contact WHERE External_ID__c = '${salesforceUserId}' LIMIT 1`,
    );

    if (contact.length === 0) {
      this.logger.warn(`User with External ID ${salesforceUserId} not found in Salesforce`,);
      return [];
    }
    const contactId = contact[0].Id;

    // SOQL query for relative date
    const soql = `
      SELECT
        External_ID__c, Name, Description, StartDate, EndDate, IsActive,
        ActivityLocation__c, Max_Participants__c, Image_URL__c,
        (SELECT Status FROM CampaignMembers WHERE ContactId = '${contactId}' LIMIT 1)
      FROM Campaign
      WHERE StartDate >= TODAY AND IsActive = true
    `;

    const records = await this.query<any>(soql);

    // map data to GetFutureCampaignDto array
    return records.map((reg): GetFutureCampaignDto => {
      const membership =
        reg.CampaignMembers && reg.CampaignMembers.records
          ? reg.CampaignMembers.records[0]
          : null;

      return {
        // fields of CampaignDto
        id: reg.External_ID__c ? Number(reg.External_ID__c) : 0,
        name: reg.Name || '',
        description: reg.Description || '',
        imageUrl: reg.Image_URL__c || '',
        startDate: this.formatDateToIsraeli(reg.StartDate),
        endDate: this.formatDateToIsraeli(reg.EndDate),
        durationInHours: this.calculateDuration(reg.StartDate, reg.EndDate),
        locationAddress: reg.Location_Address__c || '',
        locationCity: reg.Location_City__c || '',
        numOfParticipants: reg.Max_Participants__c || 0,
        numOfParticipantsRegistered: 0, // need to check if exist or need to calculate
        isActive: !!reg.IsActive,

        // fields of GetFutureCampaignDto
        isRelevantToUser: true,
        isUserRegistered: !!membership,
        userApprovalStatus: this.mapStatusToApproval(membership?.Status),
      };
    });
  }

  /**
   * Gets user approval status
   */
  private mapStatusToApproval(status: string) {
    if (status === 'Confirmed') return 'approved';
    if (status === 'Rejected') return 'rejected';
    return 'pending';
  }

  /**
   * Calculates duration
   */
  private calculateDuration(start: string, end: string): number {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffInMs = endDate.getTime() - startDate.getTime();
    return Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60)));
  }
}
