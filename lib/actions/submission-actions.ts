'use server';

import { prisma } from '@/lib/prisma';
import { assessmentService } from '@/lib/actions/assessment.actions';
import { githubService } from '@/lib/services/github-service';
import { validateGitHubUrl } from '@/lib/utils/github-validation';
import { revalidatePath } from 'next/cache';

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  remark?: string;
  feedback?: string;
  criteriaAnalysis?: any[];
  error?: string;
}

export async function submitAssessment(
  courseName: string,
  questionNumber: number,
  submissionContent: string,
  submissionType: string
): Promise<SubmissionResult> {
  try {
    // Find course by name
    const course = await prisma.course.findFirst({
      where: {
        name: {
          contains: courseName,
          mode: 'insensitive',
        },
      },
    });

    if (!course) {
      return {
        success: false,
        error: 'Course not found. Please check the course name.',
      };
    }

    // Find question by course and question number
    const question = await prisma.question.findFirst({
      where: {
        courseId: course.id,
        questionNumber: questionNumber,
      },
      include: {
        baseExamples: true,
        course: true,
      },
    });

    if (!question) {
      return {
        success: false,
        error: `Question ${questionNumber} not found in course "${courseName}".`,
      };
    }

    // Validate submission type matches question
    if (question.submissionType !== submissionType) {
      return {
        success: false,
        error: `Invalid submission type. Expected: ${question.submissionType}, got: ${submissionType}`,
      };
    }

    // Validate submission content based on type
    let processedContent = submissionContent;
    let assessmentResult;

    switch (submissionType) {
      case 'TEXT':
        if (!submissionContent.trim()) {
          return {
            success: false,
            error: 'Text submission cannot be empty.',
          };
        }
        break;

      case 'GITHUB_REPO':
        // Validate GitHub URL
        const githubValidation = validateGitHubUrl(submissionContent);
        if (!githubValidation.isValid) {
          return {
            success: false,
            error: githubValidation.error || 'Invalid GitHub repository URL.',
          };
        }
        break;

      case 'WEBSITE':
        // Validate website URL
        try {
          new URL(submissionContent);
        } catch {
          return {
            success: false,
            error: 'Please provide a valid website URL.',
          };
        }
        break;

      case 'DOCUMENT':
        if (!submissionContent.trim()) {
          return {
            success: false,
            error: 'Document content cannot be empty.',
          };
        }
        break;

      case 'SCREENSHOT':
        if (!submissionContent.trim()) {
          return {
            success: false,
            error: 'Screenshot/image content cannot be empty.',
          };
        }
        break;

      default:
        return {
          success: false,
          error: `Unsupported submission type: ${submissionType}`,
        };
    }

    // Assess the submission
    assessmentResult = await assessmentService.assessSubmission(
      processedContent,
      submissionType,
      question
    );

    // Create submission record (anonymous - no userId required)
    const submission = await prisma.submission.create({
      data: {
        questionId: question.id,
        submissionContent: processedContent,
        submissionUrl: submissionType === 'GITHUB_REPO' || submissionType === 'WEBSITE' ? processedContent : undefined,
        status: 'COMPLETED',
        assessmentResult: JSON.parse(JSON.stringify({
          remark: assessmentResult.remark,
          feedback: assessmentResult.feedback,
          criteriaAnalysis: assessmentResult.criteriaAnalysis,
          detailedAssessment: assessmentResult.detailedAssessment,
        })),
        // userId is optional - null for anonymous submissions
        userId: null,
      },
    });

    // Revalidate relevant paths
    revalidatePath(`/courses/${courseName}`);
    revalidatePath(`/submit/${courseName}/${questionNumber}`);

    return {
      success: true,
      submissionId: submission.id,
      remark: assessmentResult.remark,
      feedback: assessmentResult.feedback,
      criteriaAnalysis: assessmentResult.criteriaAnalysis,
    };

  } catch (error: any) {
    console.error('Submission error:', error);
    return {
      success: false,
      error: 'An error occurred while processing your submission. Please try again.',
    };
  }
}

export async function getSubmissionById(submissionId: string) {
  try {
    const submission = await prisma.submission.findUnique({
      where: {
        id: submissionId,
      },
      include: {
        question: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    return submission;
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw error;
  }
}

export async function getRecentSubmissions(limit: number = 10) {
  try {
    const submissions = await prisma.submission.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        question: {
          include: {
            course: true,
          },
        },
      },
    });

    return submissions;
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    throw error;
  }
}

// Legacy exports for backward compatibility
export async function submitAnonymousAssessment(formData: FormData) {
  const courseName = formData.get('courseName') as string;
  const assessmentNumber = Number(formData.get('assessmentNumber') || formData.get('questionNumber'));
  const submissionContent = formData.get('submissionContent') as string;
  const submissionUrl = formData.get('submissionUrl') as string;

  // Debug logging
  console.log('Form submission data:', {
    courseName,
    assessmentNumber,
    submissionContent,
    submissionUrl,
    submissionUrlType: typeof submissionUrl
  });

  // Determine submission type based on content
  let submissionType = 'TEXT';
  if (submissionUrl) {
    if (submissionUrl.includes('github.com')) {
      submissionType = 'GITHUB_REPO';
    } else {
      submissionType = 'WEBSITE';
    }
  }

  const contentToSubmit = submissionContent || submissionUrl;
  console.log('Submitting:', { contentToSubmit, submissionType });

  return await submitAssessment(courseName, assessmentNumber, contentToSubmit, submissionType);
}

export async function getAnonymousSubmissionResult(submissionId: string) {
  return await getSubmissionById(submissionId);
}