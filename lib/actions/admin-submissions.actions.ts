// lib/actions/admin-submissions.actions.ts
'use server'

import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/utils'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { notifyManualReview } from './notification-actions'

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get all submissions for manual review (course admins)
 */
export async function getManualSubmissions(filters?: {
  courseId?: string
  questionId?: string
  status?: string
  studentEmail?: string
  startDate?: Date
  endDate?: Date
}): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    // Build where clause
    const where: any = {}

    // Filter by course (if specified)
    if (filters?.courseId) {
      where.question = {
        courseId: filters.courseId
      }
    }

    // Filter by question
    if (filters?.questionId) {
      where.questionId = filters.questionId
    }

    // Filter by status
    if (filters?.status) {
      if (filters.status === 'PENDING') {
        where.status = 'PENDING'
        where.reviewedAt = null
      } else if (filters.status === 'REVIEWED') {
        where.reviewedAt = { not: null }
      }
    }

    // Filter by student email
    if (filters?.studentEmail) {
      where.user = {
        email: {
          contains: filters.studentEmail,
          mode: 'insensitive'
        }
      }
    }

    // Filter by date range
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    // For course admins, only show submissions from their courses
    if (user.role === UserRole.COURSE_ADMIN) {
      const adminCourses = await prisma.courseAdmin.findMany({
        where: { userId: user.id },
        select: { courseId: true }
      })

      const courseIds = adminCourses.map(ac => ac.courseId)

      where.question = {
        ...where.question,
        courseId: { in: courseIds }
      }
    }

    const submissions = await prisma.submission.findMany({
      where,
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
    })

    return { success: true, data: submissions }

  } catch (error) {
    console.error('Get manual submissions error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch submissions'
    }
  }
}

/**
 * Get submission details for review
 */
export async function getSubmissionForReview(submissionId: string): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
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
          include: {
            course: true
          }
        }
      }
    })

    if (!submission) {
      return { success: false, error: 'Submission not found' }
    }

    // Check permissions for course admins
    if (user.role === UserRole.COURSE_ADMIN) {
      const isAdmin = await prisma.courseAdmin.findFirst({
        where: {
          userId: user.id,
          courseId: submission.question.course.id
        }
      })

      if (!isAdmin) {
        return { success: false, error: 'You do not have permission to review this submission' }
      }
    }

    return { success: true, data: submission }

  } catch (error) {
    console.error('Get submission for review error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch submission'
    }
  }
}

/**
 * Submit manual feedback for a submission
 */
export async function submitManualFeedback(
  submissionId: string,
  feedback: string,
  score: string,
  grade?: number
): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    // Get submission to check permissions
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          include: {
            course: true
          }
        }
      }
    })

    if (!submission) {
      return { success: false, error: 'Submission not found' }
    }

    // Check permissions for course admins
    if (user.role === UserRole.COURSE_ADMIN) {
      const isAdmin = await prisma.courseAdmin.findFirst({
        where: {
          userId: user.id,
          courseId: submission.question.course.id
        }
      })

      if (!isAdmin) {
        return { success: false, error: 'You do not have permission to review this submission' }
      }
    }

    // Update submission with manual feedback
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        manualFeedback: feedback,
        manualScore: score,
        manualGrade: grade,
        reviewedBy: user.id,
        reviewedAt: new Date(),
        status: 'COMPLETED',
        processedAt: new Date()
      }
    })

    // Notify student if they have an account
    if (submission.userId) {
      await notifyManualReview(submissionId)
    }

    revalidatePath('/admin/submissions')
    revalidatePath(`/results/${submissionId}`)

    return { success: true, data: updatedSubmission }

  } catch (error) {
    console.error('Submit manual feedback error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit feedback'
    }
  }
}

/**
 * Get courses that have manual feedback questions (for filtering)
 */
export async function getCoursesWithManualFeedback(): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    let whereClause: any = {}

    // For course admins, only show their courses
    if (user.role === UserRole.COURSE_ADMIN) {
      const adminCourses = await prisma.courseAdmin.findMany({
        where: { userId: user.id },
        select: { courseId: true }
      })

      const courseIds = adminCourses.map(ac => ac.courseId)

      whereClause = {
        id: { in: courseIds }
      }
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return { success: true, data: courses }

  } catch (error) {
    console.error('Get courses with manual feedback error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch courses'
    }
  }
}
