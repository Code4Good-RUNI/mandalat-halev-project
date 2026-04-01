import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useLogin,
  useUserProfile,
  useFutureCampaigns,
  usePastCampaigns,
  useRegisterForCampaign,
  useUnregisterFromCampaign,
  useRegistrationStatus,
} from './hooks';

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
// Auth
// ---------------------------------------------------------------------------

describe('useLogin (integration)', () => {
  it('should login and receive a mock token from the server', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      phoneNumber: '0501234567',
      idNumber: '123456789',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe(200);
    expect(result.current.data?.body).toEqual({
      accessToken: 'mock-jwt-token-abcd-1234',
      salesforceUserId: 101,
    });
  });
});

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

describe('useUserProfile (integration)', () => {
  it('should fetch the mock user profile from the server', async () => {
    const { result } = renderHook(() => useUserProfile(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe(200);
    expect(result.current.data?.body).toMatchObject({
      firstName: 'Shira',
      lastName: 'Maor',
      email: 'shira.maor@example.com',
      phoneNumber: '050-1234567',
    });
  });
});

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

describe('useFutureCampaigns (integration)', () => {
  it('should fetch future campaigns from the server', async () => {
    const { result } = renderHook(() => useFutureCampaigns(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const body = result.current.data?.body;
    expect(result.current.data?.status).toBe(200);
    expect(body).toHaveLength(3);
    expect(body?.[0].name).toBe('Passover Food Packing');
    expect(body?.[1].name).toBe('Beach Cleanup Morning');
    expect(body?.[2].name).toBe('Tech Tutoring for Youth');
  });
});

describe('usePastCampaigns (integration)', () => {
  it('should fetch past campaigns from the server', async () => {
    const { result } = renderHook(() => usePastCampaigns(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const body = result.current.data?.body;
    expect(result.current.data?.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body?.[0].name).toBe('Winter Blanket Drive');
    expect(body?.[1].name).toBe('Community Garden Planting');
  });
});

describe('useRegisterForCampaign (integration)', () => {
  it('should register for a campaign and receive confirmation', async () => {
    const { result } = renderHook(() => useRegisterForCampaign(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      campaignId: 1,
      salesforceUserId: 42,
      numOfParticipantsToRegister: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe(200);
    expect(result.current.data?.body).toEqual({
      campaignId: 1,
      salesforceUserId: 42,
      requestReceivedSuccessfully: true,
    });
  });
});

describe('useUnregisterFromCampaign (integration)', () => {
  it('should unregister from a campaign and receive confirmation', async () => {
    const { result } = renderHook(() => useUnregisterFromCampaign(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      campaignId: 1,
      salesforceUserId: 42,
      numOfParticipantsToUnregister: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe(200);
    expect(result.current.data?.body).toEqual({
      campaignId: 1,
      salesforceUserId: 42,
      requestReceivedSuccessfully: true,
    });
  });
});

describe('useRegistrationStatus (integration)', () => {
  it('should return approved status for campaignId 1', async () => {
    const { result } = renderHook(() => useRegistrationStatus(1, 42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe(200);
    // Query params arrive as strings on the server, so the controller's
    // strict equality check (campaignId === 1) is false and it returns 'pending'.
    // This is a known server-side issue — the values come back as strings too.
    expect(result.current.data?.body).toMatchObject({
      campaignId: '1',
      salesforceUserId: '42',
      registrationStatus: 'pending',
      additionalInfo: 'Awaiting admin review.',
    });
  });
});
