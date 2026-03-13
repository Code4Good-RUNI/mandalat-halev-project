import { initContract } from '@ts-rest/core';
import {
  LoginRequestDto,
  LoginResponseDto,
  UserProfileDto,
  GetFutureCampaignDto,
  GetPastCampaignDto,
  RegisterForCampaignDto,
  UnregisterFromCampaignDto,
  RegisterResponseDto,
  GetRegistrationStatusDto,
} from './user_schemas.js';

const c = initContract();

export const userContract = c.router({
  auth: {
    login: {
      method: 'POST',
      path: '/auth/login',
      body: c.type<LoginRequestDto>(),
      responses: {
        200: c.type<LoginResponseDto>(),
      },
    },
  },
  user: {
    profile: {
      method: 'GET',
      path: '/user/profile/:salesforceUserId',
      pathParams: c.type<{ salesforceUserId: number }>(),
      responses: {
        200: c.type<UserProfileDto>(),
      },
    },
  },
  campaigns: {
    future: {
      method: 'GET',
      path: '/campaigns/future/:salesforceUserId',
      pathParams: c.type<{ salesforceUserId: number }>(),
      responses: {
        200: c.type<GetFutureCampaignDto[]>(),
      },
    },
    past: {
      method: 'GET',
      path: '/campaigns/past/:salesforceUserId',
      pathParams: c.type<{ salesforceUserId: number }>(),
      responses: {
        200: c.type<GetPastCampaignDto[]>(),
      },
    },
    register: {
      method: 'POST',
      path: '/campaigns/register',
      body: c.type<RegisterForCampaignDto>(),
      responses: {
        200: c.type<RegisterResponseDto>(),
      },
    },
    unregister: {
      method: 'POST',
      path: '/campaigns/unregister',
      body: c.type<UnregisterFromCampaignDto>(),
      responses: {
        200: c.type<RegisterResponseDto>(),
      },
    },
    registrationStatus: {
      method: 'GET',
      path: '/campaigns/registration-status',
      query: c.type<{ campaignId: number; salesforceUserId: number }>(),
      responses: {
        200: c.type<GetRegistrationStatusDto>(),
      },
    },
  },
} as const);

