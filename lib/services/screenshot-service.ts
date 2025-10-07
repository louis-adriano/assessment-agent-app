import { put, del } from '@vercel/blob';
import { sanitizeTextContent } from '../utils/sanitization';

export interface ScreenshotInfo {
  filename: string;
  fileUrl: string;
  imageUrl: string; // The actual image URL to display
  metadata: {
    fileSize: number;
    fileType: string;
    width?: number;
    height?: number;
    uploadedAt: Date;
  };
  description?: string; // User-provided description
}

export interface ScreenshotUploadOptions {
  userId?: string;
  submissionId?: string;
  maxFileSize?: number; // In bytes (default 5MB)
  description?: string;
}

export class ScreenshotService {
  private readonly DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
  ];

  /**
   * Upload and process screenshot with metadata
   */
  async processScreenshot(file: File, options: ScreenshotUploadOptions = {}): Promise<ScreenshotInfo> {
    try {
      // Validate file
      this.validateFile(file, options);

      // Generate secure filename
      const secureFilename = this.generateSecureFilename(file.name, options);

      // Get image dimensions if possible
      const dimensions = await this.getImageDimensions(file);

      // Upload to Vercel Blob
      const blob = await put(secureFilename, file, {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.type,
      });

      console.log('✅ Screenshot uploaded to Vercel Blob:', blob.url);

      return {
        filename: file.name,
        fileUrl: blob.url,
        imageUrl: blob.url,
        metadata: {
          fileSize: file.size,
          fileType: file.type,
          width: dimensions?.width,
          height: dimensions?.height,
          uploadedAt: new Date(),
        },
        description: options.description,
      };
    } catch (error: any) {
      console.error('❌ Screenshot processing failed:', error);
      throw new Error(`Failed to process screenshot: ${error.message}`);
    }
  }

  /**
   * Process screenshot from URL
   */
  async processScreenshotFromUrl(url: string, options: ScreenshotUploadOptions = {}): Promise<ScreenshotInfo> {
    try {
      // Validate URL
      const normalizedUrl = this.normalizeUrl(url);

      // Fetch image
      const response = await fetch(normalizedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], this.getFilenameFromUrl(url), {
        type: blob.type || 'image/png',
      });

      return this.processScreenshot(file, options);
    } catch (error: any) {
      throw new Error(`Failed to process screenshot from URL: ${error.message}`);
    }
  }

  /**
   * Validate screenshot file
   */
  private validateFile(file: File, options: ScreenshotUploadOptions): void {
    const maxSize = options.maxFileSize || this.DEFAULT_MAX_FILE_SIZE;

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not supported. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
    }

    // Check filename
    if (!file.name || file.name.trim().length === 0) {
      throw new Error('Invalid filename');
    }

    // Security: Check for suspicious filenames
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      throw new Error('Invalid characters in filename');
    }
  }

  /**
   * Generate secure filename
   */
  private generateSecureFilename(originalFilename: string, options: ScreenshotUploadOptions): string {
    const timestamp = Date.now();
    const sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const parts = sanitized.split('.');
    const ext = parts.pop();
    const name = parts.join('.');

    let prefix = 'screenshot';
    if (options.userId) {
      prefix = `user_${options.userId.substring(0, 8)}`;
    } else if (options.submissionId) {
      prefix = `sub_${options.submissionId.substring(0, 8)}`;
    }

    return `${prefix}_${timestamp}_${name}.${ext}`;
  }

  /**
   * Get image dimensions using sharp (Node.js compatible)
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
    try {
      const sharp = (await import('sharp')).default;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const metadata = await sharp(buffer).metadata();

      if (metadata.width && metadata.height) {
        return { width: metadata.width, height: metadata.height };
      }

      return null;
    } catch (error) {
      console.error('Failed to get image dimensions:', error);
      return null;
    }
  }

  /**
   * Normalize URL
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();

    if (!normalized.match(/^https?:\/\//i)) {
      normalized = `https://${normalized}`;
    }

    try {
      const urlObj = new URL(normalized);
      return urlObj.href;
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Extract filename from URL
   */
  private getFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'screenshot.png';
    } catch {
      return 'screenshot.png';
    }
  }

  /**
   * Delete screenshot from storage
   */
  async deleteScreenshot(fileUrl: string): Promise<boolean> {
    try {
      await del(fileUrl);
      console.log('✅ Screenshot deleted:', fileUrl);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete screenshot:', error);
      return false;
    }
  }

  /**
   * Get supported image types
   */
  getSupportedImageTypes(): { extension: string; mimeType: string; description: string }[] {
    return [
      { extension: '.png', mimeType: 'image/png', description: 'PNG Image' },
      { extension: '.jpg', mimeType: 'image/jpeg', description: 'JPEG Image' },
      { extension: '.jpeg', mimeType: 'image/jpeg', description: 'JPEG Image' },
      { extension: '.gif', mimeType: 'image/gif', description: 'GIF Image' },
      { extension: '.webp', mimeType: 'image/webp', description: 'WebP Image' },
    ];
  }

  /**
   * Validate if URL is an image
   */
  isImageUrl(url: string): boolean {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  }
}

export const screenshotService = new ScreenshotService();
