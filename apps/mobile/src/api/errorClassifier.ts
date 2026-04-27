import {
  ZodIssueDto,
  ValidationErrorResponseDto,
  ErrorResponseDto,
} from '@mandalat-halev-project/api-interfaces';

// Discriminated union every screen can switch on. Translating to user-facing
// text is intentionally left to per-screen mappers because field labels and
// the meaning of statuses (e.g. 401, 409) differ between screens.
export type ApiError =
  | { kind: 'validation'; issues: ZodIssueDto[] }
  | { kind: 'unauthorized' }
  | { kind: 'forbidden' }
  | { kind: 'notFound' }
  | { kind: 'conflict'; message: string }
  | { kind: 'serverError' }
  | { kind: 'network' }
  | { kind: 'unknown' };

type ClassifierInput = {
  data?: { status: number; body: unknown };
  error?: unknown;
};

export function classifyApiError({
  data,
  error,
}: ClassifierInput): ApiError | null {
  // fetch rejected, timed out, offline, or ts-rest's validateResponse threw on
  // a response that didn't match the contract.
  if (error) return { kind: 'network' };
  if (!data) return null;
  if (data.status >= 200 && data.status < 300) return null;

  switch (data.status) {
    case 400: {
      const body = data.body as ValidationErrorResponseDto;
      const issues = [
        ...(body.bodyResult?.issues ?? []),
        ...(body.paramsResult?.issues ?? []),
        ...(body.queryResult?.issues ?? []),
        ...(body.headersResult?.issues ?? []),
      ];
      return { kind: 'validation', issues };
    }
    case 401:
      return { kind: 'unauthorized' };
    case 403:
      return { kind: 'forbidden' };
    case 404:
      return { kind: 'notFound' };
    case 409:
      return {
        kind: 'conflict',
        message: (data.body as ErrorResponseDto).message,
      };
    default:
      if (data.status >= 500) return { kind: 'serverError' };
      return { kind: 'unknown' };
  }
}
