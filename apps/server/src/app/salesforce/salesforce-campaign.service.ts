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
  GetRegistrationStatusDto, approvalStatus,
} from '@mandalat-halev-project/api-interfaces';

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
    const soql = `SELECT
        External_ID__c, Name, Description, StartDate, EndDate, IsActive,
        ActivityLocation__c, Max_Participants__c, Image_URL__c,
        (SELECT Status FROM CampaignMembers WHERE ContactId = '${contactId}' LIMIT 1)
        FROM Campaign
        WHERE EndDate >= TODAY
          AND IsActive = true
          AND Id IN (SELECT CampaignId FROM CampaignMember WHERE ContactId = '${contactId}')
        ORDER BY StartDate ASC`;

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
    const soql = `
      SELECT
        External_ID__c, Name, Description, StartDate, EndDate, IsActive,
        ActivityLocation__c, Max_Participants__c, Image_URL__c,
        (SELECT Status FROM CampaignMembers WHERE ContactId = '${contactId}' LIMIT 1)
      FROM Campaign
      WHERE EndDate < TODAY
      AND Id IN (SELECT CampaignId FROM CampaignMember WHERE ContactId = '${contactId}')
      ORDER BY EndDate DESC`;

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
      ContactId: contactId,
      CampaignId: campaignId,
      Status: 'Registered',
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
    const soql = `SELECT Id FROM CampaignMember 
                  WHERE ContactId = '${contactId}' AND CampaignId = '${campaignId}' LIMIT 1`;
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

    const soql = `
      SELECT Status FROM CampaignMember 
      WHERE ContactId = '${contactId}' 
      AND Campaign.External_ID__c = '${internalCampaignId}' 
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
      `SELECT Id FROM Campaign WHERE External_ID__c = '${externalId}' LIMIT 1`,
    );
    return res[0]?.Id || null;
  }
}
