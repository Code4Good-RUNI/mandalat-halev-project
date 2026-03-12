import { initContract } from '@ts-rest/core';

const c = initContract();

/**
 * AUTHENTICATION SCHEMAS
 */

// Request body for the Login endpoint
export interface LoginRequestDto {
    phoneNumber: string;
    idNumber: string; // The Israeli ID number
  }
  
  // Response from the Login endpoint
  export interface AuthResponseDto {
    accessToken: string;
    userId: number;
  }
  
  /**
   * USER SCHEMAS
   */
  
  export interface UserProfileDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
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