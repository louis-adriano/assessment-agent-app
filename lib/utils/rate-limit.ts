/**
 * In-memory rate limiting (production should use Redis)
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (will reset on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No entry or window expired - allow and create new entry
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetAt });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Within window - check count
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit configurations for different operations
 */
export const RateLimits = {
  // Submissions: 10 per hour per user
  SUBMISSION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },

  // GitHub repo fetches: 30 per hour (respects GitHub API limits)
  GITHUB_FETCH: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 30,
  },

  // File uploads: 20 per hour per user
  FILE_UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  },

  // Website tests: 50 per hour per user
  WEBSITE_TEST: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
  },
} as const;

/**
 * Clean up expired entries periodically
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Get rate limit identifier for user
 */
export function getRateLimitKey(userId: string, operation: string): string {
  return `${operation}:${userId}`;
}
