import { ZodIssueDto } from '@mandalat-halev-project/api-interfaces';
import { ApiError } from '../api/errorClassifier';

export type LoginFieldErrors = {
  phoneNumber?: string;
  idNumber?: string;
};

const fieldMessages: Record<
  keyof LoginFieldErrors,
  Record<string, string>
> = {
  phoneNumber: {
    invalid_string: 'מספר טלפון חייב להכיל ספרות בלבד',
    too_small: 'מספר טלפון חייב להיות 10 ספרות',
    too_big: 'מספר טלפון חייב להיות 10 ספרות',
  },
  idNumber: {
    invalid_string: 'מספר תעודת זהות חייב להכיל ספרות בלבד',
    too_small: 'מספר תעודת זהות חייב להיות 9 ספרות',
    too_big: 'מספר תעודת זהות חייב להיות 9 ספרות',
  },
};

export function getLoginFieldErrors(issues: ZodIssueDto[]): LoginFieldErrors {
  const out: LoginFieldErrors = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    if (field !== 'phoneNumber' && field !== 'idNumber') continue;
    if (out[field]) continue; // first issue per field wins
    const msg = fieldMessages[field][issue.code];
    if (msg) out[field] = msg;
  }
  return out;
}

export function getLoginBanner(error: ApiError): string {
  switch (error.kind) {
    case 'unauthorized':
      return 'מספר טלפון או תעודת זהות שגויים. אנא נסה שוב.';
    case 'network':
      return 'אין חיבור לאינטרנט. בדוק את החיבור ונסה שוב.';
    case 'serverError':
      return 'שגיאה זמנית בשרת. אנא נסה שוב בעוד מספר דקות.';
    default:
      return 'משהו השתבש. אנא נסה שוב.';
  }
}
