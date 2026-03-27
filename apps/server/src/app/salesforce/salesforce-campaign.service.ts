import { Injectable } from '@nestjs/common';
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
  approvalStatus,
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


@Injectable()
export class SalesforceCampaignService {
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
    const contactId =
      await this.userService.getInternalContactId(salesforceUserId);
    if (!contactId) return [];

    // SOQL query for relative date
    const soql = `SELECT ${CAMPAIGN_QUERY_FIELDS},
        (SELECT ${CMF.STATUS} FROM CampaignMembers WHERE ${CMF.CONTACT_ID} = '${contactId}' LIMIT 1)
        FROM Campaign
        WHERE ${CF.END_DATE} >= TODAY
          AND ${CF.IS_ACTIVE} = true
          AND ${CF.ID} IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember WHERE ${CMF.CONTACT_ID} = '${contactId}')
        ORDER BY ${CF.START_DATE} ASC`;

    const records = await this.core.query<any>(soql);

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
    const contactId =
      await this.userService.getInternalContactId(salesforceUserId);
    if (!contactId) return [];

    // SOQL query for relative date
    const soql = `SELECT ${CAMPAIGN_QUERY_FIELDS}
      FROM Campaign
      WHERE ${CF.END_DATE} < TODAY
        AND ${CF.ID} IN (SELECT ${CMF.CAMPAIGN_ID} FROM CampaignMember WHERE ${CMF.CONTACT_ID} = '${contactId}')
      ORDER BY ${CF.END_DATE} DESC`;

    const records = await this.core.query<any>(soql);

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

    // body of post API to server
    const body = {
      [CMF.CONTACT_ID]: contactId,
      [CMF.CAMPAIGN_ID]: campaignId,
      [CMF.STATUS]: 'Registered',
    };

    const response = {
      campaignId: dto.campaignId,
      salesforceUserId: dto.salesforceUserId,
    };

    try {
      // post to server
      await this.core.post('sobjects/CampaignMember', body);
      // // registration succeed
      return {
        ...response,
        requestReceivedSuccessfully: true,
      };
    } catch (error) {
      // registration failed
      return {
        ...response,
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

    const response = {
      campaignId: dto.campaignId,
      salesforceUserId: dto.salesforceUserId,
    };

    // gets user's CampaignMember ID to delete him
    const soql = `SELECT ${CMF.ID} FROM CampaignMember
                  WHERE ${CMF.CONTACT_ID} = '${contactId}' AND ${CMF.CAMPAIGN_ID} = '${campaignId}' LIMIT 1`;
    const records = await this.core.query<any>(soql);

    if (records.length === 0) {
      throw new Error('User is not registered to the campaign');
    }

    try {
      // needed to be rewritten according to salesforce's API
      await this.core.delete(`sobjects/CampaignMember/${records[0].Id}`);
      // unregister succeed
      return {
        ...response,
        requestReceivedSuccessfully: true,
      };
    } catch (error) {
      // failed to unregister
      return {
        ...response,
        requestReceivedSuccessfully: false,
      };
    }
  }

  /**
   * Unregister user for a campaign
   * @param campaignId - typ
   * @param salesforceUserId
   * @returns RegisterResponseDto
   */
  async getRegistrationStatus(
    campaignId: number, salesforceUserId: number,): Promise<GetRegistrationStatusDto> {

    const contactId =
      await this.userService.getInternalContactId(salesforceUserId);

    const internalCampaignId = await this.getInternalCampaignId(campaignId);

    if (!contactId || !internalCampaignId) {
      throw new Error('User or Campaign not found');
    }

    const soql = `SELECT ${CMF.STATUS} FROM CampaignMember
      WHERE ${CMF.CONTACT_ID} = '${contactId}'
        AND ${CMF.CAMPAIGN_ID} = '${internalCampaignId}'
        LIMIT 1`;

    const records = await this.core.query<any>(soql);

    return {
      campaignId: campaignId,
      salesforceUserId: salesforceUserId,
      registrationStatus: "approved", // need to be determined how to get this
      additionalInfo: '', // need to be decided what and if to add
    };
  }

  /**
   * Gets internal campaign ID in salesforce server
   */
  private async getInternalCampaignId(
    externalId: number,
  ): Promise<string | null> {
    const res = await this.core.query<any>(
      `SELECT ${CF.ID} FROM Campaign WHERE ${CF.EXTERNAL_ID} = '${externalId}' LIMIT 1`,
    );
    return res[0]?.Id || null;
  }
}
