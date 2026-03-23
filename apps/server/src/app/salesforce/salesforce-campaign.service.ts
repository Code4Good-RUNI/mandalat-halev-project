import { Injectable } from '@nestjs/common';
import { SalesforceCoreService } from './salesforce-core.service';
import { SalesforceUserService } from './salesforce-user.service';
import { SalesforceMapper } from './salesforce.mapper';
import {
  GetFutureCampaignDto,
  GetPastCampaignDto,
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
}
