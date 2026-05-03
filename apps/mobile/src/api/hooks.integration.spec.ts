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
import { setSession, clearSession } from './session';

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

// Protected endpoints need a valid JWT in the session. Log in once and seed the
// session before any protected describe blocks run.
async function loginAndSeedSession() {
  const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
  result.current.mutate({
    phoneNumber: '0501234567',
    idNumber: '123456789',
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  if (result.current.data?.status !== 200) {
    throw new Error('Login failed during integration test setup');
  }
  await setSession({
    accessToken: result.current.data.body.accessToken,
    salesforceUserId: result.current.data.body.salesforceUserId,
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

describe('useLogin (integration)', () => {
  afterEach(async () => {
    await clearSession();
  });

  it('should login and receive a token + salesforceUserId from the server', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      phoneNumber: '0501234567',
      idNumber: '123456789',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe(200);
    if (result.current.data?.status !== 200) return;
    expect(typeof result.current.data.body.accessToken).toBe('string');
    expect(result.current.data.body.accessToken.length).toBeGreaterThan(0);
    expect(typeof result.current.data.body.salesforceUserId).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

describe('useUserProfile (integration)', () => {
  beforeAll(async () => {
    await loginAndSeedSession();
  });
  afterAll(async () => {
    await clearSession();
  });

  it('should fetch the mock user profile from the server', async () => {
    const { result } = renderHook(() => useUserProfile(), {
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
  beforeAll(async () => {
    await loginAndSeedSession();
  });
  afterAll(async () => {
    await clearSession();
  });

  it('should fetch future campaigns from the server', async () => {
    const { result } = renderHook(() => useFutureCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data;
    expect(data?.status).toBe(200);
    if (data?.status !== 200) throw new Error('Expected 200');
    expect(data.body).toHaveLength(3);
    expect(data.body[0].name).toBe('Passover Food Packing');
    expect(data.body[1].name).toBe('Beach Cleanup Morning');
    expect(data.body[2].name).toBe('Tech Tutoring for Youth');
  });
});

describe('usePastCampaigns (integration)', () => {
  beforeAll(async () => {
    await loginAndSeedSession();
  });
  afterAll(async () => {
    await clearSession();
  });

  it('should fetch past campaigns from the server', async () => {
    const { result } = renderHook(() => usePastCampaigns(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data;
    expect(data?.status).toBe(200);
    if (data?.status !== 200) throw new Error('Expected 200');
    expect(data.body).toHaveLength(2);
    expect(data.body[0].name).toBe('Winter Blanket Drive');
    expect(data.body[1].name).toBe('Community Garden Planting');
  });
});

describe('useRegisterForCampaign (integration)', () => {
  beforeAll(async () => {
    await loginAndSeedSession();
  });
  afterAll(async () => {
    await clearSession();
  });

  it('should register for a campaign and receive confirmation', async () => {
    const { result } = renderHook(() => useRegisterForCampaign(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      campaignId: '1',
      numOfParticipantsToRegister: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe(200);
    expect(result.current.data?.body).toEqual({
      campaignId: '1',
      requestReceivedSuccessfully: true,
    });
  });
});

describe('useUnregisterFromCampaign (integration)', () => {
  beforeAll(async () => {
    await loginAndSeedSession();
  });
  afterAll(async () => {
    await clearSession();
  });

  it('should unregister from a campaign and receive confirmation', async () => {
    const { result } = renderHook(() => useUnregisterFromCampaign(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      campaignId: '1',
      numOfParticipantsToUnregister: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe(200);
    expect(result.current.data?.body).toEqual({
      campaignId: '1',
      requestReceivedSuccessfully: true,
    });
  });
});

describe('useRegistrationStatus (integration)', () => {
  beforeAll(async () => {
    await loginAndSeedSession();
  });
  afterAll(async () => {
    await clearSession();
  });

  it('should return registration status for a campaign', async () => {
    const { result } = renderHook(() => useRegistrationStatus('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe(200);
    expect(result.current.data?.body).toMatchObject({
      campaignId: '1',
      registrationStatus: 'pending',
      additionalInfo: 'Awaiting admin review.',
    });
  });
});
