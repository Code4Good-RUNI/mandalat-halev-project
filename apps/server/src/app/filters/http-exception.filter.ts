import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ZodError } from 'zod';
import {
  ErrorCode,
  type ErrorDetailDto,
  type ErrorResponseDto,
} from '@mandalat-halev-project/api-interfaces';

const statusToDefaultCode: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.INVALID_CREDENTIALS,
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
};

function mapZodIssues(error: ZodError): ErrorDetailDto[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

function isZodErrorBody(
  body: unknown,
): body is { name: 'ZodError'; issues: ZodError['issues'] } {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { name?: unknown }).name === 'ZodError' &&
    Array.isArray((body as { issues?: unknown }).issues)
  );
}

/**
 * ts-rest wraps Zod validation errors in a RequestValidationError
 * whose body has the shape: { bodyResult, queryResult, paramsResult, headersResult }
 * where each is either null or a ZodError instance.
 */
function isTsRestValidationBody(
  body: unknown,
): body is {
  bodyResult?: ZodError | null;
  queryResult?: ZodError | null;
  paramsResult?: ZodError | null;
  headersResult?: ZodError | null;
} {
  return (
    typeof body === 'object' &&
    body !== null &&
    ('bodyResult' in body ||
      'queryResult' in body ||
      'paramsResult' in body ||
      'headersResult' in body)
  );
}

function extractTsRestDetails(body: {
  bodyResult?: ZodError | null;
  queryResult?: ZodError | null;
  paramsResult?: ZodError | null;
  headersResult?: ZodError | null;
}): ErrorDetailDto[] {
  const details: ErrorDetailDto[] = [];
  for (const result of [
    body.bodyResult,
    body.queryResult,
    body.paramsResult,
    body.headersResult,
  ]) {
    if (result && 'issues' in result && Array.isArray(result.issues)) {
      details.push(
        ...result.issues.map((issue: { path: (string | number)[]; message: string }) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
  }
  return details;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: ErrorResponseDto) => void };
    }>();

    const payload = this.buildPayload(exception);
    response.status(payload.statusCode).json(payload);
  }

  private buildPayload(exception: unknown): ErrorResponseDto {
    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: mapZodIssues(exception),
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (isZodErrorBody(body)) {
        return {
          statusCode,
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details: body.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message ?? 'Invalid value',
          })),
        };
      }

      if (isTsRestValidationBody(body)) {
        const details = extractTsRestDetails(body);
        return {
          statusCode,
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          ...(details.length > 0 ? { details } : {}),
        };
      }

      const defaultCode =
        statusToDefaultCode[statusCode] ?? ErrorCode.INTERNAL_ERROR;

      if (typeof body === 'string') {
        return {
          statusCode,
          code: defaultCode,
          message: body,
        };
      }

      if (typeof body === 'object' && body !== null) {
        const record = body as Record<string, unknown>;
        const code =
          typeof record.code === 'string' ? record.code : defaultCode;
        const message =
          typeof record.message === 'string'
            ? record.message
            : exception.message;
        const details = Array.isArray(record.details)
          ? (record.details as ErrorDetailDto[])
          : undefined;

        return {
          statusCode,
          code,
          message,
          ...(details ? { details } : {}),
        };
      }

      return {
        statusCode,
        code: defaultCode,
        message: exception.message,
      };
    }

    console.error('Unhandled exception:', exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    };
  }
}
