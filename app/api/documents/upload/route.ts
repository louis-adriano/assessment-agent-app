import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@/lib/services/document-service';
import { auth } from '@/lib/auth/config';
import { headers } from 'next/headers';
import { checkRateLimit, RateLimits, getRateLimitKey } from '@/lib/utils/rate-limit';
import { logError } from '@/lib/utils/error-handling';

// Force Node.js runtime for pdf-parse and mammoth native dependencies
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large files

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check rate limit
    const rateLimitKey = getRateLimitKey(userId, 'file_upload');
    const rateLimit = checkRateLimit(rateLimitKey, RateLimits.FILE_UPLOAD);

    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60);
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. You can upload ${RateLimits.FILE_UPLOAD.maxRequests} files per hour. Try again in ${resetIn} minutes.`,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const submissionId = formData.get('submissionId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📄 Processing document upload:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      userId
    });

    // Process document with user context
    const documentInfo = await documentService.processDocument(file, {
      userId,
      submissionId: submissionId || undefined,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    console.log('✅ Document uploaded successfully:', documentInfo.fileUrl);

    return NextResponse.json({
      success: true,
      data: {
        filename: documentInfo.filename,
        fileUrl: documentInfo.fileUrl,
        content: documentInfo.content,
        metadata: documentInfo.metadata,
      }
    });

  } catch (error) {
    console.error('❌ Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/upload
 * Returns supported file types and upload info
 */
export async function GET() {
  const supportedTypes = documentService.getSupportedFileTypes();

  return NextResponse.json({
    supportedTypes,
    maxFileSize: '10MB',
    instructions: 'Upload a DOCX or TXT file. PDF support temporarily disabled.'
  });
}

// Limit file upload size (10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
