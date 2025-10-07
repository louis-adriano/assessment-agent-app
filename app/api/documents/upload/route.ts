import { NextRequest, NextResponse } from 'next/server';
import { documentService } from '@/lib/services/document-service';

// Force Node.js runtime for pdf-parse and mammoth native dependencies
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string | null;
    const submissionId = formData.get('submissionId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Process document with optional user/submission context
    const documentInfo = await documentService.processDocument(file, {
      userId: userId || undefined,
      submissionId: submissionId || undefined,
    });

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
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document'
      },
      { status: 500 }
    );
  }
}

// Limit file upload size (10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
