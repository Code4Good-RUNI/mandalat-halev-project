import { Injectable, Logger } from '@nestjs/common';
import { SalesforceCoreService } from './salesforce-core.service';
import { SalesforceUserService } from './salesforce-user.service';
import { SalesforceMapper } from './salesforce.mapper';
import {
  GetFutureCampaignDto,
  GetPastCampaignDto,
  RegisterForCampaignDto,
  RegisterResponseDto,
  UnregisterFromCampaignDto,
  GetRegistrationStatusDto,
} from '@mandalat-halev-project/api-interfaces';

// Campaign's fields
const CF = {
  ID: 'Id',
  EXTERNAL_ID: 'External_ID__c',
  NAME: 'Name',
  DESCRIPTION: 'Description',
  START_DATE: 'StartDate',
  END_DATE: 'EndDate',
  IS_ACTIVE: 'IsActive',
  LOCATION: 'ActivityLocation__c',
  MAX_PARTICIPANTS: 'Max_Participants__c',
  IMAGE_URL: 'Image_URL__c',
};

// Campaign member's fieldsconst
const CMF = {
  ID: 'Id',
  STATUS: 'Status',
  CONTACT_ID: 'ContactId',
  CAMPAIGN_ID: 'CampaignId',
};

// fields for get Past/Future Campaign
const CAMPAIGN_QUERY_FIELDS = [
  CF.EXTERNAL_ID, CF.NAME, CF.DESCRIPTION, CF.START_DATE,
  CF.END_DATE, CF.IS_ACTIVE, CF.LOCATION, CF.MAX_PARTICIPANTS, CF.IMAGE_URL
].join(', ');

// SOQL injection avoiding tag
const soql = SalesforceCoreService.soql;

@Injectable()
export class SalesforceCampaignService {
  private readonly logger = new Logger(SalesforceCoreService.name);

  constructor(
    private readonly core: SalesforceCoreService,
    private readonly userService: SalesforceUserService,
  ) {}

  /**
   * Get user's future campaigns
   * @param salesforceUserId - Salesforce user ID received when logged in
   * @returns GetFutureCampaignDto or null if not found
   */
  async getFutureCampaigns(
    salesforceUserId: number,
  ): Promise<GetFutureCampaignDto[]> {
    const contactId = await this.userService.getInternalContactId(salesforceUserId);
    if (!contactId) return [];

    // SOQL query for relative date
    const query = soql`SELECT ${CAMPAIGN_QUERY_FIELDS},
        (SELECT ${CMF.STATUS} FROM CampaignMembers WHERE ${CMF.CONTACT_ID} = '${contactId}' LIMIT 1)
        FROM Campaign
        WHERE ${CF.END_DATE} >= TODAY
          AND ${CF.IS_ACTIVE} = true
          AND ${CF.ID} IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember WHERE ${CMF.CONTACT_ID} = '${contactId}')
        ORDER BY ${CF.START_DATE} ASC`;

    const records = await this.core.query<any>(query);

    // map data to GetFutureCampaignDto array
    return records.map((reg): GetFutureCampaignDto => {
      const membership =
        reg.CampaignMembers && reg.CampaignMembers.records
          ? reg.CampaignMembers.records[0]
          : null;

      return {
        // fields of CampaignDto
        ...SalesforceMapper.mapBaseCampaign(reg),

        // fields of GetFutureCampaignDto
        isRelevantToUser: true,
        isUserRegistered: !!membership,
        userApprovalStatus: SalesforceMapper.mapStatusToApproval(
          membership?.Status,
        ),
      };
    });
  }

  /**
   * Get user's past campaigns
   * @param salesforceUserId - Salesforce user ID received when logged in
   * @returns GetPastCampaignDto[]
   */
  async getPastCampaigns(
    salesforceUserId: number,
  ): Promise<GetPastCampaignDto[]> {
    const contactId = await this.userService.getInternalContactId(salesforceUserId);
    if (!contactId) return [];

    // SOQL query for relative date
    const query = soql`SELECT ${CAMPAIGN_QUERY_FIELDS}
      FROM Campaign
      WHERE ${CF.END_DATE} < TODAY
        AND ${CF.ID} IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember WHERE ${CMF.CONTACT_ID} = '${contactId}')
      ORDER BY ${CF.END_DATE} DESC`;

    const records = await this.core.query<any>(query);

    // map data to GetPastCampaignDto array
    return records.map((reg): GetPastCampaignDto => {
      return {
        // fields of CampaignDto
        ...SalesforceMapper.mapBaseCampaign(reg),

        // fields of GetPastCampaignDto
        hasUserParticipated: true,
      };
    });
  }

  /**
   * Register user for a campaign
   * @param dto - type of RegisterForCampaignDto
   * @returns RegisterResponseDto
   */
  async register(dto: RegisterForCampaignDto): Promise<RegisterResponseDto> {
    const contactId = await this.userService.getInternalContactId(
      dto.salesforceUserId,
    );
    const campaignId = await this.getInternalCampaignId(dto.campaignId);

    if (!contactId || !campaignId) {
      throw new Error('User or Campaign not found');
    }

    try {
      await this.core.create('CampaignMember', {
        [CMF.CONTACT_ID]: contactId,
        [CMF.CAMPAIGN_ID]: campaignId,
        [CMF.STATUS]: 'Registered',
      });

      return {
        campaignId: dto.campaignId,
        salesforceUserId: dto.salesforceUserId,
        requestReceivedSuccessfully: true,
      };
    } catch (error) {
      this.logger.error('Registration failed', error);
      return {
        campaignId: dto.campaignId,
        salesforceUserId: dto.salesforceUserId,
        requestReceivedSuccessfully: false,
      };
    }
  }

  /**
   * Unregister user for a campaign
   * @param dto - type of UnregisterFromCampaignDto
   * @returns RegisterResponseDto
   */
  async unregister(
    dto: UnregisterFromCampaignDto,
  ): Promise<RegisterResponseDto> {
    const contactId = await this.userService.getInternalContactId(
      dto.salesforceUserId,
    );
    const campaignId = await this.getInternalCampaignId(dto.campaignId);

    if (!contactId || !campaignId) {
      throw new Error('User or Campaign not found');
    }

    // checks if user registered
    const memberObj = await this.core.sobject('CampaignMember');
    const records = await memberObj
      .find({ [CMF.CONTACT_ID]: contactId, [CMF.CAMPAIGN_ID]: campaignId }, [
        CMF.ID,
      ])
      .limit(1)
      .execute();

    // checks that user registered originally
    if (records.length === 0) {
      throw new Error('User is not registered to the campaign');
    }

    const memberRecordId = records[0].Id;
    if (!memberRecordId) {
      throw new Error('Campaign Member ID is missing in Salesforce');
    }

    try {
      await this.core.destroy('CampaignMember', memberRecordId);

      return {
        campaignId: dto.campaignId,
        salesforceUserId: dto.salesforceUserId,
        requestReceivedSuccessfully: true,
      };
    } catch (error) {
      return {
        campaignId: dto.campaignId,
        salesforceUserId: dto.salesforceUserId,
        requestReceivedSuccessfully: false,
      };
    }
  }

  /**
   * Retrieves the current registration status of a user for a specific campaign
   * @param campaignId - The external ID of the campaign
   * @param salesforceUserId - The external ID of the user
   * @returns A Promise resolving to a GetRegistrationStatusDto with the status details
   */
  async getRegistrationStatus(
    campaignId: number,
    salesforceUserId: number,
  ): Promise<GetRegistrationStatusDto> {
    const contactId =
      await this.userService.getInternalContactId(salesforceUserId);
    const internalCampaignId = await this.getInternalCampaignId(campaignId);

    if (!contactId || !internalCampaignId) {
      throw new Error('User or Campaign not found');
    }

    const memberObj = await this.core.sobject('CampaignMember');
    const records = await memberObj
      .find(
        {
          [CMF.CONTACT_ID]: contactId,
          [CMF.CAMPAIGN_ID]: internalCampaignId,
        },
        [CMF.STATUS], // השדות שאנחנו רוצים לשלוף
      )
      .limit(1)
      .execute();

    const registrationRecord = records[0];

    return {
      campaignId: campaignId,
      salesforceUserId: salesforceUserId,
      registrationStatus: registrationRecord
        ? registrationRecord[CMF.STATUS]
        : 'not_registered', // need to be determined how to get this
      additionalInfo: '', // need to be decided what and if to add
    };
  }

  /**
   * Gets internal campaign ID in salesforce server
   */
  private async getInternalCampaignId(
    externalId: number,
  ): Promise<string | null> {
    const campaignObj = await this.core.sobject('Campaign');
    const res = await campaignObj
      .find({ [CF.EXTERNAL_ID]: externalId }, [CF.ID])
      .limit(1)
      .execute();

    return res[0]?.Id || null;
  }
}
