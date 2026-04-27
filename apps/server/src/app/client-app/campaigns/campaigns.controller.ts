import { Controller, NotFoundException, ConflictException } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { 
  userContract, 
  GetFutureCampaignDto, 
  GetPastCampaignDto, 
  RegisterResponseDto, 
  GetRegistrationStatusDto 
} from '@mandalat-halev-project/api-interfaces';

@Controller()
export class CampaignsController {
  
  // 1. Active campaigns (GET) 
  @TsRestHandler(userContract.campaigns.active)
  async getActiveCampaigns() { 
    return tsRestHandler(userContract.campaigns.active, async ({ params }) => {
      
      if (params.salesforceUserId === 999) {
        throw new NotFoundException('User not found in Salesforce');
      }

      const responseBody: GetFutureCampaignDto[] = [
        {
          id: 5,
          name: 'Park Restoration',
          description: 'Help us paint benches and plant new flowers at the central park.',
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
          userApprovalStatus: 'pending' 
        }           
      ];

      return {
        status: 200,
        body: responseBody,
      };
    });
  }
  
  // 2. Future campaigns (GET) - Multiple diverse examples
  @TsRestHandler(userContract.campaigns.future)
  async getFutureCampaigns() {
    return tsRestHandler(userContract.campaigns.future, async ({ params }) => {
      
      if (params.salesforceUserId === 999) {
        throw new NotFoundException('User not found in Salesforce');
      }

      const responseBody: GetFutureCampaignDto[] = [
        {
          id: 1,
          name: 'Passover Food Packing',
          description: 'Join us for our main holiday event packing food baskets for families in need.',
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
          userApprovalStatus: 'approved'
        },
        {
          id: 3,
          name: 'Beach Cleanup Morning',
          description: 'Eco-friendly initiative to clean the central coastline. Equipment provided.',
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
          userApprovalStatus: 'approved'
        },
        {
          id: 4,
          name: 'Tech Tutoring for Youth',
          description: 'Teaching basic coding and digital skills to teenagers in community centers.',
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
          userApprovalStatus: 'rejected'
        }
      ];

      return {
        status: 200,
        body: responseBody,
      };
    });
  }

  // 3. Past campaigns (GET) - Historical data
  @TsRestHandler(userContract.campaigns.past)
  async getPastCampaigns() {
    return tsRestHandler(userContract.campaigns.past, async ({ params }) => {

      const responseBody: GetPastCampaignDto[] = [
        {
          id: 101,
          name: 'Winter Blanket Drive',
          description: 'Collecting and distributing warm blankets for the homeless.',
          imageUrl: 'https://example.com/images/blankets.jpg',
          startDate: '2025-12-15',
          endDate: '2025-12-15',
          durationInHours: 5,
          locationAddress: 'Rothschild 1',
          locationCity: 'Tel Aviv',
          numOfParticipants: 40,
          numOfParticipantsRegistered: 40,
          isActive: false,
          hasUserParticipated: true
        },
        {
          id: 102,
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
          hasUserParticipated: false
        }
      ];

      return {
        status: 200,
        body: responseBody,
      };
    });
  }

  // 4. Register for campaign (POST)
  @TsRestHandler(userContract.campaigns.register)
  async registerForCampaign() {
    return tsRestHandler(userContract.campaigns.register, async ({ body }) => {

      if (body.campaignId === 999) {
        throw new ConflictException('This campaign is full or no longer accepting registrations.');
      }

      const responseBody: RegisterResponseDto = {
        campaignId: body.campaignId,
        salesforceUserId: body.salesforceUserId,
        requestReceivedSuccessfully: true
      };

      return {
        status: 200,
        body: responseBody,
      };
    });
  }

  // 5. Unregister from campaign (POST)
  @TsRestHandler(userContract.campaigns.unregister)
  async unregisterFromCampaign() {
    return tsRestHandler(userContract.campaigns.unregister, async ({ body }) => {

      const responseBody: RegisterResponseDto = {
        campaignId: body.campaignId,
        salesforceUserId: body.salesforceUserId,
        requestReceivedSuccessfully: true
      };

      return {
        status: 200,
        body: responseBody,
      };
    });
  }

  // 6. Check registration status (GET)
  @TsRestHandler(userContract.campaigns.registrationStatus)
  async getRegistrationStatus() {
    return tsRestHandler(userContract.campaigns.registrationStatus, async ({ query }) => {

      if (query.campaignId === 999) {
         throw new NotFoundException('Campaign not found');
      }

      const status = query.campaignId === 1 ? 'approved' : 'pending';
      
      const responseBody: GetRegistrationStatusDto = {
        campaignId: query.campaignId,
        salesforceUserId: query.salesforceUserId,
        registrationStatus: status,
        additionalInfo: status === 'approved' ? 'See you there!' : 'Awaiting admin review.'
      };

      return {
        status: 200,
        body: responseBody,
      };
    });
  }
}