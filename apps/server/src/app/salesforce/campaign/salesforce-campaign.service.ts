import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { SalesforceCoreService } from '../core/salesforce-core.service';
import {
  SalesforceMapper,
  ALLOWED_REGISTRATION_STATUSES,
  CANCELED_STATUSES,
} from '../salesforce.mapper';
import {
  GetFutureCampaignDto,
  GetPastCampaignDto,
  RegisterForCampaignDto,
  RegisterResponseDto,
  UnregisterFromCampaignDto,
  GetRegistrationStatusDto,
  CampaignMemberRegistrationDto,
  ContactDto,
} from '@mandalat-halev-project/api-interfaces';
import { SalesforceUserService } from '../user/salesforce-user.service';

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

  constructor(
    private readonly core: SalesforceCoreService,
    @Inject(forwardRef(() => SalesforceUserService))
    private readonly userService: SalesforceUserService,
  ) {}
  // ---------------------------------------------------------------------------------------------
  // ----------------------------------For testing------------------------------------------------
  //      const testContactId = '003Vk000008BBuoIAG'; משתמש רנדומלי
  //      const testContactId = '003JW00001J9Bu1YAF'; אלון
  //ID: 701Vk00000TkN4AIAV | Name: "קבוצת תמיכה דיאדי י א'-ב'" | Dates: 2025-10-15 - 2026-06-30
  //ID: 701Vk00000TkOZhIAN | Name: "קבוצת תמיכה ילדים ה'-ו'." | Dates: 2025-10-15 - 2026-06-30
  //ID: 701Vk00000TkOZiIAN | Name: "קבוצת תמיכה אופקים" | Dates: 2025-10-15 - 2026-06-30
  //ID: 701Vk00000TkRAzIAN | Name: "קבוצת תמיכה -אבלים" | Dates: 2025-10-15 - 2026-06-30
  //ID: 701Vk00000TkRqvIAF | Name: "קבוצת תמיכה  חופים -מחלימות" | Dates: 2025-10-15 - 2026-06-30
  //ID: 701Vk00000TkSa5IAF | Name: "קבוצת תמיכה אדוות - מחלימות" | Dates: 2025-10-15 - 2026-06-30

  async onModuleInit() {
    //this.logger.log(
     // '🚀 [Campaign Sandbox] Starting Household Registration Logic Test...',
    //);
  }

  //------------------------------------------------------------------------------------------------------------------

  /**
   * Get user's future campaigns
   * @param contactId - Salesforce Contact ID
   * @returns GetFutureCampaignDto[]
   */
  async getFutureCampaigns(contactId: string): Promise<GetFutureCampaignDto[]> {
    const familyMembers = await this.userService.getFamilyMembers(contactId);

    const familyIds = familyMembers
      .map((m) => m.salesforceUserId)
      .filter((id) => /^[a-zA-Z0-9]{15,18}$/.test(id))
      .map((id) => `'${id}'`)
      .join(', ');

    const query = `SELECT ${CAMPAIGN_QUERY_FIELDS}, 
                          (SELECT ${CMF.STATUS} FROM CampaignMembers WHERE ${CMF.CONTACT_ID} IN (${familyIds}) LIMIT 1)
                        FROM Campaign 
                        WHERE ${CF.END_DATE} >= TODAY 
                        AND ${CF.ID} IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember WHERE ${CMF.CONTACT_ID} IN (${familyIds}))
                        ORDER BY ${CF.START_DATE} ASC`;

    const records = await this.core.query<any>(query);

    return records.map((campaign): GetFutureCampaignDto => {
      const membership = campaign.CampaignMembers?.records?.[0];
      return {
        ...SalesforceMapper.mapBaseCampaign(campaign),
        isRelevantToUser: true,
        isUserRegistered: !!membership,
        userApprovalStatus: SalesforceMapper.mapStatusToApproval(
          membership?.Status,
        ),
      };
    });
  }

  /**
   * Get campaigns available for registration (Future and none of the users are registered)
   * @param salesforceUserId - Salesforce user ID
   * @returns GetFutureCampaignDto[]
   */
  async getActiveCampaigns(contactId: string): Promise<GetFutureCampaignDto[]> {
    const familyIds = await this.getSecureFamilyIdsForQuery(contactId);

    const allowedStatusesSOQL = ALLOWED_REGISTRATION_STATUSES.map(
      (status) => `'${status}'`,
    ).join(', ');

    const query = `SELECT ${CAMPAIGN_QUERY_FIELDS} FROM Campaign
                        WHERE ${CF.END_DATE} >= TODAY AND ${CF.STATUS}
                        IN(${allowedStatusesSOQL}) AND ${CF.ID}                                 
                        NOT IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember
                        WHERE ${CMF.CONTACT_ID} IN (${familyIds}))
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
   * @param contactId - Salesforce Contact ID
   * @returns GetPastCampaignDto[]
   */
  async getPastCampaigns(contactId: string): Promise<GetPastCampaignDto[]> {
    const familyMembers = await this.userService.getFamilyMembers(contactId);

    const familyIds = familyMembers
      .map((m) => m.salesforceUserId)
      .filter((id) => /^[a-zA-Z0-9]{15,18}$/.test(id))
      .map((id) => `'${id}'`)
      .join(', ');

    const query = `SELECT ${CAMPAIGN_QUERY_FIELDS}, 
                      (SELECT ${CMF.STATUS} FROM CampaignMembers WHERE ${CMF.CONTACT_ID} IN (${familyIds}) LIMIT 1)
                      FROM Campaign 
                      WHERE ${CF.END_DATE} < TODAY 
                      AND ${CF.ID} IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember WHERE ${CMF.CONTACT_ID} IN (${familyIds})) 
                      ORDER BY ${CF.END_DATE} DESC`;

    const records = await this.core.query<any>(query);

    return records.map((reg): GetPastCampaignDto => {
      const membership = reg.CampaignMembers?.records?.[0];
      const approvalStatus = SalesforceMapper.mapStatusToApproval(
        membership?.Status,
      );
      const isCampaignCanceled = CANCELED_STATUSES.includes(reg.Status);
      const hasParticipated =
        !isCampaignCanceled && approvalStatus !== 'rejected';

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

  /**
   * Get registration status for all household members
   */
  async getRegistrationStatus(
    contactId: string,
    campaignId: string,
  ): Promise<GetRegistrationStatusDto> {
    const familyMembers = await this.userService.getFamilyMembers(contactId);
    const familyIds = familyMembers.map((m) => m.salesforceUserId);

    const memberObj = await this.core.sobject('CampaignMember');
    const records = await memberObj
      .find(
        {
          [CMF.CAMPAIGN_ID]: campaignId,
          [CMF.CONTACT_ID]: { $in: familyIds },
        },
        [CMF.CONTACT_ID, CMF.STATUS],
      )
      .execute();

    const statusMap = new Map<string, string>();
    records.forEach((record) => {
      statusMap.set(record.ContactId, record.Status);
    });

    const registeredMembers: CampaignMemberRegistrationDto[] = familyMembers
      .filter((member) => statusMap.has(member.salesforceUserId))
      .map((member) => ({
        ...member,
        registrationStatus: SalesforceMapper.mapStatusToApproval(
          statusMap.get(member.salesforceUserId)!,
        ),
        additionalInfo: '',
      }));

    return { campaignId, registeredMembers };
  }

  /**
   * Get household contacts who are NOT registered for a specific campaign
   */
  async getUnregisteredContactsForCampaign(
    contactId: string,
    campaignId: string,
  ): Promise<{ campaignId: string; contacts: ContactDto[] }> {
    const familyMembers = await this.userService.getFamilyMembers(contactId);
    const familyIds = familyMembers.map((m) => m.salesforceUserId);

    const memberObj = await this.core.sobject('CampaignMember');
    const records = await memberObj
      .find(
        {
          [CMF.CAMPAIGN_ID]: campaignId,
          [CMF.CONTACT_ID]: { $in: familyIds },
        },
        [CMF.CONTACT_ID],
      )
      .execute();

    const registeredIds = new Set(records.map((record) => record.ContactId));

    const unregisteredContacts = familyMembers.filter(
      (member) => !registeredIds.has(member.salesforceUserId),
    );

    return { campaignId, contacts: unregisteredContacts };
  }

  async campaignExists(campaignId: string): Promise<boolean> {
    const query = soql`SELECT ${CF.ID} FROM Campaign WHERE ${CF.ID} = '${campaignId}' LIMIT 1`;
    const records = await this.core.query(query);
    return records.length > 0;
  }

  /**
   * Helper: Gets family IDs formatted for SOQL in a secure way
   */
  private async getSecureFamilyIdsForQuery(contactId: string): Promise<string> {
    const familyMembers = await this.userService.getFamilyMembers(contactId);
    return familyMembers
      .map((m) => m.salesforceUserId)
      .filter((id) => /^[a-zA-Z0-9]{15,18}$/.test(id)) // הגנה מ-Injection
      .map((id) => `'${id}'`)
      .join(', ');
  }

  // =========================================================================
  // CRON JOB GLOBAL QUERIES 
  // =========================================================================

  /**
   * Fetch all campaigns created or activated today
   */
  async getNewCampaignsToday(): Promise<{ campaignId: string }[]> {
    const query = `SELECT Id FROM Campaign WHERE CreatedDate = TODAY AND IsActive = true`;
    const records = await this.core.query<any>(query);
    
    return records.map(r => ({ campaignId: r.Id }));
  }

  /**
   * Fetch contacts who have an activity starting tomorrow
   */
  async getUpcomingActivityReminders(): Promise<{ campaignName: string; contactId: string; daysUntil: number }[]> {
    const query = `
      SELECT CampaignId, Campaign.Name, ContactId 
      FROM CampaignMember 
      WHERE Campaign.StartDate = TOMORROW 
      AND Status IN ('Confirmed', 'Approved', 'Registered')
    `;
    const records = await this.core.query<any>(query);
    
    return records.map(r => ({
      campaignName: r.Campaign.Name,
      contactId: r.ContactId,
      daysUntil: 1
    }));
  }

  /**
   * Fetch registration statuses modified recently (last 2 days)
   */
  async getUpcomingRegistrationStatuses(): Promise<{ salesforceUserId: string; campaignId: string; campaignName: string; registrationStatus: string }[]> {
    const query = `
      SELECT CampaignId, Campaign.Name, ContactId, Status 
      FROM CampaignMember 
      WHERE LastModifiedDate = LAST_N_DAYS:2
    `;
    const records = await this.core.query<any>(query);
    
    return records.map(r => ({
      salesforceUserId: r.ContactId,
      campaignId: r.CampaignId,
      campaignName: r.Campaign.Name,
      registrationStatus: SalesforceMapper.mapStatusToApproval(r.Status)
    }));
  }
}