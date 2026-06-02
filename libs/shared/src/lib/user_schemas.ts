import { z } from 'zod';

/**
 * GLOBAL ERROR SCHEMAS
 */
// Generic error response shape used by NestJS exceptions (401, 403, 404, 409, 500).
export const ErrorResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
});

export type ErrorResponseDto = z.infer<typeof ErrorResponseSchema>;

// Extra fields on a Zod issue (minimum, maximum, expected, received, type, ...)
// vary per issue code, so we accept them as unknown rather than enumerating every variant.
export const ZodIssueSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    path: z.array(z.union([z.string(), z.number()])),
  })
  .catchall(z.unknown());

export const ZodValidationResultSchema = z.object({
  issues: z.array(ZodIssueSchema),
  name: z.literal('ZodError'),
});

// Mirrors the body ts-rest returns for a RequestValidationError. Exactly one
// of the four result fields is non-null per response (whichever location failed).
export const ValidationErrorResponseSchema = z.object({
  paramsResult: ZodValidationResultSchema.nullable(),
  headersResult: ZodValidationResultSchema.nullable(),
  queryResult: ZodValidationResultSchema.nullable(),
  bodyResult: ZodValidationResultSchema.nullable(),
});

export type ZodIssueDto = z.infer<typeof ZodIssueSchema>;
export type ValidationErrorResponseDto = z.infer<
  typeof ValidationErrorResponseSchema
>;

/**
 * AUTHENTICATION SCHEMAS
 */

// Request body for the Login & Session endpoints
export const LoginRequestSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\d+$/, { message: 'Phone number must contain digits only' })
    .length(10, { message: 'Phone number must be 10 digits long' }),
  idNumber: z
    .string()
    .regex(/^\d+$/, { message: 'ID number must contain digits only' })
    .length(9, { message: 'ID number must be 9 digits long' }),
});

// Response from the Login and Session endpoints is now minimal
export const LoginResponseSchema = z.object({
  ok: z.literal(true),
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;
export type LoginResponseDto = z.infer<typeof LoginResponseSchema>;

// Input for the create-session hook: the /auth/session request body
// (LoginRequestSchema) plus the Firebase ID token, which is sent as a Bearer
// header rather than in the body.
export type CreateSessionDto = {
  body: LoginRequestDto;
  idToken: string;
};

/**
 * USER INFO SCHEMAS
 */

// Schema for User Profile details
export const UserProfileSchema = z.object({
  salesforceUserId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(), // Built-in email validation
  phoneNumber: z.string(),
  idNumber: z.string(), // The Israeli ID number
  address: z.string(),
  city: z.string(),
  birthDate: z.string(), // DD/MM/YYYY
});

export type UserProfileDto = z.infer<typeof UserProfileSchema>;

export const ContactSchema = z.object({
  salesforceUserId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  idNumber: z.string(),
  birthDate: z.string(),
});
export type ContactDto = z.infer<typeof ContactSchema>;

/**
 * CAMPAIGN SCHEMAS
 */

// Define allowed status values using Zod Enum
export const ApprovalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'waiting_list',
]);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

// Base schema for a Campaign
export const CampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string().url(), // Built-in URL validation
  startDate: z.string(), // DD/MM/YYYY
  endDate: z.string(), // DD/MM/YYYY
  durationInHours: z.number(),
  locationAddress: z.string(),
  locationCity: z.string(),
  numOfParticipants: z.number(),
  numOfParticipantsRegistered: z.number(),
  isActive: z.boolean(),
  host: ContactSchema,
});

export type CampaignDto = z.infer<typeof CampaignSchema>;

export const GetFutureCampaignSchema = CampaignSchema.extend({
  isRelevantToUser: z.boolean(),
  isUserRegistered: z.boolean(),
  userApprovalStatus: ApprovalStatusSchema,
});

export type GetFutureCampaignDto = z.infer<typeof GetFutureCampaignSchema>;

export const GetPastCampaignSchema = CampaignSchema.extend({
  hasUserParticipated: z.boolean(),
});

export type GetPastCampaignDto = z.infer<typeof GetPastCampaignSchema>;

export const RegisterForCampaignSchema = z.object({
  campaignId: z.string(),
  contactIds: z.array(z.string()),
  additionalInfo: z.string().optional(),
});

export type RegisterForCampaignDto = z.infer<typeof RegisterForCampaignSchema>;

export const UnregisterFromCampaignSchema = z.object({
  campaignId: z.string(),
  contactIds: z.array(z.string()),
  additionalInfo: z.string().optional(),
});

export type UnregisterFromCampaignDto = z.infer<
  typeof UnregisterFromCampaignSchema
>;

export const RegisterResponseSchema = z.object({
  campaignId: z.string(),
  requestReceivedSuccessfully: z.boolean(),
});

export type RegisterResponseDto = z.infer<typeof RegisterResponseSchema>;

export const CampaignMemberRegistrationSchema = ContactSchema.extend({
  registrationStatus: ApprovalStatusSchema,
  additionalInfo: z.string().optional(),
});

export type CampaignMemberRegistrationDto = z.infer<
  typeof CampaignMemberRegistrationSchema
>;

export const GetRegistrationStatusSchema = z.object({
  campaignId: z.string(),
  registeredMembers: z.array(CampaignMemberRegistrationSchema),
});

export type GetRegistrationStatusDto = z.infer<
  typeof GetRegistrationStatusSchema
>;

export const GetUnregisteredCampaignContactsResponseSchema = z.object({
  campaignId: z.string(),
  contacts: z.array(ContactSchema),
});

export type GetUnregisteredCampaignContactsResponseDto = z.infer<
  typeof GetUnregisteredCampaignContactsResponseSchema
>;

/**
 * NOTIFICATIONS SCHEMAS
 */

// Os type enum
export const DeviceOsSchema = z.enum(['ios', 'android']);
export type DeviceOs = z.infer<typeof DeviceOsSchema>;

// Request body for registering a token
export const RegisterDeviceTokenSchema = z.object({
  deviceOs: DeviceOsSchema,
  nativeToken: z.string(),
  expoToken: z.string().nullable().optional(),
});
export type RegisterDeviceTokenDto = z.infer<typeof RegisterDeviceTokenSchema>;

// Request body for sending a test notification (dev only)
export const TestNotificationSchema = z.object({
  title: z.string(),
  body: z.string(),
  data: z.record(z.string()).optional(), // payload values must be strings per FCM requirements
});
export type TestNotificationDto = z.infer<typeof TestNotificationSchema>;

// Generic success response for notifications
export const NotificationSuccessResponseSchema = z.object({
  ok: z.literal(true),
});
export type NotificationSuccessResponseDto = z.infer<typeof NotificationSuccessResponseSchema>;
