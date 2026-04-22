import {
  ErrorCode,
  type ErrorDetailDto,
  type ErrorResponseDto,
} from '@mandalat-halev-project/api-interfaces';

const GENERIC_MESSAGES: Record<string, string> = {
  [ErrorCode.INVALID_CREDENTIALS]: 'מספר טלפון או תעודת זהות שגויים',
  [ErrorCode.ACCOUNT_LOCKED]: 'החשבון נעול, אנא פנה לתמיכה',
  [ErrorCode.INTERNAL_ERROR]: 'שגיאה בשרת, אנא נסה שוב מאוחר יותר',
  [ErrorCode.VALIDATION_ERROR]: 'אנא בדוק את הפרטים שהוזנו',
};

const FIELD_MESSAGES: Record<string, string> = {
  phoneNumber: 'מספר טלפון לא תקין',
  idNumber: 'מספר תעודת זהות לא תקין',
};

const NETWORK_MESSAGE = 'שגיאת תקשורת, אנא בדוק את החיבור לאינטרנט';
const UNKNOWN_MESSAGE = 'שגיאה לא צפויה, אנא נסה שוב';

function extractErrorBody(error: unknown): ErrorResponseDto | null {
  if (!error || typeof error !== 'object') return null;

  const candidate = error as Record<string, unknown>;

  if (
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string'
  ) {
    return candidate as unknown as ErrorResponseDto;
  }

  const body = candidate.body;
  if (body && typeof body === 'object') {
    const bodyRecord = body as Record<string, unknown>;
    if (
      typeof bodyRecord.code === 'string' &&
      typeof bodyRecord.message === 'string'
    ) {
      return body as ErrorResponseDto;
    }
  }

  return null;
}

export function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return NETWORK_MESSAGE;
  }

  const body = extractErrorBody(error);
  if (body) {
    return GENERIC_MESSAGES[body.code] ?? UNKNOWN_MESSAGE;
  }

  if (error instanceof TypeError) {
    return NETWORK_MESSAGE;
  }

  return UNKNOWN_MESSAGE;
}

export function getFieldErrors(error: unknown): Record<string, string> {
  const body = extractErrorBody(error);
  if (!body || !Array.isArray(body.details)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const detail of body.details as ErrorDetailDto[]) {
    if (!detail || typeof detail.field !== 'string') continue;
    result[detail.field] =
      FIELD_MESSAGES[detail.field] ?? detail.message ?? UNKNOWN_MESSAGE;
  }
  return result;
}
