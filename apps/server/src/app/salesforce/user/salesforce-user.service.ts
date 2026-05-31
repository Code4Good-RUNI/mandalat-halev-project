import { Injectable, Logger } from '@nestjs/common';
import {
  LoginRequestDto,
  UserProfileDto,
  ContactDto,
} from '@mandalat-halev-project/api-interfaces';
import { SalesforceCoreService } from '../core/salesforce-core.service';
import { SalesforceMapper } from '../salesforce.mapper';

// Contact fields available in the External Customer App
const CONTACT_FIELDS = [
  'Id',
  'Name',
  'Email',
  'Phone',
  'MobilePhone',
  'RegisteredID__c',
  'StreetName__c',
  'settlement_Name__r.Name',
  'HomeNumber__c',
  'Apartment_No_Field__c',
  'Birthdate',
];
@Injectable()
export class SalesforceUserService {
  private readonly logger = new Logger(SalesforceUserService.name);

  constructor(private readonly core: SalesforceCoreService) {}

  // -------------------------------------For testing------------------------------------------------

  async onModuleInit() {
    this.logger.log(
      '🚀 [Profile Sandbox] Starting User Profile Verification Flow...',
    );
    //await this.testUserProfileSandbox();
  }

  // ---------------------------------------------------------------------------------------------
  // ---------------------------------------------------------------------------------------------

  async validateLogin(credentials: LoginRequestDto): Promise<string | null> {
    const { phoneNumber, idNumber } = credentials;
    const phoneVariations = SalesforceMapper.getPhoneVariations(phoneNumber);

    const contactObj = await this.core.sobject('Contact');
    const records = await contactObj
      .find(
        {
          $or: [
            { Phone: { $in: phoneVariations } },
            { MobilePhone: { $in: phoneVariations } },
          ],
          RegisteredID__c: idNumber,
        },
        ['Id'],
      )
      .limit(1)
      .execute();

    // login failed
    if (records.length === 0) {
      this.logger.warn(`Login attempt failed for ID: ${idNumber}`);
      return null;
    }

    return records[0].Id as string;
  }

  async getUserProfile(
    salesforceUserId: string,
  ): Promise<UserProfileDto | null> {
    try {
      const contactObj = await this.core.sobject('Contact');
      const records = await contactObj
        .find({ Id: salesforceUserId }, CONTACT_FIELDS)
        .limit(1)
        .execute();

      if (records.length === 0) {
        this.logger.warn(
          `Profile not found for Salesforce User ID: ${salesforceUserId}`,
        );
        return null;
      }

      const raw = records[0];
      const fullName = (raw.Name as string) || '';
      const spaceIndex = fullName.indexOf(' ');
      const rawPhone =
        (raw.Phone as string) || (raw.MobilePhone as string) || '';

      const rawEmail = (raw.Email as string) || '';
      const safeEmail = rawEmail.includes('@')
        ? rawEmail
        : 'no-email@mandalat-halev.org';

      const cityStr = (raw.settlement_Name__r as any)?.Name || '';

      const street = (raw.StreetName__c as string) || '';
      const homeNumber = raw.HomeNumber__c ? String(raw.HomeNumber__c) : '';
      const apartment = raw.Apartment_No_Field__c
        ? String(raw.Apartment_No_Field__c)
        : '';

      let fullAddress = street;
      if (homeNumber) {
        fullAddress += ` ${homeNumber}`;
      }
      if (apartment) {
        fullAddress += `, דירה ${apartment}`;
      }

      return {
        salesforceUserId,
        firstName:
          spaceIndex > -1 ? fullName.substring(0, spaceIndex) : fullName,
        lastName: spaceIndex > -1 ? fullName.substring(spaceIndex + 1) : '',
        email: safeEmail,
        phoneNumber: SalesforceMapper.formatPhoneNumber(rawPhone),
        idNumber: (raw.RegisteredID__c as string) || '',
        address: fullAddress.trim(),
        city: cityStr,
        birthDate: SalesforceMapper.formatDateToIsraeli(
          raw.Birthdate as string,
        ),
      };
    } catch (error) {
      this.logger.error(
        `Error fetching profile for user ${salesforceUserId}`,
        error,
      );
      throw error;
    }
  }

  async getFamilyMembers(salesforceUserId: string): Promise<ContactDto[]> {
    const contactObj = await this.core.sobject('Contact');

    const userRecords = await contactObj
      .find({ Id: salesforceUserId }, [
        'Id',
        'Name',
        'FirstName',
        'LastName',
        'RegisteredID__c',
        'AccountId',
      ])
      .limit(1)
      .execute();

    if (userRecords.length === 0) {
      this.logger.warn(`User not found for Salesforce ID: ${salesforceUserId}`);
      return [];
    }

    const currentUser = userRecords[0];
    const accountId = currentUser.AccountId;

    if (!accountId) {
      this.logger.debug(
        `User ${currentUser.Name} is not associated with any Account (Household).`,
      );
      return [
        {
          salesforceUserId: currentUser.Id,
          firstName: currentUser.FirstName || currentUser.Name,
          lastName: currentUser.LastName || '',
          idNumber: (currentUser.RegisteredID__c as string) || '',
          birthDate: '',
        },
      ];
    }

    this.logger.debug(
      `User found. Fetching ALL family members for Account ID: ${accountId} (Including the current user)`,
    );

    const familyMembersRaw = await contactObj
      .find({ AccountId: accountId }, [
        'Id',
        'Name',
        'FirstName',
        'LastName',
        'RegisteredID__c',
        'Birthdate',
      ])
      .execute();

    return familyMembersRaw.map((member: any) => {
      const fullName = (member.Name as string) || '';
      const spaceIdx = fullName.indexOf(' ');
      const fName =
        member.FirstName ||
        (spaceIdx > -1 ? fullName.substring(0, spaceIdx) : fullName);
      const lName =
        member.LastName ||
        (spaceIdx > -1 ? fullName.substring(spaceIdx + 1) : '');

      return {
        salesforceUserId: member.Id,
        firstName: fName,
        lastName: lName,
        idNumber: (member.RegisteredID__c as string) || '',
        birthDate: SalesforceMapper.formatDateToIsraeli(
          member.Birthdate as string,
        ),
      };
    });
  }
}