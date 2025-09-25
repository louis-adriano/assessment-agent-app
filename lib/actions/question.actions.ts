// lib/actions/question-actions.ts - COMPLETE FILE
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireRole, canManageCourse } from '@/lib/auth/utils'
import { UserRole, SubmissionType } from '@prisma/client'

// Validation schemas
const createQuestionSchema = z.object({
  courseId: z.string().cuid(),
  title: z.string().min(1, 'Question title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Question description is required'),
  submissionType: z.nativeEnum(SubmissionType),
  assessmentPrompt: z.string().optional(),
  criteria: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
  conditionalChecks: z.array(z.string()).default([]),
  guidance: z.string().optional(),
})

const updateQuestionSchema = createQuestionSchema.extend({
  id: z.string().cuid(),
  questionNumber: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

const baseExampleSchema = z.object({
  questionId: z.string().cuid(),
  title: z.string().min(1, 'Base example title is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Base example content is required'),
  fileUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
})

// Types
type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
}

// Helper function to parse form array fields
function parseArrayField(formData: FormData, fieldName: string): string[] {
  const values = formData.getAll(fieldName)
  return values.filter(v => typeof v === 'string' && v.trim() !== '') as string[]
}

// Create Question Action
export async function createQuestion(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const validatedFields = createQuestionSchema.safeParse({
      courseId: formData.get('courseId'),
      title: formData.get('title'),
      description: formData.get('description'),
      submissionType: formData.get('submissionType'),
      assessmentPrompt: formData.get('assessmentPrompt') || undefined,
      criteria: parseArrayField(formData, 'criteria'),
      redFlags: parseArrayField(formData, 'redFlags'),
      conditionalChecks: parseArrayField(formData, 'conditionalChecks'),
      guidance: formData.get('guidance') || undefined,
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data: ' + validatedFields.error.errors.map(e => e.message).join(', ')
      }
    }

    const { courseId, title, description, submissionType, assessmentPrompt, criteria, redFlags, conditionalChecks, guidance } = validatedFields.data

    // Check if course exists and user has permission
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return {
        success: false,
        error: 'Course not found'
      }
    }

    if (!canManageCourse(user.role, course.creatorId, user.id)) {
      return {
        success: false,
        error: 'You do not have permission to add questions to this course'
      }
    }

    // Get the next question number
    const lastQuestion = await prisma.question.findFirst({
      where: { courseId },
      orderBy: { questionNumber: 'desc' }
    })

    const questionNumber = (lastQuestion?.questionNumber || 0) + 1

    const question = await prisma.question.create({
      data: {
        courseId,
        questionNumber,
        title,
        description,
        submissionType,
        assessmentPrompt,
        criteria,
        redFlags,
        conditionalChecks,
        guidance,
        createdBy: user.id,
      },
      include: {
        course: {
          select: { name: true }
        },
        _count: {
          select: { baseExamples: true, submissions: true }
        }
      }
    })

    revalidatePath(`/admin/courses/${courseId}`)
    revalidatePath(`/admin/courses/${courseId}/questions`)
    return {
      success: true,
      data: question
    }
  } catch (error) {
    console.error('Create question error:', error)
    return {
      success: false,
      error: 'Failed to create question. Please try again.'
    }
  }
}

// Get Questions for Course
export async function getQuestions(courseId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    // Check course access permission
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return {
        success: false,
        error: 'Course not found'
      }
    }

    // Check permissions based on role
    if (user.role === UserRole.COURSE_ADMIN && course.creatorId !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to access this course'
      }
    }

    if (user.role === UserRole.STUDENT) {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_userId: {
            courseId: course.id,
            userId: user.id
          }
        }
      })

      if (!enrollment) {
        return {
          success: false,
          error: 'You are not enrolled in this course'
        }
      }
    }

    const questions = await prisma.question.findMany({
      where: { 
        courseId,
        isActive: user.role === UserRole.STUDENT ? true : undefined // Students only see active questions
      },
      include: {
        baseExamples: {
          orderBy: { createdAt: 'asc' }
        },
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { questionNumber: 'asc' }
    })

    return {
      success: true,
      data: questions
    }
  } catch (error) {
    console.error('Get questions error:', error)
    return {
      success: false,
      error: 'Failed to fetch questions'
    }
  }
}

// Get Single Question
export async function getQuestion(questionId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth()

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        course: {
          select: { id: true, name: true, creatorId: true }
        },
        baseExamples: {
          orderBy: { createdAt: 'asc' }
        },
        submissions: user.role === UserRole.STUDENT ? {
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        } : {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!question) {
      return {
        success: false,
        error: 'Question not found'
      }
    }

    // Check permissions
    if (user.role === UserRole.COURSE_ADMIN && question.course.creatorId !== user.id) {
      return {
        success: false,
        error: 'You do not have permission to access this question'
      }
    }

    if (user.role === UserRole.STUDENT) {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_userId: {
            courseId: question.course.id,
            userId: user.id
          }
        }
      })

      if (!enrollment || !question.isActive) {
        return {
          success: false,
          error: 'Question not available'
        }
      }
    }

    return {
      success: true,
      data: question
    }
  } catch (error) {
    console.error('Get question error:', error)
    return {
      success: false,
      error: 'Failed to fetch question'
    }
  }
}

// Update Question Action
export async function updateQuestion(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const validatedFields = updateQuestionSchema.safeParse({
      id: formData.get('id'),
      courseId: formData.get('courseId'),
      title: formData.get('title'),
      description: formData.get('description'),
      submissionType: formData.get('submissionType'),
      assessmentPrompt: formData.get('assessmentPrompt') || undefined,
      criteria: parseArrayField(formData, 'criteria'),
      redFlags: parseArrayField(formData, 'redFlags'),
      conditionalChecks: parseArrayField(formData, 'conditionalChecks'),
      guidance: formData.get('guidance') || undefined,
      questionNumber: formData.get('questionNumber') ? Number(formData.get('questionNumber')) : undefined,
      isActive: formData.get('isActive') === 'true',
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data: ' + validatedFields.error.errors.map(e => e.message).join(', ')
      }
    }

    const { id, courseId, questionNumber, isActive, ...updateData } = validatedFields.data

    // Check if question exists and user has permission
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      include: {
        course: true
      }
    })

    if (!existingQuestion) {
      return {
        success: false,
        error: 'Question not found'
      }
    }

    if (!canManageCourse(user.role, existingQuestion.course.creatorId, user.id)) {
      return {
        success: false,
        error: 'You do not have permission to edit this question'
      }
    }

    // If question number is being changed, check for conflicts
    if (questionNumber && questionNumber !== existingQuestion.questionNumber) {
      const conflictingQuestion = await prisma.question.findUnique({
        where: {
          courseId_questionNumber: {
            courseId: existingQuestion.courseId,
            questionNumber
          }
        }
      })

      if (conflictingQuestion) {
        return {
          success: false,
          error: `Question number ${questionNumber} is already taken in this course`
        }
      }
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        ...updateData,
        questionNumber: questionNumber ?? undefined,
        isActive: isActive ?? undefined,
      },
      include: {
        course: {
          select: { name: true }
        },
        baseExamples: true,
        _count: {
          select: { submissions: true }
        }
      }
    })

    revalidatePath(`/admin/courses/${existingQuestion.courseId}`)
    revalidatePath(`/admin/courses/${existingQuestion.courseId}/questions`)
    revalidatePath(`/admin/questions/${id}`)
    return {
      success: true,
      data: updatedQuestion
    }
  } catch (error) {
    console.error('Update question error:', error)
    return {
      success: false,
      error: 'Failed to update question'
    }
  }
}

// Delete Question Action
export async function deleteQuestion(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const questionId = formData.get('id') as string

    if (!questionId) {
      return {
        success: false,
        error: 'Question ID is required'
      }
    }

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
      return {
        success: false,
        error: 'Question not found'
      }
    }

    if (!canManageCourse(user.role, existingQuestion.course.creatorId, user.id)) {
      return {
        success: false,
        error: 'You do not have permission to delete this question'
      }
    }

    // Check if question has submissions
    if (existingQuestion._count.submissions > 0) {
      return {
        success: false,
        error: 'Cannot delete question with existing submissions. Archive it instead.'
      }
    }

    await prisma.question.delete({
      where: { id: questionId }
    })

    revalidatePath(`/admin/courses/${existingQuestion.courseId}`)
    revalidatePath(`/admin/courses/${existingQuestion.courseId}/questions`)
    return {
      success: true,
      data: { message: 'Question deleted successfully' }
    }
  } catch (error) {
    console.error('Delete question error:', error)
    return {
      success: false,
      error: 'Failed to delete question'
    }
  }
}

// Create Base Example Action
export async function createBaseExample(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const validatedFields = baseExampleSchema.safeParse({
      questionId: formData.get('questionId'),
      title: formData.get('title'),
      description: formData.get('description') || undefined,
      content: formData.get('content'),
      fileUrl: formData.get('fileUrl') || undefined,
      metadata: formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined,
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data: ' + validatedFields.error.errors.map(e => e.message).join(', ')
      }
    }

    const { questionId, title, description, content, fileUrl, metadata } = validatedFields.data

    // Check if question exists and user has permission
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        course: true
      }
    })

    if (!question) {
      return {
        success: false,
        error: 'Question not found'
      }
    }

    if (!canManageCourse(user.role, question.course.creatorId, user.id)) {
      return {
        success: false,
        error: 'You do not have permission to add base examples to this question'
      }
    }

    const baseExample = await prisma.baseExample.create({
      data: {
        questionId,
        title,
        description,
        content,
        fileUrl,
        metadata,
        createdBy: user.id,
      },
      include: {
        question: {
          select: { title: true, course: { select: { name: true } } }
        }
      }
    })

    revalidatePath(`/admin/courses/${question.course.id}`)
    revalidatePath(`/admin/questions/${questionId}`)
    return {
      success: true,
      data: baseExample
    }
  } catch (error) {
    console.error('Create base example error:', error)
    return {
      success: false,
      error: 'Failed to create base example'
    }
  }
}

// Update Base Example Action
export async function updateBaseExample(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const baseExampleId = formData.get('id') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const content = formData.get('content') as string
    const fileUrl = formData.get('fileUrl') as string
    const metadataString = formData.get('metadata') as string

    if (!baseExampleId || !title || !content) {
      return {
        success: false,
        error: 'Base example ID, title, and content are required'
      }
    }

    // Check if base example exists and user has permission
    const existingBaseExample = await prisma.baseExample.findUnique({
      where: { id: baseExampleId },
      include: {
        question: {
          include: {
            course: true
          }
        }
      }
    })

    if (!existingBaseExample) {
      return {
        success: false,
        error: 'Base example not found'
      }
    }

    if (!canManageCourse(user.role, existingBaseExample.question.course.creatorId, user.id)) {
      return {
        success: false,
        error: 'You do not have permission to edit this base example'
      }
    }

    let metadata = null
    if (metadataString) {
      try {
        metadata = JSON.parse(metadataString)
      } catch {
        return {
          success: false,
          error: 'Invalid metadata JSON format'
        }
      }
    }

    const updatedBaseExample = await prisma.baseExample.update({
      where: { id: baseExampleId },
      data: {
        title,
        description: description || null,
        content,
        fileUrl: fileUrl || null,
        metadata,
      },
      include: {
        question: {
          select: { title: true, course: { select: { name: true } } }
        }
      }
    })

    revalidatePath(`/admin/courses/${existingBaseExample.question.course.id}`)
    revalidatePath(`/admin/questions/${existingBaseExample.questionId}`)
    return {
      success: true,
      data: updatedBaseExample
    }
  } catch (error) {
    console.error('Update base example error:', error)
    return {
      success: false,
      error: 'Failed to update base example'
    }
  }
}

// Delete Base Example Action
export async function deleteBaseExample(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireRole([UserRole.SUPER_ADMIN, UserRole.COURSE_ADMIN])

    const baseExampleId = formData.get('id') as string

    if (!baseExampleId) {
      return {
        success: false,
        error: 'Base example ID is required'
      }
    }

    // Check if base example exists and user has permission
    const existingBaseExample = await prisma.baseExample.findUnique({
      where: { id: baseExampleId },
      include: {
        question: {
          include: {
            course: true
          }
        }
      }
    })

    if (!existingBaseExample) {
      return {
        success: false,
        error: 'Base example not found'
      }
    }

    if (!canManageCourse(user.role, existingBaseExample.question.course.creatorId, user.id)) {
      return {
        success: false,
        error: 'You do not have permission to delete this base example'
      }
    }

    await prisma.baseExample.delete({
      where: { id: baseExampleId }
    })

    revalidatePath(`/admin/courses/${existingBaseExample.question.course.id}`)
    revalidatePath(`/admin/questions/${existingBaseExample.questionId}`)
    return {
      success: true,
      data: { message: 'Base example deleted successfully' }
    }
  } catch (error) {
    console.error('Delete base example error:', error)
    return {
      success: false,
      error: 'Failed to delete base example'
    }
  }
}