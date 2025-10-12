// lib/actions/question-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/auth/utils'
import { UserRole, SubmissionType } from '@prisma/client'

// Validation schemas
const createQuestionSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(1, 'Question title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  submissionType: z.enum(['TEXT', 'DOCUMENT', 'GITHUB_REPO', 'SCREENSHOT', 'WEBSITE']),
  assessmentMode: z.enum(['AI_ONLY', 'MANUAL_ONLY', 'BOTH']).default('AI_ONLY'),
  assessmentPrompt: z.string().optional(),
  criteria: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
  conditionalChecks: z.array(z.string()).default([]),
  guidance: z.string().optional(),
})

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

/**
 * Create a new question
 */
export async function createQuestion(data: {
  courseId: string
  title: string
  description: string
  submissionType: SubmissionType
  assessmentMode?: 'AI_ONLY' | 'MANUAL_ONLY' | 'BOTH'
  assessmentPrompt?: string
  criteria: string[]
  redFlags: string[]
  conditionalChecks: string[]
  guidance?: string
}): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    // Validate the input data
    const validatedData = createQuestionSchema.parse(data)

    // Check if course exists and user has permission
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId }
    })

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to add questions to this course' }
    }

    // Get the next question number for this course
    const lastQuestion = await prisma.question.findFirst({
      where: { courseId: validatedData.courseId },
      orderBy: { questionNumber: 'desc' }
    })

    const questionNumber = lastQuestion ? lastQuestion.questionNumber + 1 : 1

    // Create the question
    const question = await prisma.question.create({
      data: {
        courseId: validatedData.courseId,
        questionNumber,
        title: validatedData.title,
        description: validatedData.description,
        submissionType: validatedData.submissionType as SubmissionType,
        assessmentMode: validatedData.assessmentMode || 'AI_ONLY',
        assessmentPrompt: validatedData.assessmentPrompt || null,
        criteria: validatedData.criteria.filter(c => c.trim() !== ''),
        redFlags: validatedData.redFlags.filter(r => r.trim() !== ''),
        conditionalChecks: validatedData.conditionalChecks.filter(c => c.trim() !== ''),
        guidance: validatedData.guidance || null,
        createdBy: user.id,
      },
      include: {
        course: {
          select: { name: true }
        },
        _count: {
          select: { submissions: true, baseExamples: true }
        }
      }
    })

    revalidatePath('/admin/courses')
    revalidatePath(`/admin/courses/${validatedData.courseId}`)
    
    return { success: true, data: question }

  } catch (error) {
    console.error('Create question error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input: ' + error.errors.map(e => e.message).join(', ')
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create question'
    }
  }
}

/**
 * Update an existing question
 */
export async function updateQuestion(
  questionId: string,
  data: Partial<{
    title: string
    description: string
    submissionType: SubmissionType
    assessmentMode: 'AI_ONLY' | 'MANUAL_ONLY' | 'BOTH'
    assessmentPrompt: string
    criteria: string[]
    redFlags: string[]
    conditionalChecks: string[]
    guidance: string
    isActive: boolean
  }>
): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    // Check if question exists and user has permission
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        course: true
      }
    })

    if (!existingQuestion) {
      return { success: false, error: 'Question not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && existingQuestion.course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to edit this question' }
    }

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...data,
        criteria: data.criteria?.filter(c => c.trim() !== ''),
        redFlags: data.redFlags?.filter(r => r.trim() !== ''),
        conditionalChecks: data.conditionalChecks?.filter(c => c.trim() !== ''),
      },
      include: {
        course: {
          select: { name: true }
        },
        _count: {
          select: { submissions: true, baseExamples: true }
        }
      }
    })

    revalidatePath('/admin/courses')
    revalidatePath(`/admin/courses/${existingQuestion.courseId}`)
    revalidatePath(`/admin/courses/${existingQuestion.courseId}/assessments/${questionId}`)
    
    return { success: true, data: updatedQuestion }

  } catch (error) {
    console.error('Update question error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update question'
    }
  }
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: string): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    // Check if question exists and user has permission
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        course: true,
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!existingQuestion) {
      return { success: false, error: 'Question not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && existingQuestion.course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to delete this question' }
    }

    // Check if question has submissions
    if (existingQuestion._count.submissions > 0) {
      return {
        success: false,
        error: 'Cannot delete question with existing submissions. Archive it instead.'
      }
    }

    // Delete the question (this will cascade to base examples)
    await prisma.question.delete({
      where: { id: questionId }
    })

    revalidatePath('/admin/courses')
    revalidatePath(`/admin/courses/${existingQuestion.courseId}`)
    
    return { success: true, data: { message: 'Question deleted successfully' } }

  } catch (error) {
    console.error('Delete question error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete question'
    }
  }
}

/**
 * Get question details with submissions
 */
export async function getQuestionWithSubmissions(questionId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        course: {
          select: { 
            id: true, 
            name: true, 
            creatorId: true 
          }
        },
        baseExamples: {
          orderBy: { createdAt: 'desc' }
        },
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Latest 10 submissions
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: { submissions: true, baseExamples: true }
        }
      }
    })

    if (!question) {
      return { success: false, error: 'Question not found' }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && question.course.creatorId !== user.id) {
      return { success: false, error: 'You do not have permission to view this question' }
    }

    return { success: true, data: question }

  } catch (error) {
    console.error('Get question with submissions error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get question details'
    }
  }
}