import { put } from '@vercel/blob';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';

export interface DocumentInfo {
  filename: string;
  content: string;
  metadata: {
    fileSize: number;
    fileType: string;
    wordCount: number;
    pageCount?: number;
  };
}

export class DocumentService {
  
  /**
   * Upload and process document file
   */
  async processDocument(file: File): Promise<DocumentInfo> {
    try {
      // Upload to Vercel Blob
      await put(file.name, file, {
        access: 'public',
      });

      // Extract text content based on file type
      let content = '';
      const fileType = file.type || this.getFileTypeFromName(file.name);

      switch (fileType) {
        case 'application/pdf':
          content = await this.extractPdfText(file);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          content = await this.extractDocxText(file);
          break;
        case 'text/plain':
          content = await this.extractPlainText(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Calculate metadata
      const wordCount = this.countWords(content);
      const pageCount = this.estimatePageCount(content);

      return {
        filename: file.name,
        content,
        metadata: {
          fileSize: file.size,
          fileType,
          wordCount,
          pageCount,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to process document: ${error.message}`);
    }
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
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractDocxText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to extract text from DOCX');
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
}

export const documentService = new DocumentService();