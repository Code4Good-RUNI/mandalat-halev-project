import { useQuery, useMutation } from '@tanstack/react-query';
import {
  LoginRequestDto,
  RegisterForCampaignDto,
  UnregisterFromCampaignDto,
} from '@mandalat-halev-project/api-interfaces';
import { api } from './client';

// ---------------------------------------------------------------------------
// Auth hooks
// ---------------------------------------------------------------------------

// useMutation because login is a POST that changes state (creates a session).
// Usage in a screen:
//   const { mutate: login, isPending, error } = useLogin();
//   login({ phoneNumber: '0501234567', idNumber: '123456789' });
export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginRequestDto) => api.auth.login({ body }),
  });
}

// ---------------------------------------------------------------------------
// User hooks
// ---------------------------------------------------------------------------

// useQuery because this is a GET that fetches data.
// It caches the result and refetches automatically when needed.
// Usage:
//   const { data, isLoading, error } = useUserProfile(salesforceUserId);
export function useUserProfile(salesforceUserId: number) {
  return useQuery({
    queryKey: ['user', 'profile', salesforceUserId],
    queryFn: () =>
      api.user.profile({ params: { salesforceUserId } }),
  });
}

// ---------------------------------------------------------------------------
// Campaign hooks
// ---------------------------------------------------------------------------

export function useFutureCampaigns(salesforceUserId: number) {
  return useQuery({
    queryKey: ['campaigns', 'future', salesforceUserId],
    queryFn: () =>
      api.campaigns.future({ params: { salesforceUserId } }),
  });
}

export function useActiveCampaigns(salesforceUserId: number) {
  return useQuery({
    queryKey: ['campaigns', 'active', salesforceUserId],
    queryFn: () =>
      api.campaigns.active({ params: { salesforceUserId } }),
  });
}

export function usePastCampaigns(salesforceUserId: number) {
  return useQuery({
    queryKey: ['campaigns', 'past', salesforceUserId],
    queryFn: () =>
      api.campaigns.past({ params: { salesforceUserId } }),
  });
}

// useMutation because registering is a POST action.
// Usage:
//   const { mutate: register } = useRegisterForCampaign();
//   register({ campaignId: 1, salesforceUserId: 42, numOfParticipantsToRegister: 1 });
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

export function useRegistrationStatus(
  campaignId: number,
  salesforceUserId: number
) {
  return useQuery({
    queryKey: ['campaigns', 'registrationStatus', campaignId, salesforceUserId],
    queryFn: () =>
      api.campaigns.registrationStatus({
        query: { campaignId, salesforceUserId },
      }),
  });
}
