'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { SubmissionStatus } from '@prisma/client'
import { processAnonymousAssessment } from '@/lib/services/assessment-service'

// Validation schema for anonymous submissions
const anonymousSubmissionSchema = z.object({
  courseName: z.string().min(1, 'Course name is required'),
  assessmentNumber: z.number().int().positive('Assessment number must be positive'),
  submissionContent: z.string().min(1, 'Submission content is required'),
  submissionUrl: z.string().url().optional(),
})

// Types
type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

// Anonymous submission - no authentication required
export async function submitAnonymousAssessment(formData: FormData): Promise<ActionResult> {
  try {
    const validatedFields = anonymousSubmissionSchema.safeParse({
      courseName: formData.get('courseName'),
      assessmentNumber: Number(formData.get('assessmentNumber')),
      submissionContent: formData.get('submissionContent'),
      submissionUrl: formData.get('submissionUrl') || undefined,
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data: ' + validatedFields.error.errors.map(e => e.message).join(', ')
      }
    }

    const { courseName, assessmentNumber, submissionContent, submissionUrl } = validatedFields.data

    // Find the question
    const question = await prisma.question.findFirst({
      where: {
        course: {
          name: {
            equals: courseName.trim(),
            mode: 'insensitive'
          },
          isActive: true
        },
        questionNumber: assessmentNumber,
        isActive: true
      },
      include: {
        course: {
          select: { id: true, name: true }
        },
        baseExamples: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!question) {
      return {
        success: false,
        error: 'Question not found or not available'
      }
    }

    // Create anonymous submission (userId is null)
    const submission = await prisma.submission.create({
      data: {
        questionId: question.id,
        userId: null as any,
        submissionContent,
        submissionUrl,
        status: SubmissionStatus.PROCESSING
      }
    })

    // Process the assessment anonymously
    const assessmentResult = await processAnonymousAssessment({
      submissionId: submission.id,
      questionId: question.id,
      submissionContent,
      submissionUrl,
      question: question
    })

    return {
      success: true,
      data: assessmentResult // Don't duplicate submissionId since it's already in assessmentResult
    }

  } catch (error) {
    console.error('Anonymous submission error:', error)
    return {
      success: false,
      error: 'Failed to process submission. Please try again.'
    }
  }
}

// Get anonymous submission result by ID
export async function getAnonymousSubmissionResult(submissionId: string): Promise<ActionResult> {
  try {
    if (!submissionId) {
      return {
        success: false,
        error: 'Submission ID is required'
      }
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        question: {
          select: {
            title: true,
            questionNumber: true,
            submissionType: true,
            course: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!submission) {
      return {
        success: false,
        error: 'Submission not found'
      }
    }

    return {
      success: true,
      data: submission
    }
  } catch (error) {
    console.error('Get submission result error:', error)
    return {
      success: false,
      error: 'Failed to fetch submission result'
    }
  }
}

// Check submission status (for processing submissions)
export async function checkSubmissionStatus(submissionId: string): Promise<ActionResult> {
  try {
    if (!submissionId) {
      return {
        success: false,
        error: 'Submission ID is required'
      }
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        assessmentResult: true,
        processedAt: true,
        createdAt: true
      }
    })

    if (!submission) {
      return {
        success: false,
        error: 'Submission not found'
      }
    }

    return {
      success: true,
      data: submission
    }
  } catch (error) {
    console.error('Check submission status error:', error)
    return {
      success: false,
      error: 'Failed to check submission status'
    }
  }
}