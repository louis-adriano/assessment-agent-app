import { put, del, head } from '@vercel/blob';
import mammoth from 'mammoth';
// Dynamic import for pdf-parse to avoid webpack issues
// import pdf from 'pdf-parse';
import { sanitizeTextContent } from '../utils/sanitization';

export interface DocumentInfo {
  filename: string;
  content: string;
  fileUrl: string; // Added: Vercel Blob storage URL
  metadata: {
    fileSize: number;
    fileType: string;
    wordCount: number;
    pageCount?: number;
    uploadedAt: Date;
    contentHash?: string; // For deduplication
  };
}

export interface DocumentUploadOptions {
  userId?: string; // For secure file access
  submissionId?: string; // Link to submission
  maxFileSize?: number; // In bytes (default 10MB)
  allowedTypes?: string[]; // Allowed MIME types
}

export class DocumentService {
  private readonly DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = [
    // 'application/pdf', // Temporarily disabled due to pdf-parse library issues
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  /**
   * Upload and process document file with security and validation
   */
  async processDocument(file: File, options: DocumentUploadOptions = {}): Promise<DocumentInfo> {
    try {
      // Validate file
      this.validateFile(file, options);

      // Generate secure filename
      const secureFilename = this.generateSecureFilename(file.name, options);

      // Extract text content BEFORE uploading (for security)
      let content = '';
      const fileType = file.type || this.getFileTypeFromName(file.name);

      switch (fileType) {
        case 'application/pdf':
          // PDF support temporarily disabled due to pdf-parse library issues
          throw new Error('PDF support is currently unavailable. Please use DOCX or TXT format, or paste your document content directly.');
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          content = await this.extractDocxText(file);
          break;
        case 'application/msword':
          // For old .doc files, try mammoth (may not work perfectly)
          try {
            content = await this.extractDocxText(file);
          } catch {
            throw new Error('Legacy .doc format not fully supported. Please convert to .docx');
          }
          break;
        case 'text/plain':
          content = await this.extractPlainText(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Sanitize extracted content
      content = sanitizeTextContent(content);

      // Calculate metadata
      const wordCount = this.countWords(content);
      const pageCount = this.estimatePageCount(content);
      const contentHash = this.generateContentHash(content);

      // Upload to Vercel Blob with metadata
      const blob = await put(secureFilename, file, {
        access: 'public', // Consider 'private' for sensitive documents
        addRandomSuffix: true, // Prevents filename collisions
        contentType: fileType,
      });

      console.log('✅ Document uploaded to Vercel Blob:', blob.url);

      return {
        filename: file.name,
        content,
        fileUrl: blob.url,
        metadata: {
          fileSize: file.size,
          fileType,
          wordCount,
          pageCount,
          uploadedAt: new Date(),
          contentHash,
        },
      };
    } catch (error: any) {
      console.error('❌ Document processing failed:', error);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  /**
   * Validate file before processing
   */
  private validateFile(file: File, options: DocumentUploadOptions): void {
    const maxSize = options.maxFileSize || this.DEFAULT_MAX_FILE_SIZE;
    const allowedTypes = options.allowedTypes || this.ALLOWED_TYPES;
    const fileType = file.type || this.getFileTypeFromName(file.name);

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // Check file type
    if (!allowedTypes.includes(fileType)) {
      throw new Error(`File type ${fileType} is not supported. Allowed types: ${allowedTypes.join(', ')}`);
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
   * Generate secure filename with user/submission context
   */
  private generateSecureFilename(originalFilename: string, options: DocumentUploadOptions): string {
    const timestamp = Date.now();
    const sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const parts = sanitized.split('.');
    const ext = parts.pop();
    const name = parts.join('.');

    let prefix = 'doc';
    if (options.userId) {
      prefix = `user_${options.userId.substring(0, 8)}`;
    } else if (options.submissionId) {
      prefix = `sub_${options.submissionId.substring(0, 8)}`;
    }

    return `${prefix}_${timestamp}_${name}.${ext}`;
  }

  /**
   * Generate simple content hash for deduplication
   */
  private generateContentHash(content: string): string {
    // Simple hash (for production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Process document from URL
   */
  async processDocumentFromUrl(url: string): Promise<DocumentInfo> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], this.getFilenameFromUrl(url), {
        type: blob.type,
      });

      return this.processDocument(file);
    } catch (error: any) {
      throw new Error(`Failed to process document from URL: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractPdfText(file: File): Promise<string> {
    try {
      // Dynamic import to avoid webpack issues
      const pdfParse = await import('pdf-parse');
      const pdf = pdfParse.default;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log('📄 Processing PDF, buffer size:', buffer.length);

      const data = await pdf(buffer);
      console.log('✅ PDF processed, text length:', data.text.length);
      return data.text;
    } catch (error) {
      console.error('❌ PDF extraction error details:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractDocxText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from plain text file
   */
  private async extractPlainText(file: File): Promise<string> {
    try {
      return await file.text();
    } catch (error) {
      throw new Error('Failed to read plain text file');
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Estimate page count (assuming ~250 words per page)
   */
  private estimatePageCount(text: string): number {
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / 250);
  }

  /**
   * Get file type from filename
   */
  private getFileTypeFromName(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'doc':
        return 'application/msword';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Extract filename from URL
   */
  private getFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'document';
    } catch {
      return 'document';
    }
  }

  /**
   * Validate document requirements
   */
  validateDocument(documentInfo: DocumentInfo, requirements?: {
    minWords?: number;
    maxWords?: number;
    requiredSections?: string[];
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (requirements?.minWords && documentInfo.metadata.wordCount < requirements.minWords) {
      errors.push(`Document must contain at least ${requirements.minWords} words (current: ${documentInfo.metadata.wordCount})`);
    }

    if (requirements?.maxWords && documentInfo.metadata.wordCount > requirements.maxWords) {
      errors.push(`Document must contain no more than ${requirements.maxWords} words (current: ${documentInfo.metadata.wordCount})`);
    }

    if (requirements?.requiredSections) {
      const content = documentInfo.content.toLowerCase();
      for (const section of requirements.requiredSections) {
        if (!content.includes(section.toLowerCase())) {
          errors.push(`Document must include section: "${section}"`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Delete document from Vercel Blob
   */
  async deleteDocument(fileUrl: string): Promise<boolean> {
    try {
      await del(fileUrl);
      console.log('✅ Document deleted:', fileUrl);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      return false;
    }
  }

  /**
   * Check if document exists
   */
  async documentExists(fileUrl: string): Promise<boolean> {
    try {
      await head(fileUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Compare document with base example
   */
  compareWithBaseExample(
    submission: DocumentInfo,
    baseExample: DocumentInfo
  ): {
    similarity: number;
    differences: string[];
    strengths: string[];
  } {
    const differences: string[] = [];
    const strengths: string[] = [];

    // Word count comparison
    const wordDiff = Math.abs(submission.metadata.wordCount - baseExample.metadata.wordCount);
    const wordDiffPercent = (wordDiff / baseExample.metadata.wordCount) * 100;

    if (wordDiffPercent > 50) {
      differences.push(`Word count differs significantly (${submission.metadata.wordCount} vs ${baseExample.metadata.wordCount})`);
    } else if (wordDiffPercent < 10) {
      strengths.push('Word count is appropriate');
    }

    // Page count comparison
    if (submission.metadata.pageCount && baseExample.metadata.pageCount) {
      if (Math.abs(submission.metadata.pageCount - baseExample.metadata.pageCount) > 2) {
        differences.push(`Page count differs (${submission.metadata.pageCount} vs ${baseExample.metadata.pageCount} pages)`);
      }
    }

    // Simple text similarity (Jaccard index)
    const similarity = this.calculateTextSimilarity(
      submission.content,
      baseExample.content
    );

    if (similarity < 0.2) {
      differences.push('Content structure differs significantly from base example');
    } else if (similarity > 0.6) {
      strengths.push('Content structure aligns well with base example');
    }

    return {
      similarity,
      differences,
      strengths,
    };
  }

  /**
   * Calculate text similarity using Jaccard index
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Get supported file types
   */
  getSupportedFileTypes(): { extension: string; mimeType: string; description: string }[] {
    return [
      // { extension: '.pdf', mimeType: 'application/pdf', description: 'PDF Document' }, // Temporarily disabled
      { extension: '.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Word Document' },
      { extension: '.txt', mimeType: 'text/plain', description: 'Plain Text' },
    ];
  }
}

export const documentService = new DocumentService();