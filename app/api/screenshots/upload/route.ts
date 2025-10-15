import { NextRequest, NextResponse } from 'next/server';
import { screenshotService } from '@/lib/services/screenshot-service';
import { auth } from '@/lib/auth/config';
import { headers } from 'next/headers';
import { checkRateLimit, RateLimits, getRateLimitKey } from '@/lib/utils/rate-limit';
import { logError } from '@/lib/utils/error-handling';

// Force Node.js runtime for file processing
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds for image processing

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
          error: `Rate limit exceeded. You can upload ${RateLimits.FILE_UPLOAD.maxRequests} files per hour. Try again in ${resetIn} minutes.`
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const submissionId = formData.get('submissionId') as string | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📸 Processing screenshot upload:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      userId
    });

    // Process screenshot with user context
    const screenshotInfo = await screenshotService.processScreenshot(file, {
      userId,
      submissionId: submissionId || undefined,
      description: description || undefined,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    console.log('✅ Screenshot uploaded successfully:', screenshotInfo.imageUrl);

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
    const appError = logError('Screenshot Upload', error, {
      userId: (await auth.api.getSession({ headers: await headers() }))?.user?.id,
    });

    return NextResponse.json(
      {
        success: false,
        error: appError.userMessage || 'Failed to upload screenshot'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/screenshots/upload
 * Returns supported image types and upload info
 */
export async function GET() {
  const supportedTypes = screenshotService.getSupportedImageTypes();

  return NextResponse.json({
    supportedTypes,
    maxFileSize: '5MB',
    instructions: 'Upload PNG, JPEG, GIF, or WebP images.'
  });
}
