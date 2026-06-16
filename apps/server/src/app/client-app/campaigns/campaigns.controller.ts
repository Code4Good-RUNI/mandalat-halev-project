import { Controller, NotFoundException, UseGuards, ForbiddenException } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SalesforceCampaignService } from '../../salesforce/campaign/salesforce-campaign.service';
import { SalesforceUserService } from '../../salesforce/user/salesforce-user.service';

@Controller()
@UseGuards(FirebaseAuthGuard)
export class CampaignsController {
  constructor(
    private readonly campaignService: SalesforceCampaignService,
    private readonly userService: SalesforceUserService,
  ) {}

  // Validates Family members
  private async validateFamilyMembers(
    userId: string,
    requestedContactIds: string[],
  ) {
    const family = await this.userService.getFamilyMembers(userId);
    const familyIds = new Set(family.map((f) => f.salesforceUserId));

    for (const id of requestedContactIds) {
      if (!familyIds.has(id)) {
        throw new ForbiddenException(
          `Security Error: Contact ${id} is not part of your household.`,
        );
      }
    }
  }

  // 1. Active campaigns (GET)
  @TsRestHandler(userContract.campaigns.active)
  async getActiveCampaigns(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.campaigns.active, async () => {
      const campaigns = await this.campaignService.getActiveCampaigns(userId);
      return { status: 200, body: campaigns };
    });
  }

  // 2. Future campaigns (GET) - Multiple diverse examples
  @TsRestHandler(userContract.campaigns.future)
  async getFutureCampaigns(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.campaigns.future, async () => {
      const campaigns = await this.campaignService.getFutureCampaigns(userId);
      return { status: 200, body: campaigns };
    });
  }

  // 3. Past campaigns (GET) - Historical data
  @TsRestHandler(userContract.campaigns.past)
  async getPastCampaigns(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.campaigns.past, async () => {
      const campaigns = await this.campaignService.getPastCampaigns(userId);
      return { status: 200, body: campaigns };
    });
  }

  // 4. Register for campaign (POST)
  @TsRestHandler(userContract.campaigns.register)
  async registerForCampaign(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.campaigns.register, async ({ body }) => {
      await this.validateFamilyMembers(userId, body.contactIds);
      const exists = await this.campaignService.campaignExists(body.campaignId);
      if (!exists) {
        throw new NotFoundException('Campaign not found');
      }

      const result = await this.campaignService.register(body);

      return { status: 200, body: result };
    });
  }

  // 5. Unregister from campaign (POST)
  @TsRestHandler(userContract.campaigns.unregister)
  async unregisterFromCampaign(@CurrentUser('sub') userId: string) {
    return tsRestHandler(
      userContract.campaigns.unregister,
      async ({ body }) => {
        await this.validateFamilyMembers(userId, body.contactIds);
        const result = await this.campaignService.unregister(body);

        return { status: 200, body: result };
      },
    );
  }

  // 6. Check registration status (GET)
  @TsRestHandler(userContract.campaigns.registrationStatus)
  async getRegistrationStatus(@CurrentUser('sub') userId: string) {
    return tsRestHandler(
      userContract.campaigns.registrationStatus,
      async ({ query }) => {
        const exists = await this.campaignService.campaignExists(
          query.campaignId,
        );
        if (!exists) {
          throw new NotFoundException('Campaign not found');
        }

        const status = await this.campaignService.getRegistrationStatus(
          userId,
          query.campaignId,
        );
        return { status: 200, body: status };
      },
    );
  }

  // 7. Get household contacts not yet registered (GET)
  @TsRestHandler(userContract.campaigns.unregisteredContacts)
  async getUnregisteredContacts(@CurrentUser('sub') userId: string) {
    return tsRestHandler(
      userContract.campaigns.unregisteredContacts,
      async ({ query }) => {
        const exists = await this.campaignService.campaignExists(
          query.campaignId,
        );
        if (!exists) {
          throw new NotFoundException('Campaign not found');
        }

        const result =
          await this.campaignService.getUnregisteredContactsForCampaign(
            userId,
            query.campaignId,
          );
        return { status: 200, body: result };
      },
    );
  }
}