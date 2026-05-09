import { Injectable, Logger } from '@nestjs/common';
import { SalesforceCoreService } from './salesforce-core.service';
import { SalesforceMapper } from './salesforce.mapper';
import {
  GetFutureCampaignDto,
  GetPastCampaignDto,
  RegisterForCampaignDto,
  RegisterResponseDto,
  UnregisterFromCampaignDto,
  GetRegistrationStatusDto,
} from '@mandalat-halev-project/api-interfaces';

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
  CF.ID, CF.NAME, CF.DESCRIPTION, CF.IS_ACTIVE,
  CF.START_DATE, CF.END_DATE, CF.TYPE,
  CF.DAYS_AND_HOURS, CF.LOCATION, CF.MAX_PARTICIPANTS,
  CF.NUM_OF_CONTACTS, CF.HOST_ID, CF.HOST_NAME,
].join(', ');

// SOQL injection avoiding tag
const soql = SalesforceCoreService.soql;

@Injectable()
export class SalesforceCampaignService {
  private readonly logger = new Logger(SalesforceCoreService.name);

  constructor(private readonly core: SalesforceCoreService) {}

  // TODO: remove after testing
  async onModuleInit() {
    try {
      this.logger.log(`\n=== Campaign 7010X000000f02tQAA ===`);
      const campaigns = await this.core.query<any>(
        `SELECT ${CAMPAIGN_QUERY_FIELDS} FROM Campaign WHERE Id = '7010X000000f02tQAA'`
      );
      if (campaigns.length > 0) {
        const mapped = SalesforceMapper.mapBaseCampaign(campaigns[0]);
        this.logger.log(`  Result: ${JSON.stringify(mapped, null, 2)}`);
      }
    } catch (err) {
      this.logger.error(`DEBUG failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  // is not done!!!!! need to be checked
  /**
   * Get user's future campaigns
   * @param salesforceUserId - Salesforce user ID received when logged in
   * @returns GetFutureCampaignDto or null if not found
   */
  async getFutureCampaigns(contactId: string): Promise<GetFutureCampaignDto[]> {
    const query = soql`
      SELECT ${CAMPAIGN_QUERY_FIELDS},
        (SELECT ${CMF.STATUS} FROM CampaignMembers WHERE ${CMF.CONTACT_ID} = '${contactId}' LIMIT 1)
      FROM Campaign
      WHERE ${CF.END_DATE} >= TODAY
        AND ${CF.IS_ACTIVE} = true
        AND ${CF.ID} IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember WHERE ${CMF.CONTACT_ID} = '${contactId}')
      ORDER BY ${CF.START_DATE} ASC`;

    const records = await this.core.query<any>(query);

    return records.map((campaign): GetFutureCampaignDto => {
      const membership = campaign.CampaignMembers?.records?.[0];
      return {
        ...SalesforceMapper.mapBaseCampaign(campaign),

        // fields of GetFutureCampaignDto
        isRelevantToUser: true,
        isUserRegistered: true,
        userApprovalStatus: SalesforceMapper.mapStatusToApproval(
          membership?.Status,
        ),
      };
    });
  }

  // is not done!!!!! need to be checked
  /**
   * Get campaigns available for registration (Future and user NOT registered)
   * @param salesforceUserId - Salesforce user ID
   * @returns GetFutureCampaignDto[]
   */
  async getActiveCampaigns(contactId: string): Promise<GetFutureCampaignDto[]> {
    const query = soql`
        SELECT ${CAMPAIGN_QUERY_FIELDS}
        FROM Campaign
        WHERE ${CF.END_DATE} >= TODAY
          AND ${CF.ID} NOT IN (
            SELECT ${CMF.CAMPAIGN_ID}
            FROM CampaignMember
            WHERE ${CMF.CONTACT_ID} = '${contactId}'
        )
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
  // is not done!!!!! need to be checked

  /**
   * Get user's past campaigns
   * @param salesforceUserId - Salesforce user ID received when logged in
   * @returns GetPastCampaignDto[]
   */
  async getPastCampaigns(contactId: string): Promise<GetPastCampaignDto[]> {
    const query = soql`SELECT ${CAMPAIGN_QUERY_FIELDS}
      FROM Campaign
      WHERE ${CF.END_DATE} < TODAY
        AND ${CF.ID} IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember WHERE ${CMF.CONTACT_ID} = '${contactId}')
      ORDER BY ${CF.END_DATE} DESC`;

    const records = await this.core.query<any>(query);

    return records.map(
      (reg): GetPastCampaignDto => ({
        ...SalesforceMapper.mapBaseCampaign(reg),
        hasUserParticipated: true,
      }),
    );
  }
  // is not done!!!!! need to be checked

  async register(
    contactId: string,
    campaignId: string,
  ): Promise<RegisterResponseDto> {
    try {
      await this.core.create('CampaignMember', {
        [CMF.CONTACT_ID]: contactId,
        [CMF.CAMPAIGN_ID]: campaignId,
        [CMF.STATUS]: 'Registered',
      });

      return { campaignId, requestReceivedSuccessfully: true };
    } catch (error) {
      this.logger.error('Registration failed', error);
      return { campaignId, requestReceivedSuccessfully: false };
    }
  }
  // is not done!!!!! need to be checked

  async unregister(
    contactId: string,
    campaignId: string,
  ): Promise<RegisterResponseDto> {
    const memberObj = await this.core.sobject('CampaignMember');
    const records = await memberObj
      .find({ [CMF.CONTACT_ID]: contactId, [CMF.CAMPAIGN_ID]: campaignId }, [
        CMF.ID,
      ])
      .limit(1)
      .execute();

    if (records.length === 0) {
      throw new Error('User is not registered to the campaign');
    }

    const memberRecordId = records[0].Id;
    if (!memberRecordId) {
      throw new Error('Campaign Member ID is missing in Salesforce');
    }

    try {
      await this.core.destroy('CampaignMember', memberRecordId);
      return { campaignId, requestReceivedSuccessfully: true };
    } catch (error) {
      this.logger.error('Unregistration failed', error);
      return { campaignId, requestReceivedSuccessfully: false };
    }
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
