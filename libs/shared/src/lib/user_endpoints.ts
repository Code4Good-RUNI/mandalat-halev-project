import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  ContactSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  UserProfileSchema,
  GetFutureCampaignSchema,
  GetPastCampaignSchema,
  RegisterForCampaignSchema,
  UnregisterFromCampaignSchema,
  RegisterResponseSchema,
  GetRegistrationStatusSchema,
  GetUnregisteredCampaignContactsResponseSchema,
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
  RegisterDeviceTokenSchema,
  TestNotificationSchema,
  NotificationSuccessResponseSchema,
  CronRunResponseSchema,
  UnregisterDeviceTokenSchema,
  UpdateNotificationPreferencesSchema,
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
      summary: 'Login to the application(Salesforce validation only)',
    },
    session: {
      method: 'POST',
      path: '/auth/session',
      body: LoginRequestSchema,
      responses: {
        200: LoginResponseSchema,
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Finalize Firebase login and embed custom claims',
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
    contacts: {
      method: 'GET',
      path: '/user/contacts/',
      responses: {
        200: z.array(ContactSchema),
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Get user contacts',
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
      summary:
        'Get all registered contacts for a campaign and their approval status',
    },
    unregisteredContacts: {
      method: 'GET',
      path: '/campaigns/unregistered-contacts',
      query: z.object({
        campaignId: z.coerce.string(),
      }),
      responses: {
        200: GetUnregisteredCampaignContactsResponseSchema,
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Get household contacts not yet registered to a campaign',
    },
  },
  notifications: {
    register: {
      method: 'POST',
      path: '/notifications/register',
      body: RegisterDeviceTokenSchema,
      responses: {
        200: NotificationSuccessResponseSchema,
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema, // Unauthorized (Missing/invalid token)
        500: ErrorResponseSchema,
      },
      summary: 'Register a device push token for the user',
    },
    test: {
      method: 'POST',
      path: '/notifications/test',
      body: TestNotificationSchema,
      responses: {
        200: NotificationSuccessResponseSchema,
        400: ValidationErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Send a test notification to all devices of a user (dev only, no auth)',
    },
    cronRun: {
      method: 'POST',
      path: '/notifications/cron-run',
      body: z.object({}),
      responses: {
        200: CronRunResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Manually trigger the daily notification cron (dev only, no auth)',
    },
    unregister: {
      method: 'POST',
      path: '/notifications/unregister',
      body: UnregisterDeviceTokenSchema,
      responses: {
        200: NotificationSuccessResponseSchema,
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Unregister a device push token (disable notifications)',
    },
    preferences: {
      method: 'PATCH',
      path: '/notifications/preferences',
      body: UpdateNotificationPreferencesSchema,
      responses: {
        200: NotificationSuccessResponseSchema,
        400: ValidationErrorResponseSchema,
        401: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
      summary: 'Update partial notification preferences for a specific device',
    },
  },
});
