import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SalesforceCoreService } from '../core/salesforce-core.service';
import {
  SalesforceMapper,
  ALLOWED_REGISTRATION_STATUSES,
  CANCELED_STATUSES,
  COMPLETED_PARTICIPATION_STATUSES,
} from '../salesforce.mapper';
import {
  GetFutureCampaignDto,
  GetPastCampaignDto,
  RegisterForCampaignDto,
  RegisterResponseDto,
  UnregisterFromCampaignDto,
  GetRegistrationStatusDto,
  GetFutureCampaignSchema,
  GetPastCampaignSchema,
} from '@mandalat-halev-project/api-interfaces';
import { z } from 'zod';

// Campaign fields available in the External Customer App
// Campaign fields
const CF = {
  ID: 'Id',
  NAME: 'Name',
  DESCRIPTION: 'Description',
  IS_ACTIVE: 'IsActive',
  STATUS: 'Status',
  START_DATE: 'StartDate',
  END_DATE: 'EndDate',
  TYPE: 'Chug_Type__c',
  DAYS_AND_HOURS: 'Activities_Days_And_Hours__c',
  LOCATION: 'ActivityLocation__c',
  MAX_PARTICIPANTS: 'max_participants__c',
  NUM_OF_CONTACTS: 'NumberOfContacts',
  HOST_ID: 'AdvisorName__c',
  HOST_NAME: 'AdvisorName__r.Name',
  HOST_FIRST_NAME: 'AdvisorName__r.FirstName',
  HOST_LAST_NAME: 'AdvisorName__r.LastName',
  HOST_ID_NUMBER: 'AdvisorName__r.RegisteredID__c',
  HOST_BIRTHDATE: 'AdvisorName__r.Birthdate',
};

// Campaign Member fields
const CMF = {
  ID: 'Id',
  STATUS: 'Status',
  CONTACT_ID: 'ContactId',
  CAMPAIGN_ID: 'CampaignId',
};

// Fields to select in campaign queries
const CAMPAIGN_QUERY_FIELDS = [
  CF.ID,
  CF.NAME,
  CF.DESCRIPTION,
  CF.IS_ACTIVE,
  CF.STATUS,
  CF.START_DATE,
  CF.END_DATE,
  CF.TYPE,
  CF.DAYS_AND_HOURS,
  CF.LOCATION,
  CF.MAX_PARTICIPANTS,
  CF.NUM_OF_CONTACTS,
  CF.HOST_ID,
  CF.HOST_NAME,
].join(', ');

// SOQL injection avoiding tag
const soql = SalesforceCoreService.soql;

@Injectable()
export class SalesforceCampaignService {
  private readonly logger = new Logger(SalesforceCoreService.name);

  constructor(private readonly core: SalesforceCoreService) {}

  // ---------------------------------------------------------------------------------------------
  // ----------------------------------For testing------------------------------------------------
  //      const testContactId = '003Vk000008BBuoIAG'; משתמש רנדומלי
  //      const testContactId = '003JW00001J9Bu1YAF'; אלון

  async onModuleInit() {
    this.logger.log('🚀 [Campaign Sandbox] Starting Zod Schema Validation...');
    await this.testUnregistrationSandbox();
  }
  private async testUnregistrationSandbox(): Promise<void> {
    try {
      const testContactId = '003JW00001J9Bu1YAF';
      const testCampaignId = '701Vk00000TkOZhIAN'; // אותו קמפיין שנרשמנו אליו

      this.logger.log(
        `🧪 Starting unregistration test for Contact: ${testContactId}...`,
      );

      const result = await this.unregister({
        contactIds: [testContactId],
        campaignId: testCampaignId,
      });

      if (result.requestReceivedSuccessfully) {
        this.logger.log(
          `✅ Unregistration test passed! Salesforce Member deleted.`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Unregistration test failed: ${error.message}`);
    }
  }

  /**
   * פונקציית בדיקה לשמה יצה רישום אמיתי ב-Sandbox)
   */
  private async testRegistrationSandbox(): Promise<void> {
    try {
      // השתמש ב-ID של משתמש שאפשר לשחק איתו
      const testContactId = '003JW00001J9Bu1YAF';
      const testCampaignId = '701Vk00000TkOZhIAN'; // שים כאן ID של קמפיין שקיים במערכת

      this.logger.log(
        `🧪 Starting registration test for Contact: ${testContactId}...`,
      );

      const result = await this.register({
        contactIds: [testContactId],
        campaignId: testCampaignId,
      });

      if (result.requestReceivedSuccessfully) {
        this.logger.log(
          `✅ Registration test passed! Salesforce Member created.`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Registration test failed: ${error.message}`);
    }
  }

  /**
   * פונקציית טסט מקיפה לבדיקת כל סוגי הקמפיינים (פעילים, עתידיים, עבר)
   */
  private async testAllCampaignsSandbox(): Promise<void> {
    try {
      // ה-ID של המשתמש האמיתי ששמת (כדי שנוכל לראות למה הוא באמת רשום)
      const testContactId = '003JW00001J9Bu1YAF';
      this.logger.log(
        `🔍 Fetching ALL campaigns for contact: ${testContactId}`,
      );
      this.logger.debug(`==================================================`);

      // 1. בדיקת קמפיינים פעילים (פתוחים להרשמה)
      this.logger.log(`🟢 --- ACTIVE CAMPAIGNS (Available to register) ---`);
      const activeCampaigns = await this.getActiveCampaigns(testContactId);
      const activeValidation = z
        .array(GetFutureCampaignSchema)
        .safeParse(activeCampaigns);

      if (activeValidation.success) {
        this.logger.log(
          `✅ PERFECT MATCH! Found ${activeCampaigns.length} Active campaigns.`,
        );
        if (activeCampaigns.length > 0)
          // מחקנו את ה-[0] כאן
          console.dir(activeValidation.data, { depth: null, colors: true });
      } else {
        this.logger.error('❌ Active Campaigns failed Zod validation:');
        console.error(JSON.stringify(activeValidation.error.format(), null, 2));
      }
      this.logger.debug(`--------------------------------------------------`);

      // 2. בדיקת קמפיינים עתידיים (כבר רשום אליהם)
      this.logger.log(`🔵 --- FUTURE CAMPAIGNS (User is registered) ---`);
      const futureCampaigns = await this.getFutureCampaigns(testContactId);
      const futureValidation = z
        .array(GetFutureCampaignSchema)
        .safeParse(futureCampaigns);

      if (futureValidation.success) {
        this.logger.log(
          `✅ PERFECT MATCH! Found ${futureCampaigns.length} Future campaigns.`,
        );
        if (futureCampaigns.length > 0)
          // מחקנו את ה-[0] כאן
          console.dir(futureValidation.data, { depth: null, colors: true });
      } else {
        this.logger.error('❌ Future Campaigns failed Zod validation:');
        console.error(JSON.stringify(futureValidation.error.format(), null, 2));
      }
      this.logger.debug(`--------------------------------------------------`);

      // 3. בדיקת קמפייני עבר (היסטוריה)
      this.logger.log(`⚪ --- PAST CAMPAIGNS (History) ---`);
      const pastCampaigns = await this.getPastCampaigns(testContactId);
      const pastValidation = z
        .array(GetPastCampaignSchema)
        .safeParse(pastCampaigns);

      if (pastValidation.success) {
        this.logger.log(
          `✅ PERFECT MATCH! Found ${pastCampaigns.length} Past campaigns.`,
        );
        if (pastCampaigns.length > 0)
          // מחקנו את ה-[0] כאן
          console.dir(pastValidation.data, { depth: null, colors: true });
      } else {
        this.logger.error('❌ Past Campaigns failed Zod validation:');
        console.error(JSON.stringify(pastValidation.error.format(), null, 2));
      }
      this.logger.debug(`==================================================`);
    } catch (error) {
      this.logger.error('❌ [Campaign Sandbox] Failed', error);
    }
  }
  //------------------------------------------------------------------------------------------------------------------

  /**
   * Get user's future campaigns
   * @param salesforceUserId - Salesforce user ID received when logged in
   * @returns GetFutureCampaignDto or null if not found
   */
  async getFutureCampaigns(contactId: string): Promise<GetFutureCampaignDto[]> {
    const query = soql`SELECT ${CAMPAIGN_QUERY_FIELDS}, (SELECT ${CMF.STATUS}
                                  FROM CampaignMembers WHERE ${CMF.CONTACT_ID} = '${contactId}' LIMIT 1)
                                  FROM Campaign WHERE ${CF.END_DATE} >= TODAY AND ${CF.ID} IN (SELECT ${CMF.CAMPAIGN_ID}
                                  FROM CampaignMember WHERE ${CMF.CONTACT_ID} = '${contactId}')
                                                ORDER BY ${CF.START_DATE} ASC`;

    const records = await this.core.query<any>(query);

    return records.map((campaign): GetFutureCampaignDto => {
      const membership = campaign.CampaignMembers?.records?.[0];
      return {
        ...SalesforceMapper.mapBaseCampaign(campaign),
        isRelevantToUser: true,
        isUserRegistered: true,
        userApprovalStatus: SalesforceMapper.mapStatusToApproval(
          membership?.Status,
        ),
      };
    });
  }

  /**
   * Get campaigns available for registration (Future and user NOT registered)
   * @param salesforceUserId - Salesforce user ID
   * @returns GetFutureCampaignDto[]
   */
  async getActiveCampaigns(contactId: string): Promise<GetFutureCampaignDto[]> {
    const allowedStatusesSOQL = ALLOWED_REGISTRATION_STATUSES.map(
      (status) => `'${status}'`,
    ).join(', ');

    const query = `SELECT ${CAMPAIGN_QUERY_FIELDS} FROM Campaign
                        WHERE ${CF.END_DATE} >= TODAY AND ${CF.STATUS}
                        IN(${allowedStatusesSOQL}) AND ${CF.ID}                                 
                        NOT IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember
                        WHERE ${CMF.CONTACT_ID} = '${contactId}')
                        ORDER BY ${CF.START_DATE} ASC`;

    const records = await this.core.query<any>(query);

    return records.map(
      (campaign): GetFutureCampaignDto => ({
        ...SalesforceMapper.mapBaseCampaign(campaign),
        isRelevantToUser: true,
        isUserRegistered: false,
        userApprovalStatus: 'pending',
      }),
    );
  }

  /**
   * Get user's past campaigns
   * @param salesforceUserId - Salesforce user ID received when logged in
   * @returns GetPastCampaignDto[]
   */
  async getPastCampaigns(contactId: string): Promise<GetPastCampaignDto[]> {
    const query = `SELECT ${CAMPAIGN_QUERY_FIELDS}, (SELECT ${CMF.STATUS} FROM
                      CampaignMembers WHERE ${CMF.CONTACT_ID} = '${contactId}' LIMIT 1)
                        FROM Campaign WHERE ${CF.END_DATE} < TODAY AND ${CF.ID}
                        IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember WHERE 
                        ${CMF.CONTACT_ID} = '${contactId}') ORDER BY ${CF.END_DATE} DESC`;
    const records = await this.core.query<any>(query);

    return records.map((reg): GetPastCampaignDto => {
      const membership = reg.CampaignMembers?.records?.[0];

      const approvalStatus = SalesforceMapper.mapStatusToApproval(
        membership?.Status,
      );

      const isCampaignCanceled = CANCELED_STATUSES.includes(reg.Status);

      const hasParticipated =
        !isCampaignCanceled && approvalStatus !== 'rejected';

      this.logger.debug(
        `[DEBUG] Campaign: ${reg.Name} | Approval: ${approvalStatus} | CampaignCanceled: ${isCampaignCanceled} | Result: ${hasParticipated}`,
      );

      return {
        ...SalesforceMapper.mapBaseCampaign(reg),
        hasUserParticipated: hasParticipated,
      };
    });
  }

  /**
   * Registers multiple contacts to a campaign.
   */
  async register(dto: RegisterForCampaignDto): Promise<RegisterResponseDto> {
    const { contactIds, campaignId } = dto;

    for (const contactId of contactIds) {
      this.logger.log(
        `Registering contact ${contactId} to campaign ${campaignId}`,
      );

      const checkQuery = soql`SELECT Id FROM CampaignMember WHERE ContactId = '${contactId}' AND CampaignId = '${campaignId}' LIMIT 1`;
      const existingRecords = await this.core.query<any>(checkQuery);

      if (existingRecords.length > 0) {
        this.logger.warn(
          `Contact ${contactId} is already registered to ${campaignId}`,
        );
        continue;
      }

      const result = await this.core.create('CampaignMember', {
        ContactId: contactId,
        CampaignId: campaignId,
        Status: 'Prospect',
      });

      if (!result.success) {
        const errorMsg = result.errors?.[0]?.message || 'Unknown error';
        this.logger.error(
          `Registration failed for contact ${contactId}: ${errorMsg}`,
        );
        throw new InternalServerErrorException(`Salesforce error: ${errorMsg}`);
      }
    }

    return {
      campaignId,
      requestReceivedSuccessfully: true,
    };
  }

  /**
   * Unregisters multiple contacts from a campaign.
   */
  async unregister(
    dto: UnregisterFromCampaignDto,
  ): Promise<RegisterResponseDto> {
    const { contactIds, campaignId } = dto;

    for (const contactId of contactIds) {
      this.logger.log(
        `Unregistering contact ${contactId} from campaign ${campaignId}`,
      );

      const query = soql`SELECT Id FROM CampaignMember WHERE ContactId = '${contactId}' AND CampaignId = '${campaignId}' LIMIT 1`;
      const records = await this.core.query<any>(query);

      if (records.length === 0) {
        this.logger.warn(
          `Contact ${contactId} not found in campaign ${campaignId}`,
        );
        throw new NotFoundException(
          `Contact ${contactId} is not registered to this campaign`,
        );
      }

      const memberRecordId = records[0].Id;

      const result = await this.core.destroy('CampaignMember', memberRecordId);

      if (!result.success) {
        throw new InternalServerErrorException(
          `Failed to unregister contact ${contactId}`,
        );
      }

      this.logger.log(`Successfully unregistered contact ${contactId}`);
    }

    return {
      campaignId,
      requestReceivedSuccessfully: true,
    };
  }

  async getRegistrationStatus(
    contactId: string,
    campaignId: string,
  ): Promise<GetRegistrationStatusDto> {
    const memberObj = await this.core.sobject('CampaignMember');
    const records = await memberObj
      .find({ [CMF.CONTACT_ID]: contactId, [CMF.CAMPAIGN_ID]: campaignId }, [
        CMF.STATUS,
      ])
      .limit(1)
      .execute();

    const registrationRecord = records[0];

    return {
      campaignId,
      registrationStatus: registrationRecord
        ? SalesforceMapper.mapStatusToApproval(registrationRecord[CMF.STATUS])
        : 'pending',
      additionalInfo: '',
    };
  }

  async campaignExists(campaignId: string): Promise<boolean> {
    const query = soql`SELECT ${CF.ID} FROM Campaign WHERE ${CF.ID} = '${campaignId}' LIMIT 1`;
    const records = await this.core.query(query);
    return records.length > 0;
  }
}

