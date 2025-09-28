/**
 * Utility functions for sanitizing data before database operations
 * to prevent PostgreSQL Unicode errors
 */

/**
 * Remove null bytes and other problematic Unicode characters
 * that can cause PostgreSQL errors
 */
export function sanitizeTextContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content
    // Remove null bytes (\u0000) and other control characters
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // Remove other potentially problematic Unicode sequences
    .replace(/\uFEFF/g, '') // BOM (Byte Order Mark)
    .replace(/\uFFFE/g, '') // Reversed BOM
    .replace(/\uFFFF/g, '') // Non-character
    .trim();
}

/**
 * Sanitize an object recursively, cleaning all string values
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeTextContent(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as T;
  }

  if (typeof obj === 'object') {
    const sanitized = {} as T;
    for (const [key, value] of Object.entries(obj)) {
      (sanitized as any)[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Check if content is likely binary (contains null bytes or high ratio of non-printable chars)
 */
export function isBinaryContent(content: string): boolean {
  if (!content) return false;
  
  // Check for null bytes - strong indicator of binary content
  if (content.includes('\u0000')) return true;
  
  // Check ratio of non-printable characters
  const nonPrintable = content.match(/[\u0000-\u001F\u007F-\u009F]/g);
  if (nonPrintable && nonPrintable.length / content.length > 0.1) {
    return true;
  }
  
  return false;
}

/**
 * Safe UTF-8 conversion from base64 that handles binary files
 */
export function safeBase64ToUtf8(base64Content: string, maxSize: number = 50000): string {
  try {
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Skip very large files to prevent memory issues
    if (buffer.length > maxSize) {
      return '[File too large to process]';
    }
    
    const content = buffer.toString('utf-8');
    
    // Check if this looks like binary content
    if (isBinaryContent(content)) {
      return '[Binary file content not displayable]';
    }
    
    // Sanitize the content
    return sanitizeTextContent(content);
  } catch (error) {
    console.warn('Failed to convert base64 to UTF-8:', error);
    return '[Unable to decode file content]';
  }
}