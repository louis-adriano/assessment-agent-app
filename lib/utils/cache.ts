/**
 * Simple in-memory cache with TTL for production readiness
 *
 * NOTE: In production, this should be replaced with Redis or similar
 * distributed caching system for multi-instance deployments.
 *
 * Usage:
 * - GitHub repo data: 1 hour cache (repos don't change frequently during grading)
 * - Website tests: 30 minutes cache (sites may update more often)
 * - Document processing: No cache (each submission is unique)
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache with TTL (time to live in milliseconds)
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as string | undefined;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Singleton cache instance
export const cache = new SimpleCache(1000);

/**
 * Cache key generators for different resource types
 */
export const CacheKeys = {
  github: (owner: string, repo: string) => `github:${owner}/${repo}`,
  website: (url: string) => `website:${url}`,
  document: (url: string) => `document:${url}`, // Rarely used since documents are unique per submission
};

/**
 * Cache TTL configurations (in milliseconds)
 */
export const CacheTTL = {
  GITHUB_REPO: 60 * 60 * 1000,      // 1 hour - repos don't change during grading period
  WEBSITE_TEST: 30 * 60 * 1000,     // 30 minutes - sites may update
  DOCUMENT: 15 * 60 * 1000,         // 15 minutes - rarely cached
};

/**
 * Wrapper function to cache async operations
 *
 * @param key - Cache key
 * @param fn - Async function to execute if cache miss
 * @param ttlMs - Time to live in milliseconds
 * @returns Cached or fresh data
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    console.log(`✅ Cache HIT: ${key}`);
    return cached;
  }

  // Cache miss - execute function
  console.log(`❌ Cache MISS: ${key} - fetching...`);
  const data = await fn();

  // Store in cache
  cache.set(key, data, ttlMs);

  return data;
}
