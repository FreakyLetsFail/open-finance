import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Permission errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Resource errors (404)
  NOT_FOUND: 'NOT_FOUND',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Business logic errors (422)
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_TRANSACTION_STATUS: 'INVALID_TRANSACTION_STATUS'
} as const;

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): NextResponse {
  const formattedErrors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        details: formattedErrors
      }
    },
    { status: 400 }
  );
}

/**
 * Handle API errors
 */
export function handleApiError(error: ApiError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    },
    { status: error.statusCode }
  );
}

/**
 * Handle unknown errors
 */
export function handleUnknownError(error: unknown): NextResponse {
  console.error('Unknown error:', error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      }
    },
    { status: 500 }
  );
}

/**
 * Main error handler for API routes
 */
export function errorHandler(error: unknown): NextResponse {
  // Zod validation errors
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  // Custom API errors
  if (error instanceof ApiError) {
    return handleApiError(error);
  }

  // Unknown errors
  return handleUnknownError(error);
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data
    },
    { status }
  );
}

/**
 * Error response helper
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    { status: statusCode }
  );
}

/**
 * Validation error helper
 */
export function validationError(message: string, details?: any): NextResponse {
  return errorResponse(ErrorCodes.VALIDATION_ERROR, message, 400, details);
}

/**
 * Not found error helper
 */
export function notFoundError(resource: string = 'Resource'): NextResponse {
  return errorResponse(
    ErrorCodes.NOT_FOUND,
    `${resource} not found`,
    404
  );
}

/**
 * Forbidden error helper
 */
export function forbiddenError(message: string = 'Access forbidden'): NextResponse {
  return errorResponse(ErrorCodes.FORBIDDEN, message, 403);
}

/**
 * Unauthorized error helper
 */
export function unauthorizedError(message: string = 'Unauthorized'): NextResponse {
  return errorResponse(ErrorCodes.UNAUTHORIZED, message, 401);
}
