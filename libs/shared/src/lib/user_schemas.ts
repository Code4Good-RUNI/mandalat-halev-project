/**
 * AUTHENTICATION SCHEMAS
 */

// Request body for the Login endpoint
export interface LoginRequestDto {
    phoneNumber: string;
    idNumber: string; // The Israeli ID number
  }
  
  // Response from the Login endpoint
  export interface LoginResponseDto {
    accessToken: string;
    salesforceUserId: number;
  }
  
  /**
   * USER INFO SCHEMAS
   */
  
  export interface UserProfileDto {
    salesforceUserId: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    idNumber: string; // The Israeli ID number
    address: string;
    city: string;
    birthDate: string; // DD/MM/YYYY
  }

    /**
   * CAMPAIGN SCHEMAS
   */

  export interface CampaignDto {
    id: number;
    name: string;
    description: string;
    imageUrl: string; // URL of the campaign image
    startDate: string; // DD/MM/YYYY
    endDate: string; // DD/MM/YYYY
    durationInHours: number;
    locationAddress: string;
    locationCity: string;
    numOfParticipants: number;
    numOfParticipantsRegistered: number;
    isActive: boolean;
  }

export type approvalStatus = 'pending' | 'approved' | 'rejected';

export interface GetFutureCampaignDto extends CampaignDto {
    isRelevantToUser: boolean;
    isUserRegistered: boolean;
    userApprovalStatus: approvalStatus;
}

export interface GetPastCampaignDto extends CampaignDto {
    hasUserParticipated: boolean;
}

export interface RegisterForCampaignDto {
    campaignId: number;
    salesforceUserId: number;
    numOfParticipantsToRegister: number;
    additionalInfo?: string;
}

export interface UnregisterFromCampaignDto {
    campaignId: number;
    salesforceUserId: number;
    numOfParticipantsToUnregister: number;
    additionalInfo?: string;
}

export interface RegisterResponseDto {
    campaignId: number;
    salesforceUserId: number;
    requestReceivedSuccessfully: boolean;
}

export interface GetRegistrationStatusDto {
    campaignId: number;
    salesforceUserId: number;
    registrationStatus: approvalStatus;
    additionalInfo?: string;
}