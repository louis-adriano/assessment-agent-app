/**
 * Production-ready error handling utilities
 */

export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  EXTERNAL_API = 'EXTERNAL_API',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  DATABASE = 'DATABASE',
  FILE_PROCESSING = 'FILE_PROCESSING',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  category: ErrorCategory;
  message: string;
  userMessage: string; // User-friendly message
  details?: any;
  retryable: boolean;
  statusCode: number;
}

/**
 * Categorize and format errors for consistent handling
 */
export function categorizeError(error: unknown): AppError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // GitHub API errors
  if (lowerMessage.includes('404') || lowerMessage.includes('not found')) {
    return {
      category: ErrorCategory.EXTERNAL_API,
      message: errorMessage,
      userMessage: 'Resource not found. Please check your URL and try again.',
      retryable: false,
      statusCode: 404,
    };
  }

  if (lowerMessage.includes('403') || lowerMessage.includes('rate limit')) {
    return {
      category: ErrorCategory.RATE_LIMIT,
      message: errorMessage,
      userMessage: 'API rate limit reached. Please wait a few minutes and try again.',
      retryable: true,
      statusCode: 429,
    };
  }

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return {
      category: ErrorCategory.TIMEOUT,
      message: errorMessage,
      userMessage: 'Request timed out. Please try again or try a smaller submission.',
      retryable: true,
      statusCode: 504,
    };
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('econnrefused') || lowerMessage.includes('fetch failed')) {
    return {
      category: ErrorCategory.NETWORK,
      message: errorMessage,
      userMessage: 'Network error. Please check your connection and try again.',
      retryable: true,
      statusCode: 503,
    };
  }

  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return {
      category: ErrorCategory.VALIDATION,
      message: errorMessage,
      userMessage: 'Invalid input. Please check your submission and try again.',
      retryable: false,
      statusCode: 400,
    };
  }

  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('authentication')) {
    return {
      category: ErrorCategory.AUTHENTICATION,
      message: errorMessage,
      userMessage: 'Authentication required. Please sign in and try again.',
      retryable: false,
      statusCode: 401,
    };
  }

  if (lowerMessage.includes('prisma') || lowerMessage.includes('database')) {
    return {
      category: ErrorCategory.DATABASE,
      message: errorMessage,
      userMessage: 'Database error. Please try again later.',
      retryable: true,
      statusCode: 500,
    };
  }

  // Unknown error
  return {
    category: ErrorCategory.UNKNOWN,
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again.',
    retryable: true,
    statusCode: 500,
  };
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: AppError) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = (error) => error.retryable,
  } = options;

  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = categorizeError(error);

      // Don't retry if it's not retryable or last attempt
      if (!shouldRetry(lastError) || attempt === maxRetries) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
      console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * Log error with context
 */
export function logError(
  operation: string,
  error: unknown,
  context?: Record<string, any>
) {
  const appError = categorizeError(error);

  console.error(`❌ ${operation} failed:`, {
    category: appError.category,
    message: appError.message,
    retryable: appError.retryable,
    statusCode: appError.statusCode,
    ...context,
  });

  return appError;
}

/**
 * Create user-friendly error response
 */
export function createErrorResponse(error: unknown) {
  const appError = categorizeError(error);

  return {
    success: false,
    error: appError.userMessage,
    errorCategory: appError.category,
    retryable: appError.retryable,
    details: process.env.NODE_ENV === 'development' ? appError.message : undefined,
  };
}
