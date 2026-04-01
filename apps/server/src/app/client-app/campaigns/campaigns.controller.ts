import { Controller } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';

@Controller()
export class CampaignsController {
  
  // 1. Future campaigns (GET) - Multiple diverse examples
  @TsRestHandler(userContract.campaigns.future)
  async getFutureCampaigns() {
    return tsRestHandler(userContract.campaigns.future, async ({ params }) => {

      // 404 Error: Simulate user not found in DB
      if (params.salesforceUserId === 999) {
        return {
          status: 404,
          body: {
            status_code: 'NOT_FOUND',
            message: 'User not found in Salesforce',
          },
        };
      }

      return {
        status: 200,
        body: [
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
            isUserRegistered: false,
            userApprovalStatus: 'pending'
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
            isUserRegistered: true, // User already joined
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
            isUserRegistered: false,
            userApprovalStatus: 'rejected' // User was rejected previously
          }
        ]
      };
    });
  }

  // 2. Past campaigns (GET) - Historical data
  @TsRestHandler(userContract.campaigns.past)
  async getPastCampaigns() {
    return tsRestHandler(userContract.campaigns.past, async ({ params }) => {

      // 404 Error: Simulate user not found in DB
      if (params.salesforceUserId === 999) {
        return {
          status: 404,
          body: {
            status_code: 'NOT_FOUND',
            message: 'User not found in Salesforce',
          },
        };
      }

      return {
        status: 200,
        body: [
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
            hasUserParticipated: true // User took part in this
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
        ]
      };
    });
  }

  // 3. Register for campaign (POST)
  @TsRestHandler(userContract.campaigns.register)
  async registerForCampaign() {
    return tsRestHandler(userContract.campaigns.register, async ({ body }) => {

      // 400 Error: Simulating a logic error
      if (body.campaignId === 999) {
        return {
          status: 400, // Returning a logic-based Bad Request, distinct from Zod's validation
          body: {
            status_code: 'REGISTRATION_FAILED',
            message: 'This campaign is full or no longer accepting registrations.',
          },
        };
      }

      return {
        status: 200,
        body: {
          campaignId: body.campaignId,
          salesforceUserId: body.salesforceUserId,
          requestReceivedSuccessfully: true
        }
      };
    });
  }

  // 4. Unregister from campaign (POST)
  @TsRestHandler(userContract.campaigns.unregister)
  async unregisterFromCampaign() {
    return tsRestHandler(userContract.campaigns.unregister, async ({ body }) => {
      return {
        status: 200,
        body: {
          campaignId: body.campaignId,
          salesforceUserId: body.salesforceUserId,
          requestReceivedSuccessfully: true
        }
      };
    });
  }

  // 5. Check registration status (GET)
  @TsRestHandler(userContract.campaigns.registrationStatus)
  async getRegistrationStatus() {
    return tsRestHandler(userContract.campaigns.registrationStatus, async ({ query }) => {

      // 404 Error
      if (query.campaignId === 999) {
         return {
            status: 404,
            body: {
               status_code: 'NOT_FOUND',
               message: 'Campaign not found'
            }
         }
      }

      // Logic simulation: If campaignId is 1, return approved, otherwise pending
      const status = query.campaignId === 1 ? 'approved' : 'pending';
      return {
        status: 200,
        body: {
          campaignId: query.campaignId,
          salesforceUserId: query.salesforceUserId,
          registrationStatus: status,
          additionalInfo: status === 'approved' ? 'See you there!' : 'Awaiting admin review.'
        }
      };
    });
  }

// 6. Active campaigns (GET) 
  @TsRestHandler(userContract.campaigns.active)
  async getActiveCampaigns() { 
    return tsRestHandler(userContract.campaigns.active, async ({ params }) => {
      
      // 404 Error: Simulate user not found in DB
      if (params.salesforceUserId === 999) {
        return {
          status: 404,
          body: {
            status_code: 'NOT_FOUND',
            message: 'User not found in Salesforce',
          },
        };
      }

      return {
        status: 200,
        body: [
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
        ]
      };
    });
  }
}