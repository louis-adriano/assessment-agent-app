import { NextRequest, NextResponse } from 'next/server';
import { screenshotService } from '@/lib/services/screenshot-service';

// Force Node.js runtime for file processing
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string | null;
    const submissionId = formData.get('submissionId') as string | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Process screenshot with optional context
    const screenshotInfo = await screenshotService.processScreenshot(file, {
      userId: userId || undefined,
      submissionId: submissionId || undefined,
      description: description || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        filename: screenshotInfo.filename,
        fileUrl: screenshotInfo.fileUrl,
        imageUrl: screenshotInfo.imageUrl,
        metadata: screenshotInfo.metadata,
        description: screenshotInfo.description,
      }
    });

  } catch (error) {
    console.error('Screenshot upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload screenshot'
      },
      { status: 500 }
    );
  }
}
