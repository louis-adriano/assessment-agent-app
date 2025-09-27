import { NextRequest, NextResponse } from 'next/server';
import { findQuestionByNumber } from '@/lib/actions/lookup-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseName = searchParams.get('courseName');
    const assessmentNumber = searchParams.get('assessmentNumber') || searchParams.get('questionNumber');

    if (!courseName || !assessmentNumber) {
      return NextResponse.json(
        { error: 'Missing courseName or assessmentNumber parameter' },
        { status: 400 }
      );
    }

    const result = await findQuestionByNumber(courseName, parseInt(assessmentNumber));

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}