import { useQuery, useMutation } from '@tanstack/react-query';
import {
  LoginRequestDto,
  RegisterForCampaignDto,
  UnregisterFromCampaignDto,
} from '@mandalat-halev-project/api-interfaces';
import { api, apiPublic } from './client';

// ---------------------------------------------------------------------------
// Auth hooks
// ---------------------------------------------------------------------------

// Login uses the public client so the request goes out without a Bearer header.
// Usage in a screen:
//   const { mutate: login, isPending, error } = useLogin();
//   login({ phoneNumber: '0501234567', idNumber: '123456789' });
export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginRequestDto) => apiPublic.auth.login({ body }),
  });
}

// ---------------------------------------------------------------------------
// User hooks
// ---------------------------------------------------------------------------

// The server identifies the user from the JWT (CurrentUser('sub')), so the
// client doesn't pass salesforceUserId. The protected `api` client attaches
// the Bearer header automatically.
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => api.user.profile(),
  });
}

// ---------------------------------------------------------------------------
// Campaign hooks
// ---------------------------------------------------------------------------

export function useFutureCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'future'],
    queryFn: () => api.campaigns.future(),
  });
}

export function useActiveCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'active'],
    queryFn: () => api.campaigns.active(),
  });
}

export function usePastCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'past'],
    queryFn: () => api.campaigns.past(),
  });
}

export function useRegisterForCampaign() {
  return useMutation({
    mutationFn: (body: RegisterForCampaignDto) =>
      api.campaigns.register({ body }),
  });
}

export function useUnregisterFromCampaign() {
  return useMutation({
    mutationFn: (body: UnregisterFromCampaignDto) =>
      api.campaigns.unregister({ body }),
  });
}

export function useRegistrationStatus(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', 'registrationStatus', campaignId],
    queryFn: () =>
      api.campaigns.registrationStatus({
        query: { campaignId },
      }),
  });
}
