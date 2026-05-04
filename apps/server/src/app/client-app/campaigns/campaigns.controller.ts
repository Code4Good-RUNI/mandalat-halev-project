import {
  Controller,
  NotFoundException,
  ConflictException,
  UseGuards,
} from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import {
  ContactDto,
  userContract,
  GetFutureCampaignDto,
  GetPastCampaignDto,
  RegisterResponseDto,
  GetRegistrationStatusDto,
} from '@mandalat-halev-project/api-interfaces';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  // Shared mock host for campaigns
  private mockHost: ContactDto = {
    salesforceUserId: 'sf-host-001',
    firstName: 'Shuki',
    lastName: 'Manager',
    idNumber: '112233445',
    birthDate: '1980-01-01',
  };

  // 1. Active campaigns (GET)
  @TsRestHandler(userContract.campaigns.active)
  async getActiveCampaigns(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.campaigns.active, async () => {
      if (userId === '999') {
        throw new NotFoundException('User not found in Salesforce');
      }

      const responseBody: GetFutureCampaignDto[] = [
        {
          id: '5',
          name: 'Park Restoration',
          description:
            'Help us paint benches and plant new flowers at the central park.',
          imageUrl: 'https://example.com/images/park.jpg',
          startDate: '2026-07-01',
          endDate: '2026-07-01',
          durationInHours: 4,
          locationAddress: 'Hashalom 5',
          locationCity: 'Tel Aviv',
          numOfParticipants: 30,
          numOfParticipantsRegistered: 10,
          isActive: true,
          isRelevantToUser: true,
          isUserRegistered: false,
          userApprovalStatus: 'pending',
          host: this.mockHost,
        },
      ];

      return {
        status: 200,
        body: responseBody,
      };
    });
  }

  // 2. Future campaigns (GET) - Multiple diverse examples
  @TsRestHandler(userContract.campaigns.future)
  async getFutureCampaigns(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.campaigns.future, async () => {
      if (userId === '999') {
        throw new NotFoundException('User not found in Salesforce');
      }

      const responseBody: GetFutureCampaignDto[] = [
        {
          id: '1',
          name: 'Passover Food Packing',
          description:
            'Join us for our main holiday event packing food baskets for families in need.',
          imageUrl: 'https://example.com/images/packing.jpg',
          startDate: '2026-04-10',
          endDate: '2026-04-10',
          durationInHours: 4,
          locationAddress: '1 Hatikva St',
          locationCity: 'Tel Aviv',
          numOfParticipants: 50,
          numOfParticipantsRegistered: 48,
          isActive: true,
          isRelevantToUser: true,
          isUserRegistered: true,
          userApprovalStatus: 'approved',
          host: this.mockHost,        
        },
        {
          id: '3',
          name: 'Beach Cleanup Morning',
          description:
            'Eco-friendly initiative to clean the central coastline. Equipment provided.',
          imageUrl: 'https://example.com/images/beach.jpg',
          startDate: '2026-05-15',
          endDate: '2026-05-15',
          durationInHours: 3,
          locationAddress: 'Herbert Samuel 10',
          locationCity: 'Tel Aviv',
          numOfParticipants: 100,
          numOfParticipantsRegistered: 25,
          isActive: true,
          isRelevantToUser: true,
          isUserRegistered: true,
          userApprovalStatus: 'approved',
          host: this.mockHost,
        },
        {
          id: '4',
          name: 'Tech Tutoring for Youth',
          description:
            'Teaching basic coding and digital skills to teenagers in community centers.',
          imageUrl: 'https://example.com/images/tech.jpg',
          startDate: '2026-06-01',
          endDate: '2026-06-20',
          durationInHours: 2,
          locationAddress: 'Ben Gurion 45',
          locationCity: 'Herzliya',
          numOfParticipants: 10,
          numOfParticipantsRegistered: 2,
          isActive: true,
          isRelevantToUser: true,
          isUserRegistered: true,
          userApprovalStatus: 'rejected',
          host: this.mockHost,
        },
      ];

      return {
        status: 200,
        body: responseBody,
      };
    });
  }

  // 3. Past campaigns (GET) - Historical data
  @TsRestHandler(userContract.campaigns.past)
  async getPastCampaigns(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.campaigns.past, async () => {
      const responseBody: GetPastCampaignDto[] = [
        {
          id: '101',
          name: 'Winter Blanket Drive',
          description:
            'Collecting and distributing warm blankets for the homeless.',
          imageUrl: 'https://example.com/images/blankets.jpg',
          startDate: '2025-12-15',
          endDate: '2025-12-15',
          durationInHours: 5,
          locationAddress: 'Rothschild 1',
          locationCity: 'Tel Aviv',
          numOfParticipants: 40,
          numOfParticipantsRegistered: 40,
          isActive: false,
          hasUserParticipated: true,
          host: this.mockHost,
        },
        {
          id: '102',
          name: 'Community Garden Planting',
          description: 'Establishing a new urban garden in the neighborhood.',
          imageUrl: 'https://example.com/images/garden.jpg',
          startDate: '2026-01-20',
          endDate: '2026-01-20',
          durationInHours: 4,
          locationAddress: 'Weizmann 12',
          locationCity: 'Givatayim',
          numOfParticipants: 20,
          numOfParticipantsRegistered: 20,
          isActive: false,
          hasUserParticipated: false,
          host: this.mockHost,
        },
      ];

      return {
        status: 200,
        body: responseBody,
      };
    });
  }

  // 4. Register for campaign (POST)
  @TsRestHandler(userContract.campaigns.register)
  async registerForCampaign(@CurrentUser('sub') userId: string) {
    return tsRestHandler(userContract.campaigns.register, async ({ body }) => {
      if (body.campaignId === '999') {
        throw new ConflictException(
          'This campaign is full or no longer accepting registrations.',
        );
      }

      // Calculate number of participants based on the new array length
      const numberOfParticipants = body.contactIds.length;
      console.log(`User ${userId} registering ${numberOfParticipants} participants for campaign ${body.campaignId}`);

      const responseBody: RegisterResponseDto = {
        campaignId: body.campaignId,
        requestReceivedSuccessfully: true,
      };

      return {
        status: 200,
        body: responseBody,
      };
    });
  }

  // 5. Unregister from campaign (POST)
  @TsRestHandler(userContract.campaigns.unregister)
  async unregisterFromCampaign(@CurrentUser('sub') userId: string) {
    return tsRestHandler(
      userContract.campaigns.unregister,
      async ({ body }) => {

        // Calculate number of participants to drop based on the new array length
        const numberOfParticipantsToDrop = body.contactIds.length;
        console.log(`User ${userId} unregistering ${numberOfParticipantsToDrop} participants from campaign ${body.campaignId}`);

        const responseBody: RegisterResponseDto = {
          campaignId: body.campaignId,
          requestReceivedSuccessfully: true,
        };

        return {
          status: 200,
          body: responseBody,
        };
      },
    );
  }

  // 6. Check registration status (GET)
  @TsRestHandler(userContract.campaigns.registrationStatus)
  async getRegistrationStatus(@CurrentUser('sub') userId: string) {
    return tsRestHandler(
      userContract.campaigns.registrationStatus,
      async ({ query }) => {
        if (query.campaignId === '999') {
          throw new NotFoundException('Campaign not found');
        }

        const status = query.campaignId === '1' ? 'approved' : 'pending';

        const responseBody: GetRegistrationStatusDto = {
          campaignId: query.campaignId,
          registrationStatus: status,
          additionalInfo:
            status === 'approved' ? 'See you there!' : 'Awaiting admin review.',
        };

        return {
          status: 200,
          body: responseBody,
        };
      },
    );
  }
}
