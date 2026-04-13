import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from './client';
import React from 'react';
import {
  useLogin,
  useUserProfile,
  useFutureCampaigns,
  useActiveCampaigns,
  usePastCampaigns,
  useRegisterForCampaign,
  useUnregisterFromCampaign,
  useRegistrationStatus,
} from './hooks';

// Mock the api client
jest.mock('./client', () => ({
  api: {
    auth: {
      login: jest.fn(),
    },
    user: {
      profile: jest.fn(),
    },
    campaigns: {
      future: jest.fn(),
      active: jest.fn(),
      past: jest.fn(),
      register: jest.fn(),
      unregister: jest.fn(),
      registrationStatus: jest.fn(),
    },
  },
}));

const mockedApi = api as jest.MockedObject<typeof api>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

// ---------------------------------------------------------------------------
// Auth hooks
// ---------------------------------------------------------------------------

describe('useLogin', () => {
  it('should call api.auth.login with the provided body', async () => {
    const mockResponse = {
      status: 200,
      body: { accessToken: 'token-123', salesforceUserId: 42 },
    };
    (mockedApi.auth.login as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      phoneNumber: '0501234567',
      idNumber: '123456789',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.auth.login).toHaveBeenCalledWith({
      body: { phoneNumber: '0501234567', idNumber: '123456789' },
    });
    expect(result.current.data).toEqual(mockResponse);
  });
});

// ---------------------------------------------------------------------------
// User hooks
// ---------------------------------------------------------------------------

describe('useUserProfile', () => {
  it('should call api.user.profile with the salesforceUserId', async () => {
    const mockProfile = {
      status: 200,
      body: {
        salesforceUserId: 42,
        firstName: 'Tal',
        lastName: 'Levi',
        email: 'tal@example.com',
        phoneNumber: '0501234567',
        idNumber: '123456789',
        address: '123 Main St',
        city: 'Tel Aviv',
        birthDate: '01/01/1990',
      },
    };
    (mockedApi.user.profile as jest.Mock).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useUserProfile(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.user.profile).toHaveBeenCalledWith({
      params: { salesforceUserId: 42 },
    });
    expect(result.current.data).toEqual(mockProfile);
  });
});

// ---------------------------------------------------------------------------
// Campaign hooks
// ---------------------------------------------------------------------------

describe('useFutureCampaigns', () => {
  it('should call api.campaigns.future with the salesforceUserId', async () => {
    const mockCampaigns = {
      status: 200,
      body: [
        {
          id: 1,
          name: 'Beach Cleanup',
          description: 'Clean the beach',
          imageUrl: 'https://example.com/image.jpg',
          startDate: '01/07/2026',
          endDate: '01/07/2026',
          durationInHours: 3,
          locationAddress: 'Beach Rd',
          locationCity: 'Tel Aviv',
          numOfParticipants: 50,
          numOfParticipantsRegistered: 10,
          isActive: true,
          isRelevantToUser: true,
          isUserRegistered: false,
          userApprovalStatus: 'pending' as const,
        },
      ],
    };
    (mockedApi.campaigns.future as jest.Mock).mockResolvedValue(mockCampaigns);

    const { result } = renderHook(() => useFutureCampaigns(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.campaigns.future).toHaveBeenCalledWith({
      params: { salesforceUserId: 42 },
    });
    expect(result.current.data).toEqual(mockCampaigns);
  });
});

describe('useActiveCampaigns', () => {
  it('should call api.campaigns.active with the salesforceUserId', async () => {
    const mockCampaigns = {
      status: 200,
      body: [
        {
          id: 3,
          name: 'Food Drive',
          description: 'Collect food donations',
          imageUrl: 'https://example.com/food.jpg',
          startDate: '01/04/2026',
          endDate: '30/04/2026',
          durationInHours: 4,
          locationAddress: 'Community Center',
          locationCity: 'Jerusalem',
          numOfParticipants: 20,
          numOfParticipantsRegistered: 15,
          isActive: true,
          isRelevantToUser: true,
          isUserRegistered: true,
          userApprovalStatus: 'approved' as const,
        },
      ],
    };
    (mockedApi.campaigns.active as jest.Mock).mockResolvedValue(mockCampaigns);

    const { result } = renderHook(() => useActiveCampaigns(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.campaigns.active).toHaveBeenCalledWith({
      params: { salesforceUserId: 42 },
    });
    expect(result.current.data).toEqual(mockCampaigns);
  });
});

describe('usePastCampaigns', () => {
  it('should call api.campaigns.past with the salesforceUserId', async () => {
    const mockCampaigns = {
      status: 200,
      body: [
        {
          id: 2,
          name: 'Park Cleanup',
          description: 'Clean the park',
          imageUrl: 'https://example.com/park.jpg',
          startDate: '01/01/2026',
          endDate: '01/01/2026',
          durationInHours: 2,
          locationAddress: 'Park Ave',
          locationCity: 'Haifa',
          numOfParticipants: 30,
          numOfParticipantsRegistered: 25,
          isActive: false,
          hasUserParticipated: true,
        },
      ],
    };
    (mockedApi.campaigns.past as jest.Mock).mockResolvedValue(mockCampaigns);

    const { result } = renderHook(() => usePastCampaigns(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.campaigns.past).toHaveBeenCalledWith({
      params: { salesforceUserId: 42 },
    });
    expect(result.current.data).toEqual(mockCampaigns);
  });
});

describe('useRegisterForCampaign', () => {
  it('should call api.campaigns.register with the provided body', async () => {
    const mockResponse = {
      status: 200,
      body: {
        campaignId: 1,
        salesforceUserId: 42,
        requestReceivedSuccessfully: true,
      },
    };
    (mockedApi.campaigns.register as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useRegisterForCampaign(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      campaignId: 1,
      salesforceUserId: 42,
      numOfParticipantsToRegister: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.campaigns.register).toHaveBeenCalledWith({
      body: {
        campaignId: 1,
        salesforceUserId: 42,
        numOfParticipantsToRegister: 1,
      },
    });
    expect(result.current.data).toEqual(mockResponse);
  });
});

describe('useUnregisterFromCampaign', () => {
  it('should call api.campaigns.unregister with the provided body', async () => {
    const mockResponse = {
      status: 200,
      body: {
        campaignId: 1,
        salesforceUserId: 42,
        requestReceivedSuccessfully: true,
      },
    };
    (mockedApi.campaigns.unregister as jest.Mock).mockResolvedValue(
      mockResponse,
    );

    const { result } = renderHook(() => useUnregisterFromCampaign(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      campaignId: 1,
      salesforceUserId: 42,
      numOfParticipantsToUnregister: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.campaigns.unregister).toHaveBeenCalledWith({
      body: {
        campaignId: 1,
        salesforceUserId: 42,
        numOfParticipantsToUnregister: 1,
      },
    });
    expect(result.current.data).toEqual(mockResponse);
  });
});

describe('useRegistrationStatus', () => {
  it('should call api.campaigns.registrationStatus with campaignId and salesforceUserId', async () => {
    const mockResponse = {
      status: 200,
      body: {
        campaignId: 1,
        salesforceUserId: 42,
        registrationStatus: 'approved' as const,
        additionalInfo: 'Welcome!',
      },
    };
    (mockedApi.campaigns.registrationStatus as jest.Mock).mockResolvedValue(
      mockResponse,
    );

    const { result } = renderHook(() => useRegistrationStatus(1, 42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.campaigns.registrationStatus).toHaveBeenCalledWith({
      query: { campaignId: 1, salesforceUserId: 42 },
    });
    expect(result.current.data).toEqual(mockResponse);
  });
});
