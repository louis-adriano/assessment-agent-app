// lib/actions/manual-review-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth/config'
import { z } from 'zod'

const manualReviewSchema = z.object({
  submissionId: z.string().cuid(),
  manualFeedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  manualScore: z.string().optional(),
  manualGrade: z.number().min(0).max(100).optional(),
});

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Submit manual review for a submission
 */
export async function submitManualReview(
  submissionId: string,
  manualFeedback: string,
  manualScore?: string,
  manualGrade?: number
): Promise<ActionResult> {
  try {
    // Require admin authentication
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { success: false, error: 'You must be logged in to review submissions' };
    }

    const user = session.user;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'COURSE_ADMIN') {
      return { success: false, error: 'Only admins can review submissions' };
    }

    // Validate input
    const validation = manualReviewSchema.safeParse({
      submissionId,
      manualFeedback,
      manualScore,
      manualGrade,
    });

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Validation failed';
      return { success: false, error: errorMessage };
    }

    // Get submission with question details
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            course: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!submission) {
      return { success: false, error: 'Submission not found' };
    }

    // Update submission with manual review
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        manualFeedback,
        manualScore,
        manualGrade,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        status: 'COMPLETED', // Mark as completed after manual review
      },
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: submission.userId!,
        submissionId: submissionId,
        type: 'MANUAL_REVIEW',
        title: 'Your submission has been reviewed',
        message: `Your submission for "${submission.question.title}" has been reviewed by an instructor.`,
        isRead: false,
      }
    });

    console.log('✅ Manual review submitted:', {
      submissionId,
      reviewedBy: user.id,
      score: manualScore,
      grade: manualGrade
    });

    // Revalidate relevant paths
    revalidatePath('/admin/submissions');
    revalidatePath(`/results/${submissionId}`);
    revalidatePath('/my-submissions');

    return {
      success: true,
      data: {
        submissionId: updatedSubmission.id,
        message: 'Review submitted successfully'
      }
    };

  } catch (error) {
    console.error('❌ Manual review error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit review',
    };
  }
}

/**
 * Get submissions needing manual review
 */
export async function getManualReviewQueue(courseId?: string): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    const user = session.user;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'COURSE_ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    // Build where clause
    const whereClause: any = {
      OR: [
        // MANUAL_ONLY submissions that are pending
        {
          question: {
            assessmentMode: 'MANUAL_ONLY'
          },
          status: 'PENDING'
        },
        // BOTH mode submissions that haven't been manually reviewed yet
        {
          question: {
            assessmentMode: 'BOTH'
          },
          reviewedAt: null
        }
      ]
    };

    // Filter by course if specified
    if (courseId) {
      whereClause.question = {
        ...whereClause.question,
        courseId: courseId
      };
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        question: {
          select: {
            id: true,
            title: true,
            questionNumber: true,
            submissionType: true,
            assessmentMode: true,
            courseId: true,
            course: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      data: submissions
    };

  } catch (error) {
    console.error('❌ Error fetching manual review queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch submissions',
    };
  }
}

/**
 * Get statistics for manual review queue
 */
export async function getManualReviewStats(): Promise<ActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    const user = session.user;
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'COURSE_ADMIN') {
      return { success: false, error: 'Admin access required' };
    }

    const [pendingManual, pendingBoth, completedToday] = await Promise.all([
      // Pending MANUAL_ONLY submissions
      prisma.submission.count({
        where: {
          question: {
            assessmentMode: 'MANUAL_ONLY'
          },
          status: 'PENDING'
        }
      }),
      // BOTH mode submissions awaiting manual review
      prisma.submission.count({
        where: {
          question: {
            assessmentMode: 'BOTH'
          },
          reviewedAt: null
        }
      }),
      // Completed manual reviews today
      prisma.submission.count({
        where: {
          reviewedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    return {
      success: true,
      data: {
        pendingManual,
        pendingBoth,
        totalPending: pendingManual + pendingBoth,
        completedToday
      }
    };

  } catch (error) {
    console.error('❌ Error fetching manual review stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stats',
    };
  }
}
