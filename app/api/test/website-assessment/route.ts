import { NextRequest, NextResponse } from 'next/server';
import { websiteService } from '@/lib/services/website-service';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Test website accessibility and get assessment data
    const assessmentData = await websiteService.assessWebsite(url);

    // Generate website summary
    const websiteSummary = websiteService.generateWebsiteSummary(assessmentData);

    return NextResponse.json({
      success: true,
      data: {
        websiteInfo: assessmentData.websiteInfo,
        issues: assessmentData.issues,
        strengths: assessmentData.strengths,
        summary: websiteSummary,
      },
    });
  } catch (error) {
    console.error('Website assessment test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assess website'
      },
      { status: 500 }
    );
  }
}
