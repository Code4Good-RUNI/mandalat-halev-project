import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  UserProfileSchema,
  GetFutureCampaignSchema,
  GetPastCampaignSchema,
  RegisterForCampaignSchema,
  UnregisterFromCampaignSchema,
  RegisterResponseSchema,
  GetRegistrationStatusSchema,
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from './user_schemas.js';

const c = initContract();

export const userContract = c.router({
  auth: {
    login: {
      method: 'POST',
      path: '/auth/login',
      body: LoginRequestSchema,
      responses: {
        200: LoginResponseSchema,
        400: ValidationErrorResponseSchema, // Zod request validation failed
        401: ErrorResponseSchema, // Invalid credentials
        500: ErrorResponseSchema, // Internal server error
      },
      summary: 'Login to the application',
    },
  },
  user: {
    profile: {
      method: 'GET',
      path: '/user/profile/',
      responses: {
        200: UserProfileSchema,
        400: ValidationErrorResponseSchema, // Zod request validation failed
        401: ErrorResponseSchema, // Unauthorized (Missing/invalid token)
        403: ErrorResponseSchema, // Forbidden (No permission)
        404: ErrorResponseSchema, // User not found in Salesforce
        500: ErrorResponseSchema, // Internal server error
      },
      summary: 'Get user profile details',
    },
  },
  campaigns: {
    future: {
      method: 'GET',
      path: '/campaigns/future',
      responses: {
        200: z.array(GetFutureCampaignSchema),
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Get future campaigns for a user',
    },
    past: {
      method: 'GET',
      path: '/campaigns/past',
      responses: {
        200: z.array(GetPastCampaignSchema),
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Get past campaigns for a user',
    },
    active: {
      method: 'GET',
      path: '/campaigns/active',
      responses: {
        200: z.array(GetFutureCampaignSchema),
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Get active campaigns available for registration',
    },
    register: {
      method: 'POST',
      path: '/campaigns/register',
      body: RegisterForCampaignSchema,
      responses: {
        200: RegisterResponseSchema,
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        409: ErrorResponseSchema, // Business conflict (e.g. campaign full)
        500: ErrorResponseSchema,
      },
      summary: 'Register a user to a campaign',
    },
    unregister: {
      method: 'POST',
      path: '/campaigns/unregister',
      body: UnregisterFromCampaignSchema,
      responses: {
        200: RegisterResponseSchema,
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Unregister a user from a campaign',
    },
    registrationStatus: {
      method: 'GET',
      path: '/campaigns/registration-status',
      query: z.object({
        campaignId: z.coerce.string(),
      }),
      responses: {
        200: GetRegistrationStatusSchema,
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Get registration status for a specific user and campaign',
    },
  },
});
